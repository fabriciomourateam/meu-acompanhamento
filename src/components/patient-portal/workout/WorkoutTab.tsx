// Aba TREINO — hub do aluno (Ondas 2-4):
//  • Banner "Orientações importantes" (ITEM 6) + Banner de fase (ITEM 7)
//  • Sub-abas Treinos / Cardios / Análise (ITEM 2)
//  • Sessions filtradas por session_type (ITEM 1)
//  • Badge T1/Treino A conforme session_naming_style (ITEM 3)
//  • Execução (ITEM 8/9/10) via WorkoutSessionRunner
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Dumbbell, HeartPulse, BarChart3, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { workoutService } from '@/lib/workout/workout-service';
import { workoutExtrasService } from '@/lib/workout/workout-extras-service';
import type { WorkoutHub, HubSession } from '@/lib/workout/types';
import { GuidelinesBanner } from './GuidelinesBanner';
import { PhaseAdvanceBanner } from './PhaseAdvanceBanner';
import { CardioSubtab } from './CardioSubtab';
import { AnalyticsSubtab } from './AnalyticsSubtab';
import { WorkoutSessionRunner } from './WorkoutSessionRunner';
import { MobilityBlock } from './MobilityBlock';

interface WorkoutTabProps {
  token: string;
  active: boolean;
  patientName?: string;
  patientId?: string;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Cabeçalho premium do plano: separa o título (antes do ":") da frequência
// (depois do ":") — ex.: "✅ MUSCULAÇÃO: 3 a 4x na semana". Quando ha mais de
// um plano, vira navegacao com setas ◂ ▸ (alterna entre MUSCULACAO/Vacuum
// etc), substituindo os chips que existiam acima desse card.
function PlanHeader({
  name,
  onPrev,
  onNext,
  positionLabel,
}: {
  name: string;
  onPrev?: () => void;
  onNext?: () => void;
  positionLabel?: string;
}) {
  const raw = name.trim();
  const ci = raw.indexOf(':');
  const title = ci > 0 ? raw.slice(0, ci).trim() : raw;
  const freq = ci > 0 ? raw.slice(ci + 1).trim() : '';
  const isSelector = !!(onPrev || onNext);
  return (
    <div className="flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 shadow-sm">
      {isSelector ? (
        <button
          type="button"
          onClick={onPrev}
          aria-label="Plano anterior"
          className="shrink-0 rounded-full p-1.5 text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}
      <div className="flex-1 min-w-0 text-center">
        <span className="font-bold text-slate-800 dark:text-slate-200">{title}</span>{freq ? `: ${freq}` : ''}
        {positionLabel && (
          <span className="ml-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">{positionLabel}</span>
        )}
      </div>
      {isSelector ? (
        <button
          type="button"
          onClick={onNext}
          aria-label="Próximo plano"
          className="shrink-0 rounded-full p-1.5 text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}


function sessionBadge(namingStyle: 'numeric' | 'letter' | null, index: number, dayOfWeek: number | null): string {
  const base = namingStyle === 'letter' ? `Treino ${String.fromCharCode(65 + index)}` : `T${index + 1}`;
  // day_of_week: convenção DOW do Postgres (0=Dom..6=Sáb), igual ao JS getDay().
  // Mesma base usada pelo calendário e pela RPC get_today_workout_by_token.
  if (dayOfWeek != null && dayOfWeek >= 0 && dayOfWeek <= 6) return `${DAYS[dayOfWeek]} · ${base}`;
  return base;
}

export function WorkoutTab({ token, active, patientName, patientId }: WorkoutTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState<WorkoutHub | null>(null);
  const [generalNotes, setGeneralNotes] = useState<string | null>(null);
  const [subtab, setSubtab] = useState<'workouts' | 'cardios' | 'analytics'>('workouts');
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  // Planos ativos do aluno (seletor aparece quando há mais de um).
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  // Portão de adesão antes de uma fase de Força (<50% na fase anterior).
  const [forcaGate, setForcaGate] = useState<{ planId: string; adherence: number } | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      let h = await workoutService.getHub(token, selectedPlanId);
      // Auto-avanço de fase por tempo. Se for entrar numa fase de Força, a RPC
      // segura (needs_forca_confirmation): checamos a adesão — >=50% avança
      // direto; <50% abre o portão pra o aluno decidir (avançar ou repetir).
      const planId = h.plan?.id;
      if (planId && h.plan?.periodization_template_id) {
        try {
          const res = await workoutExtrasService.autoAdvancePhase(token, planId);
          if (res.needs_forca_confirmation) {
            const adh = await workoutExtrasService.getWeeklyAdherence(token, planId, 2);
            const avg = adh.length
              ? Math.round(adh.reduce((s, w) => s + Number(w.adherence_pct), 0) / adh.length)
              : 0;
            if (avg >= 50) {
              await workoutExtrasService.autoAdvancePhase(token, planId, true);
            } else {
              setForcaGate({ planId, adherence: avg });
            }
            h = await workoutService.getHub(token, selectedPlanId);
          } else if (res.advanced) {
            h = await workoutService.getHub(token, selectedPlanId);
          }
          // Aviso no sino alguns dias antes de uma fase de Força (idempotente).
          workoutExtrasService.maybeNotifyUpcomingForca(token, planId, 5).catch(() => {});
        } catch (e) {
          console.error('Falha no auto-avanço de fase:', e);
        }
      }
      setHub(h);
      if (h.plan?.periodization_template_id) {
        workoutExtrasService.getPeriodizationGeneralNotes(token, h.plan.periodization_template_id)
          .then(setGeneralNotes)
          .catch(() => setGeneralNotes(null));
      } else {
        setGeneralNotes(null);
      }
    } catch (err: any) {
      console.error('Erro ao carregar treino:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar seu treino', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, toast, selectedPlanId]);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  // Carrega a lista de planos ativos (pro seletor). Só fixa uma seleção quando
  // há mais de um plano — assim o caso comum (1 plano) não dispara reload.
  useEffect(() => {
    if (!active || !token) return;
    let cancelled = false;
    workoutService.listActivePlans(token)
      .then((ps) => {
        if (cancelled) return;
        setPlans(ps);
        if (ps.length > 1) setSelectedPlanId((cur) => cur ?? ps[0].id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [active, token]);

  // Aluno optou por avançar pra Força mesmo com adesão baixa.
  const handleConfirmForca = async () => {
    if (!forcaGate) return;
    setGateBusy(true);
    try {
      await workoutExtrasService.autoAdvancePhase(token, forcaGate.planId, true);
      setForcaGate(null);
      await load();
    } catch (e) {
      console.error('Erro ao confirmar Força:', e);
      toast({ title: 'Não consegui avançar agora', description: 'Tenta de novo em instantes.', variant: 'destructive' });
    } finally {
      setGateBusy(false);
    }
  };

  // Aluno optou por repetir a fase atual por mais uma semana.
  const handleRepeatPhase = async () => {
    if (!forcaGate) return;
    setGateBusy(true);
    try {
      await workoutExtrasService.repeatCurrentPhase(token, forcaGate.planId);
      setForcaGate(null);
      await load();
      toast({ title: 'Beleza!', description: 'Você fica mais uma semana na fase atual antes de avançar.' });
    } catch (e) {
      console.error('Erro ao repetir fase:', e);
      toast({ title: 'Não consegui salvar agora', description: 'Tenta de novo em instantes.', variant: 'destructive' });
    } finally {
      setGateBusy(false);
    }
  };

  const { workoutSessions, cardioSessions, guidelinesSessions, mobilitySessions } = useMemo(() => {
    const all = hub?.sessions ?? [];
    return {
      // Treino convencional eh tudo que nao eh cardio/guidelines/mobility.
      workoutSessions: all.filter((s) => {
        const t = s.session_type ?? 'workout';
        return t === 'workout';
      }),
      cardioSessions: all.filter((s) => s.session_type === 'cardio'),
      guidelinesSessions: all.filter((s) => s.session_type === 'guidelines'),
      // Mobilidade: aparece em destaque ACIMA do treino principal nas
      // sub-abas de Treinos e Cardios (definido pelo nutri no MyShape).
      mobilitySessions: all.filter((s) => s.session_type === 'mobility'),
    };
  }, [hub]);

  const openSession = useMemo<HubSession | null>(
    () => [...workoutSessions, ...mobilitySessions].find((s) => s.id === openSessionId) ?? null,
    [workoutSessions, mobilitySessions, openSessionId],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!hub?.plan) {
    return (
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-8 text-center space-y-3">
          <Dumbbell className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Nenhum treino liberado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Seu treinador ainda não liberou um plano. Assim que ele liberar, ele aparece aqui.</p>
        </CardContent>
      </Card>
    );
  }

  const plan = hub.plan;

  // Modo execução: uma sessão aberta ocupa a tela toda.
  if (openSession) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setOpenSessionId(null)}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar pros treinos
        </button>
        <WorkoutSessionRunner token={token} plan={plan} session={openSession} patientId={patientId} onFinished={() => { setOpenSessionId(null); void load(); }} />
      </div>
    );
  }

  const activePlanId = selectedPlanId ?? plan.id;

  // Navegacao entre planos (quando ha mais de um): o card 'PlanHeader' vira
  // o seletor — setas laterais ◂ ▸ alternam entre os planos disponiveis.
  // Substitui os chips de cima 'MUSCULACAO / Vacuum' que duplicavam o card.
  const planIndex = plans.findIndex((p) => p.id === activePlanId);
  const goToPlan = (delta: -1 | 1) => {
    if (plans.length < 2) return;
    const next = plans[(planIndex + delta + plans.length) % plans.length];
    if (next?.id !== activePlanId) {
      setOpenSessionId(null);
      setSelectedPlanId(next.id);
    }
  };

  return (
    <div className="space-y-3">
      <GuidelinesBanner sessions={guidelinesSessions} generalNotes={generalNotes} planNotes={plan.notes} patientId={patientId} />

      <PhaseAdvanceBanner
        token={token}
        planId={plan.id}
        planCreatedAt={plan.created_at}
        onPhaseChanged={() => void load()}
      />

      <Tabs value={subtab} onValueChange={(v) => setSubtab(v as typeof subtab)}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg h-auto">
          <TabsTrigger value="workouts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 py-2 rounded-md transition-all">
            <Dumbbell className="h-4 w-4 mr-1.5" />
            Treinos
            {workoutSessions.length > 1 && <span className="ml-1 text-xs opacity-70">{workoutSessions.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="cardios" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 py-2 rounded-md transition-all">
            <HeartPulse className="h-4 w-4 mr-1.5" />
            Cardios
            {cardioSessions.length > 1 && <span className="ml-1 text-xs opacity-70">{cardioSessions.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 py-2 rounded-md transition-all">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="mt-3 space-y-2.5">
          {/* Cabecalho do plano: quando ha mais de um plano (MUSCULACAO / Vacuum
              etc), vira navegacao com setas ◂ ▸ — substitui os chips de cima
              que estavam duplicando o nome do plano. */}
          {plan.name && (
            <PlanHeader
              name={plan.name}
              onPrev={plans.length > 1 ? () => goToPlan(-1) : undefined}
              onNext={plans.length > 1 ? () => goToPlan(1) : undefined}
              positionLabel={plans.length > 1 ? `${planIndex + 1}/${plans.length}` : undefined}
            />
          )}

          {/* Bloco de Mobilidade — em destaque ACIMA do treino convencional.
              Definido pelo nutri no MyShape como session_type='mobility'. */}
          {mobilitySessions.length > 0 && (
            <MobilityBlock
              sessions={mobilitySessions}
              onOpen={(id) => setOpenSessionId(id)}
            />
          )}

          {workoutSessions.length === 0 ? (
            <p className="py-6 text-center text-sm italic text-slate-500 dark:text-slate-400">Nenhum treino cadastrado neste plano.</p>
          ) : (
            workoutSessions.map((s, i) => {
              // Evita subtitulo identico ao titulo (caso comum: 'Quadriceps + Gluteos'
              // no nome e no focus). So mostra focus quando agrega informacao.
              const showFocus = s.focus && s.focus.trim().toLowerCase() !== (s.name || '').trim().toLowerCase();
              return (
                <button
                  key={s.id}
                  onClick={() => setOpenSessionId(s.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
                >
                  <span className="inline-flex shrink-0 items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 px-2.5 py-1 text-xs font-bold text-white">
                    {sessionBadge(plan.session_naming_style, i, s.day_of_week)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-slate-800 dark:text-slate-200">{s.name}</div>
                    {showFocus && <div className="truncate text-xs text-slate-500 dark:text-slate-400">{s.focus}</div>}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{s.exercises.length} exec.</span>
                </button>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="cardios" className="mt-3">
          <CardioSubtab token={token} prescribedSessions={cardioSessions} patientId={patientId} planId={activePlanId} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-3">
          <AnalyticsSubtab token={token} planId={plan.id} patientName={patientName} />
        </TabsContent>
      </Tabs>

      {/* Portão de adesão antes de uma fase de Força */}
      <Dialog open={!!forcaGate} onOpenChange={(o) => !o && !gateBusy && setForcaGate(null)}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Pronto pra avançar pra Força?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>
              Sua adesão nas últimas semanas foi de <strong className="text-slate-900 dark:text-slate-100">{forcaGate?.adherence ?? 0}%</strong>.
            </p>
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-3 text-amber-900 dark:text-amber-200">
              ⚠️ Você completou menos de 50% dos treinos previstos. A fase de Força aumenta a carga (+10%) —
              recomendamos repetir a fase atual por mais uma semana antes de avançar.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => void handleRepeatPhase()}
              disabled={gateBusy}
              className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
            >
              Repetir a semana
            </Button>
            <Button
              onClick={() => void handleConfirmForca()}
              disabled={gateBusy}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              🚀 Avançar pra Força
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
