// ITEM 7 — Banner da fase atual + prévia da periodização.
// O avanço de fase é AUTOMÁTICO por tempo (semanas decorridas): aplicado no
// servidor por auto_advance_plan_phase_by_token e disparado ao carregar o Treino.
// Aqui só exibimos a fase atual, a estimativa da próxima e a timeline completa.
import { useCallback, useEffect, useState } from 'react';
import { workoutExtrasService, type Periodization, type PeriodizationPhase } from '@/lib/workout/workout-extras-service';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ChevronRightCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PHASE_COLORS: Record<string, string> = {
  base: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  forca: 'border-rose-300 bg-rose-50 text-rose-900',
  força: 'border-rose-300 bg-rose-50 text-rose-900',
  regenerativo: 'border-sky-300 bg-sky-50 text-sky-900',
  deload: 'border-amber-300 bg-amber-50 text-amber-900',
  custom: 'border-slate-300 bg-slate-50 text-slate-900',
};

// Cor do marcador (bolinha) de cada fase na timeline, por preset.
const PHASE_DOT: Record<string, string> = {
  base: 'bg-emerald-500',
  forca: 'bg-rose-500',
  força: 'bg-rose-500',
  regenerativo: 'bg-sky-500',
  deload: 'bg-amber-500',
  custom: 'bg-slate-400',
};

