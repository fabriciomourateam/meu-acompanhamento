// Execução de uma sessão de treino: iniciar, registrar séries (ITEM 8 — grid por
// série já é o ExerciseCard/SetRow existente), cronômetro de descanso (ITEM 9),
// substituir exercício no dia (ITEM 10) e finalizar.
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlayCircle, CheckCircle2, Trophy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { workoutService } from '@/lib/workout/workout-service';
import { workoutExtrasService, type LastLoad } from '@/lib/workout/workout-extras-service';
import type { HubSession, WorkoutPlanFull } from '@/lib/workout/types';
import { ExerciseCard, type CommitSetArgs } from './ExerciseCard';
import { type SetRowValue } from './SetRow';
import { RestTimer } from './RestTimer';
import { FinishSessionDialog } from './FinishSessionDialog';
import { SubstituteExerciseDialog } from './SubstituteExerciseDialog';
import { dailyChallengesService } from '@/lib/daily-challenges-service';

// Treino conta como meta "Atividade física" do dia a partir deste tempo.
const ACTIVITY_GOAL_MIN = 30;

type SetMap = Record<string, SetRowValue[]>;
// Substituições do dia: plannedExerciseId -> catalog id/nome do substituto
type SubMap = Record<string, { id: string; name: string }>;

interface Props {
  token: string;
  plan: WorkoutPlanFull;
  session: HubSession;
  patientId?: string;
  onFinished: () => void;
}

// Rascunho persistido em localStorage: garante que o aluno não perca nada se
// fechar/recarregar o app no meio do treino (carga digitada, séries marcadas,
// substituições e o próprio sessionLogId em andamento). Keyed por sessão.
interface RunnerDraft {
  sessionLogId: string | null;
  sets: SetMap;
  subs: SubMap;
  startedAt: number | null;
  updatedAt: number;
}

