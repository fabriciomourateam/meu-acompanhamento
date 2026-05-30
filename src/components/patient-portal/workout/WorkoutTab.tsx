import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dumbbell, Flame, Trophy, PlayCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { workoutService } from '@/lib/workout/workout-service';
import type { TodayWorkout } from '@/lib/workout/types';
import { ExerciseCard, type CommitSetArgs } from './ExerciseCard';
import { type SetRowValue } from './SetRow';
import { RestTimer } from './RestTimer';
import { FinishSessionDialog } from './FinishSessionDialog';

interface WorkoutTabProps {
  token: string;
  active: boolean;
}

type SetMap = Record<string, SetRowValue[]>; // plannedExerciseId -> linhas

export function WorkoutTab({ token, active }: WorkoutTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<TodayWorkout | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [sessionLogId, setSessionLogId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [sets, setSets] = useState<SetMap>({});
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        workoutService.getTodayWorkout(token),
        workoutService.getStreak(token).catch(() => 0),
      ]);
      setToday(t);
      setStreak(s);
    } catch (err: any) {
      console.error('Erro ao carregar treino:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar seu treino', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  const handleStart = async () => {
    if (!today?.session?.id) return;
    setStarting(true);
    try {
      const id = await workoutService.startSession(token, today.session.id);
      setSessionLogId(id);
      toast({ title: 'Bora! 💪', description: 'Sessão iniciada — registre cada série conforme for fazendo.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao iniciar sessão', variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  const handleSetChange = (plannedId: string, idx: number, v: SetRowValue) => {
    setSets((prev) => {
      const arr = prev[plannedId] ? [...prev[plannedId]] : [];
      arr[idx] = v;
      return { ...prev, [plannedId]: arr };
    });
  };

  const handleCommit = async ({ plannedExerciseId, setIndex, value, restSeconds: rs }: CommitSetArgs) => {
    if (!sessionLogId) {
      toast({ title: 'Inicie a sessão primeiro', description: 'Toque em "Começar treino" no topo.', variant: 'destructive' });
      throw new Error('no session');
    }
    try {
      await workoutService.logSet(token, {
        sessionLogId,
        plannedExerciseId,
        setIndex,
        reps: value.reps,
        weightKg: value.weightKg,
        rpe: value.rpe,
      });
      if (rs && rs > 0) setRestSeconds(rs);
    } catch (err: any) {
      toast({ title: 'Erro ao salvar série', description: err.message || 'Tente novamente', variant: 'destructive' });
      throw err;
    }
  };

  const { doneSetsCount, totalVolume } = useMemo(() => {
    let count = 0;
    let vol = 0;
    Object.values(sets).forEach((arr) =>
      arr.forEach((s) => {
        if (s.done) {
          count += 1;
          vol += (s.weightKg ?? 0) * (s.reps ?? 0);
        }
      }),
    );
    return { doneSetsCount: count, totalVolume: vol };
  }, [sets]);

  const handleFinish = async (rating: number | null, notes: string) => {
    if (!sessionLogId) return;
    setFinishing(true);
    try {
      await workoutService.finishSession(token, sessionLogId, notes || null, rating);
      toast({ title: 'Treino finalizado! 🎉', description: `${doneSetsCount} séries · ${totalVolume.toFixed(0)} kg de volume.` });
      setSessionLogId(null);
      setSets({});
      load();
    } catch (err: any) {
      toast({ title: 'Erro ao finalizar', description: err.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!today?.plan) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8 text-center space-y-3">
          <Dumbbell className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-semibold text-slate-700">Nenhum treino liberado</h3>
          <p className="text-sm text-slate-500">Seu treinador ainda não liberou um plano. Assim que ele liberar, ele aparece aqui.</p>
        </CardContent>
      </Card>
    );
  }

  if (!today.session) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8 text-center space-y-2">
          <h3 className="font-semibold text-slate-700">{today.plan.name}</h3>
          <p className="text-sm text-slate-500">Plano sem sessões cadastradas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide opacity-90">Hoje</p>
            <h2 className="text-xl font-bold leading-tight truncate">{today.session.name}</h2>
            {today.session.focus ? <p className="text-sm opacity-90">{today.session.focus}</p> : null}
            <p className="text-xs opacity-80 mt-1">{today.plan.name}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5" /> {streak} dia{streak === 1 ? '' : 's'}
            </div>
            <div className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" /> {doneSetsCount}/{(today.exercises || []).reduce((a, e) => a + (e.sets || 0), 0)} séries
            </div>
          </div>
        </div>

        {sessionLogId ? (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="opacity-90">Volume: <strong className="tabular-nums">{totalVolume.toFixed(0)} kg</strong></span>
            <Button
              size="sm"
              onClick={() => setFinishOpen(true)}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Finalizar
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleStart}
            disabled={starting}
            className="mt-3 w-full bg-white text-emerald-700 hover:bg-emerald-50 font-semibold h-11"
          >
            <PlayCircle className="w-5 h-5 mr-1.5" /> {starting ? 'Iniciando…' : 'Começar treino'}
          </Button>
        )}
      </motion.div>

      <div className="space-y-2.5">
        {(today.exercises || []).map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            values={sets[ex.id] || []}
            onChange={(idx, v) => handleSetChange(ex.id, idx, v)}
            onCommit={handleCommit}
          />
        ))}
      </div>

      {restSeconds != null ? (
        <RestTimer seconds={restSeconds} onDone={() => setRestSeconds(null)} />
      ) : null}

      <FinishSessionDialog
        open={finishOpen}
        onOpenChange={(v) => !finishing && setFinishOpen(v)}
        doneSets={doneSetsCount}
        totalVolumeKg={totalVolume}
        onConfirm={handleFinish}
      />
    </div>
  );
}
