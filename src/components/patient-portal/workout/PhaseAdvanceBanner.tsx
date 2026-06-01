// ITEM 7 — Banner da fase atual + transição de fase (com modal de confirmação).
import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { workoutExtrasService, type Periodization, type PeriodizationPhase } from '@/lib/workout/workout-extras-service';
import { cn } from '@/lib/utils';

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
  onPhaseChanged: () => void;
}

export function PhaseAdvanceBanner({ token, planId, planCreatedAt, onPhaseChanged }: Props) {
  const [periodization, setPeriodization] = useState<Periodization | null>(null);
  const [sessionsInPhase, setSessionsInPhase] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showAllPhases, setShowAllPhases] = useState(false);
  const [adherence, setAdherence] = useState(0);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const p = await workoutExtrasService.getPlanPeriodization(token, planId);
      if (!p) { setPeriodization(null); return; }
      setPeriodization(p);

      const since = p.phase_started_at ?? planCreatedAt;
      const [count, adh] = await Promise.all([
        workoutExtrasService.countSessionsInPhase(token, planId, since),
        workoutExtrasService.getWeeklyAdherence(token, planId, 2),
      ]);
      setSessionsInPhase(count);
      if (adh.length > 0) {
        const avg = adh.reduce((s, w) => s + Number(w.adherence_pct), 0) / adh.length;
        setAdherence(Math.round(avg));
      }
    } catch (err) {
      console.error('Erro ao carregar periodização:', err);
      setPeriodization(null);
    }
  }, [token, planId, planCreatedAt]);

  useEffect(() => { void reload(); }, [reload]);

  if (!periodization || periodization.phases.length === 0) return null;

  const currentPhase = periodization.phases[periodization.current_phase_index];
  const nextPhase = periodization.phases[periodization.current_phase_index + 1];
  if (!currentPhase) return null;

  const sessionsLeft = (currentPhase.duration_sessions ?? 0) - sessionsInPhase;
  const readyToAdvance = sessionsLeft <= 0 && !!nextPhase;
  const color = PHASE_COLORS[(currentPhase.preset ?? 'custom').toLowerCase()] ?? PHASE_COLORS.custom;

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

  const handleAdvanceClick = async () => {
    if (!nextPhase) return;
    const nextIdx = periodization.current_phase_index + 1;
    setBusy(true);
    try {
      const hasDiff = await workoutExtrasService.phaseChangeHasVisibleDiff(token, planId, nextIdx);
      if (!hasDiff) {
        await workoutExtrasService.applyPhaseChange(token, planId, nextIdx);
        await reload();
        onPhaseChanged();
        return;
      }
      setShowModal(true);
    } catch (err) {
      console.error('Erro ao avançar fase:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmAdvance = async () => {
    const nextIdx = periodization.current_phase_index + 1;
    setBusy(true);
    try {
      await workoutExtrasService.applyPhaseChange(token, planId, nextIdx);
      setShowModal(false);
      await reload();
      onPhaseChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={cn('rounded-lg border-2 p-3 text-sm', color)}>
        <div className="font-bold">💪 Fase atual: {currentPhase.label}</div>
        <div className="mt-0.5 text-xs">
          {currentPhase.sets_override ? `${currentPhase.sets_override} séries` : ''}
          {currentPhase.reps_override ? ` × ${currentPhase.reps_override} reps` : ''}
          {currentPhase.load_pct_change ? ` · cargas ${currentPhase.load_pct_change > 0 ? '+' : ''}${currentPhase.load_pct_change}%` : ''}
          {currentPhase.rpe_per_set_override ? ` · RPE alvo ${currentPhase.rpe_per_set_override}` : ''}
        </div>
        {nextPhase && !readyToAdvance && (
          <div className="mt-1 text-[11px] italic opacity-80">
            Faltam {sessionsLeft} treino{sessionsLeft !== 1 ? 's' : ''} pra próxima fase ({nextPhase.label})
          </div>
        )}
        {readyToAdvance && (
          <button
            onClick={() => void handleAdvanceClick()}
            disabled={busy}
            className="mt-2 rounded bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-60"
          >
            🚀 Avançar pra {nextPhase.label}
          </button>
        )}
      </div>

      {/* Prévia da periodização completa — todas as fases já vêm no payload */}
      {periodization.phases.length > 1 && (
        <div className="mt-2">
          <button
            onClick={() => setShowAllPhases((v) => !v)}
            className="text-xs font-medium text-purple-700 hover:text-purple-800"
          >
            {showAllPhases ? '▾ Ocultar periodização' : '▸ Ver periodização completa'} ({periodization.phases.length} fases)
          </button>

          {showAllPhases && (
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Pronto pra avançar pra {nextPhase?.label}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Você completou {sessionsInPhase} treinos da fase {currentPhase.label}.</p>
            <p className="text-sm">Adesão das últimas 2 semanas: <strong>{adherence}%</strong></p>

            {adherence < 50 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                ⚠️ Você completou menos de 50% dos treinos previstos. Recomendamos repetir a fase atual antes de avançar.
              </div>
            )}

            {nextPhase && (
              <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                <div className="mb-2 font-semibold">O que vai mudar:</div>
                <ul className="space-y-1 text-xs">
                  {nextPhase.sets_override && <li>• Séries: {currentPhase.sets_override ?? 'atual'} → <strong>{nextPhase.sets_override}</strong></li>}
                  {nextPhase.reps_override && <li>• Reps: {currentPhase.reps_override ?? 'atual'} → <strong>{nextPhase.reps_override}</strong></li>}
                  {nextPhase.load_pct_change && <li>• Cargas: <strong>{nextPhase.load_pct_change > 0 ? '+' : ''}{nextPhase.load_pct_change}%</strong></li>}
                  {nextPhase.rpe_per_set_override && <li>• RPE: <strong>{nextPhase.rpe_per_set_override}</strong></li>}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            {adherence < 50 && (
              <Button variant="outline" onClick={() => setShowModal(false)} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                Repetir fase atual
              </Button>
            )}
            <Button onClick={() => void handleConfirmAdvance()} disabled={busy} className="bg-purple-600 text-white hover:bg-purple-700">
              🚀 Confirmar avanço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