interface Props {
  token: string;
  planId: string;
  planCreatedAt: string;
  /** Mantido por compatibilidade — o avanço agora é automático ao carregar o Treino. */
  onPhaseChanged?: () => void;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function PhaseAdvanceBanner({ token, planId, planCreatedAt, onPhaseChanged }: Props) {
  const { toast } = useToast();
  const [periodization, setPeriodization] = useState<Periodization | null>(null);
  const [showAllPhases, setShowAllPhases] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const reload = useCallback(async () => {
    try {
      const p = await workoutExtrasService.getPlanPeriodization(token, planId);
      setPeriodization(p ?? null);
    } catch (err) {
      console.error('Erro ao carregar periodização:', err);
      setPeriodization(null);
    }
  }, [token, planId]);

  useEffect(() => { void reload(); }, [reload]);

  if (!periodization || periodization.phases.length === 0) return null;

  const currentPhase = periodization.phases[periodization.current_phase_index];
  const nextPhase = periodization.phases[periodization.current_phase_index + 1];
  if (!currentPhase) return null;

  const color = PHASE_COLORS[(currentPhase.preset ?? 'custom').toLowerCase()] ?? PHASE_COLORS.custom;
  const isDeload =
    (currentPhase.preset ?? '').toLowerCase() === 'regenerativo' ||
    (currentPhase.load_pct_change ?? 0) < 0;

  // Resumo curto dos parâmetros de uma fase (séries/reps/RPE — a carga vai num pill à parte).
  const phaseSummary = (ph: PeriodizationPhase) =>
    [
      ph.sets_override ? `${ph.sets_override} séries` : null,
      ph.reps_override ? `${ph.reps_override} reps` : null,
      ph.rpe_per_set_override ? `RPE ${ph.rpe_per_set_override}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const phaseDuration = (ph: PeriodizationPhase) =>
    ph.duration_weeks
      ? `${ph.duration_weeks} ${ph.duration_weeks === 1 ? 'semana' : 'semanas'}`
      : ph.duration_sessions
        ? `${ph.duration_sessions} treinos`
        : null;

  // Estimativa de quando a próxima fase entra (semanas desde o início do plano).
  const elapsedWeeks = Math.max(0, Math.floor((Date.now() - new Date(planCreatedAt).getTime()) / WEEK_MS));
  let cumThroughCurrent = 0;
  for (let i = 0; i <= periodization.current_phase_index; i++) {
    cumThroughCurrent += periodization.phases[i].duration_weeks ?? 1;
  }
  const weeksLeft = Math.max(0, cumThroughCurrent - elapsedWeeks);

  const doAdvance = async () => {
    if (!nextPhase) return;
    setAdvancing(true);
    try {
      await workoutExtrasService.setPlanPhase(token, planId, periodization.current_phase_index + 1);
      toast({ title: 'Fase alterada 💪', description: `Você avançou para: ${nextPhase.label}.` });
      setConfirmAdvance(false);
      onPhaseChanged?.();
      await reload();
    } catch (e: any) {
      toast({ title: 'Erro ao mudar de fase', description: e?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <>
      {/* Layout em coluna: titulo+info ocupam a largura toda; acoes (avancar
          fase / ver periodizacao) ficam como links pequenos no rodape. Antes
          o botao 'Avancar fase' lateral comia metade do card e empurrava o
          texto pra quebrar em 'RPE alvo 9/10/10' / 'Proxima: ...' / etc. */}
      <div className={cn('rounded-lg border-2 p-3 text-sm', color)}>
        <div className="font-bold">💪 Fase atual: {currentPhase.label}</div>
        <div className="mt-0.5 text-xs">
          {currentPhase.sets_override ? `${currentPhase.sets_override} séries` : ''}
          {currentPhase.reps_override ? ` × ${currentPhase.reps_override} reps` : ''}
          {currentPhase.load_pct_change ? ` · cargas ${currentPhase.load_pct_change > 0 ? '+' : ''}${currentPhase.load_pct_change}%` : ''}
          {currentPhase.rpe_per_set_override ? ` · RPE alvo ${currentPhase.rpe_per_set_override}` : ''}
        </div>
        {isDeload && (
          <div className="mt-2 rounded-md bg-white/70 px-2.5 py-1.5 text-xs font-medium text-sky-900">
            🧘 Semana leve (deload): a carga reduz de propósito. Foque em <strong>técnica</strong> e <strong>recuperação</strong> — não force.
          </div>
        )}
        {nextPhase ? (
          <div className="mt-1 text-[11px] italic opacity-80">
            Próxima: {nextPhase.label} {weeksLeft <= 0 ? '(em breve)' : `em ~${weeksLeft} ${weeksLeft === 1 ? 'semana' : 'semanas'}`} · avança sozinho
          </div>
        ) : (
          <div className="mt-1 text-[11px] italic opacity-80">Última fase da periodização 🎯</div>
        )}

        {/* Links de acao no rodape do card: 'Ver periodizacao' a esquerda
            (acao leitura, mais comum) e 'Avancar fase' a direita (acao escrita,
            mais rara). Ambos discretos, na cor da fase. */}
        {(nextPhase || periodization.phases.length > 1) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-current/15 pt-2 text-[11px] font-medium opacity-80">
            {periodization.phases.length > 1 && (
              <button
                onClick={() => setShowAllPhases((v) => !v)}
                className="inline-flex items-center gap-1 hover:opacity-100 hover:underline"
              >
                {showAllPhases ? '▾ Ocultar periodização' : '▸ Ver periodização'} ({periodization.phases.length} fases)
              </button>
            )}
            {nextPhase && (
              <button
                onClick={() => setConfirmAdvance(true)}
                className="ml-auto inline-flex items-center gap-1 hover:opacity-100 hover:underline"
              >
                <ChevronRightCircle className="h-3 w-3" /> Avançar fase manualmente
              </button>
            )}
          </div>
        )}
      </div>

      {nextPhase && (
        <AlertDialog open={confirmAdvance} onOpenChange={(v) => !advancing && setConfirmAdvance(v)}>
          <AlertDialogContent className="bg-white border-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-800">Avançar para {nextPhase.label}?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500">
                Normalmente as fases avançam <strong>sozinhas</strong> conforme as semanas passam. Só avance
                manualmente se o seu treinador orientou. Ao confirmar, as cargas e séries da nova fase já
                passam a valer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={advancing} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); void doAdvance(); }}
                disabled={advancing}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {advancing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Sim, avançar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Timeline completa (toggle no rodape do card acima) */}
      {periodization.phases.length > 1 && showAllPhases && (
        <div className="mt-2">
          {(
            <ol className="relative mt-3 space-y-2 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
              {periodization.phases.map((ph, i) => {
                const status =
                  i < periodization.current_phase_index
                    ? 'done'
                    : i === periodization.current_phase_index
                      ? 'current'
                      : 'upcoming';
                const summary = phaseSummary(ph);
                const duration = phaseDuration(ph);
                const dot = PHASE_DOT[(ph.preset ?? 'custom').toLowerCase()] ?? PHASE_DOT.custom;
                return (
                  <li key={ph.id} className="relative flex items-start gap-2.5 pl-0">
                    <span
                      className={cn(
                        'z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white',
                        status === 'done' ? 'bg-emerald-500 text-white' : status === 'current' ? `${dot} text-white` : 'bg-slate-200 text-slate-500',
                      )}
                    >
                      {status === 'done' ? '✓' : i + 1}
                    </span>
                    <div
                      className={cn(
                        'min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-xs',
                        status === 'current' ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white',
                        status === 'done' && 'opacity-70',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{ph.label}</span>
                        {duration && <span className="text-slate-400">· {duration}</span>}
                        {status === 'current' && (
                          <span className="rounded bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Atual</span>
                        )}
                        {ph.load_pct_change != null && ph.load_pct_change !== 0 && (
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-bold',
                              ph.load_pct_change > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                            )}
                          >
                            {ph.load_pct_change > 0 ? '↑' : '↓'} carga {ph.load_pct_change > 0 ? '+' : ''}{ph.load_pct_change}%
                          </span>
                        )}
                      </div>
                      {summary && <div className="mt-0.5 text-slate-500">{summary}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </>
  );
}