function formatDuration(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
const DRAFT_PREFIX = 'workout-runner-draft:';
const DRAFT_TTL_MS = 1000 * 60 * 60 * 24; // 24h — descarta rascunho velho de mais

function draftKey(plannedSessionId: string) {
  return `${DRAFT_PREFIX}${plannedSessionId}`;
}

function loadDraft(plannedSessionId: string): RunnerDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(plannedSessionId));
    if (!raw) return null;
    const d = JSON.parse(raw) as RunnerDraft;
    if (!d || typeof d !== 'object') return null;
    if (Date.now() - (d.updatedAt ?? 0) > DRAFT_TTL_MS) {
      localStorage.removeItem(draftKey(plannedSessionId));
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

function clearDraft(plannedSessionId: string) {
  try { localStorage.removeItem(draftKey(plannedSessionId)); } catch { /* ignore */ }
}

export function WorkoutSessionRunner({ token, plan, session, patientId, onFinished }: Props) {
  const { toast } = useToast();
  // Hidrata o estado inicial a partir do rascunho salvo (se houver).
  const initial = useMemo(() => loadDraft(session.id), [session.id]);
  const [sessionLogId, setSessionLogId] = useState<string | null>(initial?.sessionLogId ?? null);
  const [starting, setStarting] = useState(false);
  const [sets, setSets] = useState<SetMap>(initial?.sets ?? {});
  const [subs, setSubs] = useState<SubMap>(initial?.subs ?? {});
  const [startedAt, setStartedAt] = useState<number | null>(initial?.startedAt ?? null);
  const [lastLoads, setLastLoads] = useState<Record<string, LastLoad>>({});
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [subFor, setSubFor] = useState<{ plannedId: string; exerciseId: string; name: string } | null>(null);
  const [restored] = useState(() => initial != null && (initial.sessionLogId != null || Object.keys(initial.sets ?? {}).length > 0));

  // Persiste o rascunho sempre que algo relevante muda (debounce leve via microtask
  // não é necessário: writes em localStorage são síncronos e baratos pro volume aqui).
  useEffect(() => {
    const hasContent = sessionLogId != null || Object.keys(sets).length > 0 || Object.keys(subs).length > 0;
    if (!hasContent) return;
    try {
      const draft: RunnerDraft = { sessionLogId, sets, subs, startedAt, updatedAt: Date.now() };
      localStorage.setItem(draftKey(session.id), JSON.stringify(draft));
    } catch { /* quota/privado: silencioso */ }
  }, [session.id, sessionLogId, sets, subs, startedAt]);

  // Última carga registrada por exercício (sugestão de peso na execução).
  useEffect(() => {
    workoutExtrasService.getLastLoads(token, plan.id)
      .then((rows) => {
        const m: Record<string, LastLoad> = {};
        for (const r of rows) m[r.planned_exercise_id] = r;
        setLastLoads(m);
      })
      .catch((e) => console.error('Erro ao buscar última carga:', e));
  }, [token, plan.id]);

  // Cronômetro da sessão: tica a cada 1s enquanto houver treino em andamento.
  useEffect(() => {
    if (!sessionLogId || !startedAt) return;
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sessionLogId, startedAt]);

  // Recupera o cronômetro de rascunhos antigos (sessão iniciada sem startedAt salvo).
  useEffect(() => {
    if (sessionLogId && startedAt == null) setStartedAt(Date.now());
  }, [sessionLogId, startedAt]);

  // Avisa que recuperamos o treino em andamento (uma vez, ao montar).
  const announcedRef = useRef(false);
  useEffect(() => {
    if (restored && !announcedRef.current) {
      announcedRef.current = true;
      toast({ title: 'Treino recuperado 💪', description: 'Continuamos de onde você parou.' });
    }
  }, [restored, toast]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const id = await workoutService.startSession(token, session.id);
      setSessionLogId(id);
      setStartedAt(Date.now());
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

  const totalPlannedSets = useMemo(
    () => session.exercises.reduce((a, e) => a + (e.sets || 0), 0),
    [session.exercises],
  );

  const progressPct = totalPlannedSets > 0 ? Math.round((doneSetsCount / totalPlannedSets) * 100) : 0;
  const elapsedSec = startedAt ? Math.floor((nowTs - startedAt) / 1000) : 0;

  // PRs / comparação com a última vez: exercícios em que a maior carga feita
  // hoje superou a última carga registrada (lastLoads, capturado no início).
  const prs = useMemo(() => {
    const out: Array<{ name: string; weight: number; prev: number }> = [];
    for (const ex of session.exercises) {
      const arr = sets[ex.id] || [];
      const maxDone = arr.reduce((m, s) => (s.done && s.weightKg != null ? Math.max(m, s.weightKg) : m), 0);
      const prev = lastLoads[ex.id]?.weight_kg ?? null;
      if (maxDone > 0 && prev != null && maxDone > prev) {
        out.push({ name: subs[ex.id]?.name ?? ex.exercise_name, weight: maxDone, prev });
      }
    }
    return out;
  }, [sets, lastLoads, subs, session.exercises]);

  const handleFinish = async (rating: number | null, notes: string) => {
    if (!sessionLogId) return;
    setFinishing(true);
    try {
      const durationMin = await workoutService.finishSession(token, sessionLogId, notes || null, rating);
      toast({ title: 'Treino finalizado! 🎉', description: `${doneSetsCount} séries · ${totalVolume.toFixed(0)} kg de volume.` });

      // Treino de 30min+ marca a meta "Atividade física" do dia (mesma da aba Metas).
      // Best-effort: não bloqueia nem falha o fluxo de finalizar se der erro.
      if (patientId && durationMin >= ACTIVITY_GOAL_MIN) {
        dailyChallengesService.completeChallenge(patientId, 'atividade_fisica')
          .then(() => {
            toast({ title: 'Meta concluída ✅', description: `Atividade física do dia marcada (${durationMin}min de treino).` });
          })
          .catch((e) => console.error('Falha ao marcar meta de atividade física:', e));
      }

      clearDraft(session.id);
      setSessionLogId(null);
      setStartedAt(null);
      setSets({});
      setSubs({});
      setFinishOpen(false);
      onFinished();
    } catch (err: any) {
      toast({ title: 'Erro ao finalizar', description: err.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Sessão</p>
            <h2 className="text-xl font-bold leading-tight text-slate-900 truncate">{session.name}</h2>
            {session.focus ? <p className="text-sm text-slate-600">{session.focus}</p> : null}
            <p className="text-xs text-slate-400 mt-1">{plan.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" /> {doneSetsCount}/{totalPlannedSets} séries
            </div>
            {sessionLogId && startedAt ? (
              <div className="flex items-center gap-1 text-xs font-semibold tabular-nums text-slate-500">
                <Clock className="w-3.5 h-3.5" /> {formatDuration(elapsedSec)}
              </div>
            ) : null}
          </div>
        </div>

        {/* Barra de progresso da sessão */}
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{progressPct}% concluído</p>
        </div>

        {sessionLogId ? (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-600">Volume: <strong className="tabular-nums text-slate-900">{totalVolume.toFixed(0)} kg</strong></span>
            <Button size="sm" onClick={() => setFinishOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Finalizar
            </Button>
          </div>
        ) : (
          <Button onClick={handleStart} disabled={starting} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11">
            <PlayCircle className="w-5 h-5 mr-1.5" /> {starting ? 'Iniciando…' : 'Começar treino'}
          </Button>
        )}
      </motion.div>

      <div className="space-y-2.5">
        {session.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            token={token}
            values={sets[ex.id] || []}
            onChange={(idx, v) => handleSetChange(ex.id, idx, v)}
            onCommit={handleCommit}
            substitutedName={subs[ex.id]?.name ?? null}
            lastLoad={lastLoads[ex.id] ?? null}
            onRequestSubstitute={ex.exercise_id ? () => setSubFor({ plannedId: ex.id, exerciseId: ex.exercise_id!, name: ex.exercise_name }) : undefined}
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
        prs={prs}
        onConfirm={handleFinish}
      />

      {subFor && (
        <SubstituteExerciseDialog
          token={token}
          open
          onOpenChange={(o) => !o && setSubFor(null)}
          originalExerciseId={subFor.exerciseId}
          originalExerciseName={subFor.name}
          onSubstituted={(v) => {
            setSubs((prev) => ({ ...prev, [subFor.plannedId]: v }));
            setSubFor(null);
          }}
        />
      )}
    </div>
  );
}
