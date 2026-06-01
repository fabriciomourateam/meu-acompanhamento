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
import { Dumbbell, HeartPulse, BarChart3, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { workoutService } from '@/lib/workout/workout-service';
import { workoutExtrasService } from '@/lib/workout/workout-extras-service';
import type { WorkoutHub, HubSession } from '@/lib/workout/types';
import { GuidelinesBanner } from './GuidelinesBanner';
import { PhaseAdvanceBanner } from './PhaseAdvanceBanner';
import { CardioSubtab } from './CardioSubtab';
import { AnalyticsSubtab } from './AnalyticsSubtab';
import { WorkoutSessionRunner } from './WorkoutSessionRunner';

interface WorkoutTabProps {
  token: string;
  active: boolean;
  patientName?: string;
  patientId?: string;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const h = await workoutService.getHub(token);
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
  }, [token, toast]);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  const { workoutSessions, cardioSessions, guidelinesSessions } = useMemo(() => {
    const all = hub?.sessions ?? [];
    return {
      workoutSessions: all.filter((s) => (s.session_type ?? 'workout') === 'workout'),
      cardioSessions: all.filter((s) => s.session_type === 'cardio'),
      guidelinesSessions: all.filter((s) => s.session_type === 'guidelines'),
    };
  }, [hub]);

  const openSession = useMemo<HubSession | null>(
    () => workoutSessions.find((s) => s.id === openSessionId) ?? null,
    [workoutSessions, openSessionId],
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
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center space-y-3">
          <Dumbbell className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-semibold text-slate-700">Nenhum treino liberado</h3>
          <p className="text-sm text-slate-500">Seu treinador ainda não liberou um plano. Assim que ele liberar, ele aparece aqui.</p>
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
          className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar pros treinos
        </button>
        <WorkoutSessionRunner token={token} plan={plan} session={openSession} patientId={patientId} onFinished={() => { setOpenSessionId(null); void load(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <GuidelinesBanner sessions={guidelinesSessions} generalNotes={generalNotes} />

      <PhaseAdvanceBanner
        token={token}
        planId={plan.id}
        planCreatedAt={plan.created_at}
        onPhaseChanged={() => void load()}
      />

      <Tabs value={subtab} onValueChange={(v) => setSubtab(v as typeof subtab)}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg h-auto">
          <TabsTrigger value="workouts" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all">
            <Dumbbell className="h-4 w-4 mr-1.5" />
            Treinos
            {workoutSessions.length > 0 && <span className="ml-1 text-xs opacity-70">{workoutSessions.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="cardios" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all">
            <HeartPulse className="h-4 w-4 mr-1.5" />
            Cardios
            {cardioSessions.length > 0 && <span className="ml-1 text-xs opacity-70">{cardioSessions.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 py-2 rounded-md transition-all">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="mt-3 space-y-2.5">
          {workoutSessions.length === 0 ? (
            <p className="py-6 text-center text-sm italic text-slate-500">Nenhum treino cadastrado neste plano.</p>
          ) : (
            workoutSessions.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setOpenSessionId(s.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
              >
                <span className="inline-flex shrink-0 items-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 px-2.5 py-1 text-xs font-bold text-white">
                  {sessionBadge(plan.session_naming_style, i, s.day_of_week)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-800">{s.name}</div>
                  {s.focus && <div className="truncate text-xs text-slate-500">{s.focus}</div>}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{s.exercises.length} exec.</span>
              </button>
            ))
          )}
        </TabsContent>

        <TabsContent value="cardios" className="mt-3">
          <CardioSubtab token={token} prescribedSessions={cardioSessions} patientId={patientId} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-3">
          <AnalyticsSubtab token={token} planId={plan.id} patientName={patientName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
