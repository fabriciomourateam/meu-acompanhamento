// Execução de uma sessão de treino: iniciar, registrar séries (ITEM 8 — grid por
// série já é o ExerciseCard/SetRow existente), cronômetro de descanso (ITEM 9),
// substituir exercício no dia (ITEM 10) e finalizar.
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlayCircle, CheckCircle2, Trophy, Clock, ArrowUp, ArrowDown, ListOrdered, RotateCcw, Info } from 'lucide-react';
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
import { communityService } from '@/lib/community-service';

// Treino conta como meta "Atividade física" do dia a partir deste tempo.
const ACTIVITY_GOAL_MIN = 30;

type SetMap = Record<string, SetRowValue[]>;
// Substituições do dia: plannedExerciseId -> id/nome/vídeo do substituto
type SubMap = Record<string, { id: string; name: string; video_url?: string | null; thumbnail_url?: string | null }>;

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
  warmup?: SetMap;
  subs: SubMap;
  /** Ordem dos exercícios escolhida pelo aluno hoje (ex.: academia lotada). */
  order?: string[];
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
  const [warmup, setWarmup] = useState<SetMap>(initial?.warmup ?? {});
  const [subs, setSubs] = useState<SubMap>(initial?.subs ?? {});
  const [startedAt, setStartedAt] = useState<number | null>(initial?.startedAt ?? null);
  const [lastLoads, setLastLoads] = useState<Record<string, LastLoad>>({});
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [rest, setRest] = useState<{ min: number; max: number | null } | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [subFor, setSubFor] = useState<{ plannedId: string; exerciseId: string; name: string } | null>(null);
  const [restored] = useState(() => initial != null && (initial.sessionLogId != null || Object.keys(initial.sets ?? {}).length > 0));

  // Ordem dos exercícios na tela (default = exercise_order; reordenável pelo aluno).
  const defaultOrder = useMemo(
    () => [...session.exercises].sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0)).map((e) => e.id),
    [session.exercises],
  );
  const [order, setOrder] = useState<string[]>(() => {
    const saved = initial?.order;
    // Usa a ordem salva só se ainda bater com os exercícios atuais do plano.
    if (saved && saved.length === defaultOrder.length && saved.every((id) => defaultOrder.includes(id))) return saved;
    return defaultOrder;
  });
  const [reorderMode, setReorderMode] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const orderedExercises = useMemo(() => {
    const byId = new Map(session.exercises.map((e) => [e.id, e] as const));
    return order.map((id) => byId.get(id)).filter(Boolean) as typeof session.exercises;
  }, [order, session.exercises]);

  // Bi-set / tri-set: agrupa exercicios consecutivos com mesmo superset_group.
  // Cada grupo de tamanho >= 2 vira um cluster visual com badge "Bi-set X" e
  // descanso/avanco coordenado. Tamanho 1 = exercicio solto (comportamento atual).
  const exerciseGroups = useMemo(() => {
    const groups: Array<{ key: string; supersetGroup: string | null; items: typeof orderedExercises }> = [];
    for (const ex of orderedExercises) {
      const letter = (ex as any).superset_group as string | null | undefined;
      const last = groups[groups.length - 1];
      if (letter && last && last.supersetGroup === letter) {
        last.items.push(ex);
      } else {
        groups.push({ key: `${ex.id}-${letter ?? 'solo'}`, supersetGroup: letter ?? null, items: [ex] });
      }
    }
    return groups;
  }, [orderedExercises]);

  // Para cada exercicio em grupo, retorna a lista de IDs do par. Util pra
  // detectar se ainda falta a "mesma serie N" do parceiro antes de descansar.
  const partnersById = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const g of exerciseGroups) {
      if (g.items.length < 2) continue;
      const ids = g.items.map((e) => e.id);
      for (const ex of g.items) {
        m.set(ex.id, ids.filter((id) => id !== ex.id));
      }
    }
    return m;
  }, [exerciseGroups]);

  // Label exibido no badge do exercicio. Bi-set/tri-set compartilham numero
  // (ex: "2A", "2B"); exercicios soltos seguem incrementando ("1", "2", "3").
  const displayLabels = useMemo(() => {
    const m = new Map<string, string>();
    let counter = 0;
    for (const g of exerciseGroups) {
      counter += 1;
      if (g.items.length < 2 || !g.supersetGroup) {
        m.set(g.items[0].id, String(counter));
      } else {
        g.items.forEach((ex, i) => {
          // 2A, 2B, 2C... (codigo A=65)
          m.set(ex.id, `${counter}${String.fromCharCode(65 + i)}`);
        });
      }
    }
    return m;
  }, [exerciseGroups]);

  // Aquecimento é o "início do treino": segue sempre o 1º exercício da lista.
  // Pega a config de quem tiver aquecimento cadastrado (menor exercise_order).
  const warmupConfig = useMemo(() => {
    const withW = session.exercises.filter((e) => (e.warmup_sets || 0) > 0);
    if (withW.length === 0) return null;
    const src = withW.slice().sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0))[0];
    return { sets: src.warmup_sets || 0, reps: src.warmup_reps ?? null, rpe: src.warmup_rpe ?? null };
  }, [session.exercises]);
  const firstExerciseId = orderedExercises[0]?.id;

  const moveExercise = (id: string, dir: -1 | 1) => {
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const setOpenFor = (id: string, open: boolean) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id); else next.delete(id);
      return next;
    });
  };

  // Persiste o rascunho sempre que algo relevante muda (debounce leve via microtask
  // não é necessário: writes em localStorage são síncronos e baratos pro volume aqui).
  useEffect(() => {
    const reordered = order.join() !== defaultOrder.join();
    const hasContent = sessionLogId != null || Object.keys(sets).length > 0 || Object.keys(subs).length > 0 || reordered;
    if (!hasContent) return;
    try {
      const draft: RunnerDraft = { sessionLogId, sets, warmup, subs, order, startedAt, updatedAt: Date.now() };
      localStorage.setItem(draftKey(session.id), JSON.stringify(draft));
    } catch { /* quota/privado: silencioso */ }
  }, [session.id, sessionLogId, sets, warmup, subs, order, defaultOrder, startedAt]);

  // Observações do aluno por exercício (persistem entre treinos).
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  useEffect(() => {
    workoutExtrasService.getExerciseNotes(token)
      .then(setExerciseNotes)
      .catch((e) => console.error('Erro ao carregar observações:', e));
  }, [token]);
  const exKey = (ex: HubSession['exercises'][number]) => ex.exercise_id ?? ex.id;
  const handleSaveNote = (key: string, note: string) => {
    setExerciseNotes((prev) => {
      const n = { ...prev };
      if (note.trim()) n[key] = note; else delete n[key];
      return n;
    });
    workoutExtrasService.setExerciseNote(token, key, note).catch((e) => console.error('Erro ao salvar observação:', e));
  };

  // Recordes all-time por exercício — snapshot UMA vez no início da sessão (não
  // refaz a busca conforme as séries são logadas, senão a base do "recorde" se moveria).
  const [prBaselines, setPrBaselines] = useState<Record<string, { max_weight_kg: number | null; estimated_1rm: number | null }>>({});
  useEffect(() => {
    workoutExtrasService.getPersonalRecords(token)
      .then(setPrBaselines)
      .catch((e) => console.error('Erro ao buscar recordes:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, session.id]);

  // Última carga de aquecimento (sugestão no bloco de aquecimento do 1º exercício).
  const [warmupLastWeight, setWarmupLastWeight] = useState<number | null>(null);
  useEffect(() => {
    workoutExtrasService.getLastWarmupLoads(token, plan.id)
      .then((rows) => {
        // pega a mais recente (já vem 1 por exercício; escolhe a de logged_at maior)
        const latest = rows.reduce<LastLoad | null>((acc, r) => (!acc || r.logged_at > acc.logged_at ? r : acc), null);
        setWarmupLastWeight(latest?.weight_kg ?? null);
      })
      .catch((e) => console.error('Erro ao buscar carga de aquecimento:', e));
  }, [token, plan.id]);

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
      // Marcar serie 3 antes de 1/2 deixa slots sparse, que viram null no
      // localStorage e crashava o useMemo de doneSetsCount. Preenche gaps
      // com {done:false} pra manter array denso.
      while (arr.length < idx) arr.push({ done: false } as SetRowValue);
      arr[idx] = v;
      return { ...prev, [plannedId]: arr };
    });
  };

  const handleWarmupChange = (plannedId: string, idx: number, v: SetRowValue) => {
    setWarmup((prev) => {
      const arr = prev[plannedId] ? [...prev[plannedId]] : [];
      arr[idx] = v;
      return { ...prev, [plannedId]: arr };
    });
  };

  // Loga uma série de aquecimento (is_warmup=true). Não dispara cronômetro de descanso.
  const handleWarmupCommit = async ({ plannedExerciseId, setIndex, value }: CommitSetArgs) => {
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
        isWarmup: true,
      });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar aquecimento', description: err.message || 'Tente novamente', variant: 'destructive' });
      throw err;
    }
  };

  const handleCommit = async ({ plannedExerciseId, setIndex, value, restSeconds: rs, restSecondsMax: rsMax }: CommitSetArgs) => {
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
      // Auto-avança: se todas as séries deste exercício ficaram feitas, fecha ele
      // e abre o próximo da ordem atual.
      const exDef = session.exercises.find((e) => e.id === plannedExerciseId);
      const total = exDef?.sets || 1;
      const arr = sets[plannedExerciseId] || [];
      const doneIdx = new Set<number>();
      arr.forEach((s, i) => { if (s?.done) doneIdx.add(i); });
      doneIdx.add(setIndex - 1);
      const exerciseFinished = doneIdx.size >= total;

      // Bi-set: depois da serie N de A, NAO descansa — abre B e deixa o aluno
      // fazer a serie N de B. Soh descansa quando a serie N de TODOS os
      // parceiros do par foi feita.
      const partners = partnersById.get(plannedExerciseId) ?? [];
      const partnerStillPending = partners.find((pid) => {
        const arr = sets[pid] || [];
        return !arr[setIndex - 1]?.done;
      });
      if (partnerStillPending) {
        // Pula descanso e abre o proximo do par
        setOpenIds((prev) => {
          const next = new Set(prev);
          partners.forEach((pid) => next.add(pid));
          return next;
        });
        return;
      }

      // Descanso entre séries (normal) ou entre exercícios (na última série).
      // No final do exercício, se o descanso prescrito for menor que 60s, garante
      // uma faixa padrão de 60–90s entre exercícios.
      if (exerciseFinished) {
        const pos = order.indexOf(plannedExerciseId);
        const nextId = pos >= 0 ? order[pos + 1] : undefined;
        if (nextId) {
          const min = Math.max(60, rs || 0);
          const max = rsMax && rsMax >= min ? rsMax : (min === 60 ? 90 : null);
          setRest({ min, max });
        } else if (rs && rs > 0) {
          setRest({ min: rs, max: rsMax });
        }
        setOpenIds((prev) => {
          const next = new Set(prev);
          next.delete(plannedExerciseId);
          if (nextId) next.add(nextId);
          return next;
        });
      } else if (rs && rs > 0) {
        setRest({ min: rs, max: rsMax });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao salvar série', description: err.message || 'Tente novamente', variant: 'destructive' });
      throw err;
    }
  };

  const { doneSetsCount, totalVolume } = useMemo(() => {
    let count = 0;
    let vol = 0;
    Object.values(sets).forEach((arr) => {
      // arr pode ter slots sparse (undefined/null) quando o aluno marca
      // a serie 3 sem ter marcado 1 e 2 antes — guard pra nao crashar.
      if (!Array.isArray(arr)) return;
      arr.forEach((s) => {
        if (s?.done) {
          count += 1;
          vol += (s.weightKg ?? 0) * (s.reps ?? 0);
        }
      });
    });
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
      const maxDone = arr.reduce((m, s) => (s?.done && s.weightKg != null ? Math.max(m, s.weightKg) : m), 0);
      const prev = lastLoads[ex.id]?.weight_kg ?? null;
      if (maxDone > 0 && prev != null && maxDone > prev) {
        out.push({ name: subs[ex.id]?.name ?? ex.exercise_name, weight: maxDone, prev });
      }
    }
    return out;
  }, [sets, lastLoads, subs, session.exercises]);

  // Descarta o treino em andamento (começou sem querer / vai fazer mais tarde):
  // apaga a sessão no servidor e limpa o rascunho local, voltando ao estado inicial.
  const handleReset = async () => {
    setResetting(true);
    try {
      if (sessionLogId) {
        try { await workoutService.cancelSession(token, sessionLogId); }
        catch (e) { console.error('Falha ao cancelar sessão no servidor:', e); }
      }
      clearDraft(session.id);
      setSessionLogId(null);
      setStartedAt(null);
      setSets({});
      setWarmup({});
      setSubs({});
      setRest(null);
      setOpenIds(new Set());
      setReorderMode(false);
      setOrder(defaultOrder);
      setConfirmReset(false);
      toast({ title: 'Treino descartado', description: 'Pode recomeçar quando quiser — nada foi salvo no seu histórico.' });
    } finally {
      setResetting(false);
    }
  };

  const handleFinish = async (rating: number | null, notes: string, share = false, shareText = '') => {
    if (!sessionLogId) return;
    setFinishing(true);
    try {
      const durationMin = await workoutService.finishSession(token, sessionLogId, notes || null, rating);
      toast({ title: 'Treino finalizado! 🎉', description: `${doneSetsCount} séries · ${totalVolume.toFixed(0)} kg de volume.` });

      // Compartilhar na comunidade (opcional). Best-effort: não bloqueia o fluxo.
      if (share && patientId && shareText.trim()) {
        const category = prs.length > 0 ? 'conquista' : 'treino';
        communityService.createPost(patientId, shareText.trim(), null, category)
          .then(() => toast({ title: 'Compartilhado na comunidade 🎉' }))
          .catch((e) => {
            console.error('Falha ao compartilhar na comunidade:', e);
            toast({ title: 'Não foi possível compartilhar', description: 'O treino foi salvo, mas o post falhou.', variant: 'destructive' });
          });
      }

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
      setWarmup({});
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
      {/* Barra de progresso compacta que acompanha a rolagem */}
      {sessionLogId && (
        <div className="sticky top-0 z-30 flex items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>{doneSetsCount}/{totalPlannedSets} séries</span>
              <span className="tabular-nums">{progressPct}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setFinishOpen(true)}
            className="h-8 shrink-0 bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Finalizar
          </Button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Sessão · {plan.name}</p>
            <h2 className="text-xl font-bold leading-tight text-slate-900">{session.name}</h2>
            {session.focus && session.focus.trim().toLowerCase() !== session.name.trim().toLowerCase() ? (
              <p className="text-sm text-slate-600">{session.focus}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" /> {doneSetsCount}/{totalPlannedSets} séries
            </div>
            {sessionLogId && startedAt ? (
              // Rótulo explícito: sem ele, o relógio contando sozinho confundia
              // o aluno (parecia contagem regressiva / tempo de descanso). É só o
              // tempo decorrido do treino, informativo.
              <div
                className="flex items-center gap-1 text-[11px] font-medium tabular-nums text-slate-400"
                title="Tempo decorrido desde que você começou o treino (só informativo)"
              >
                <Clock className="w-3 h-3" />
                <span className="font-normal">Tempo de treino</span>{' '}
                <span className="font-semibold text-slate-500">{formatDuration(elapsedSec)}</span>
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
          <>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">Volume: <strong className="tabular-nums text-slate-900">{totalVolume.toFixed(0)} kg</strong></span>
              <Button size="sm" onClick={() => setFinishOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Finalizar
              </Button>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-rose-500"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Descartar e recomeçar depois
            </button>
          </>
        ) : session.session_type === 'mobility' ? (
          // Mobilidade nao tem "Comecar treino" — eh um bloco de referencia,
          // nao um treino executavel. Aluno consulta os exercicios e pronto.
          <p className="mt-3 text-center text-xs italic text-slate-500">
            Bloco de mobilidade — siga os exercícios livremente, sem cronometro.
          </p>
        ) : (
          <Button onClick={handleStart} disabled={starting} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11">
            <PlayCircle className="w-5 h-5 mr-1.5" /> {starting ? 'Iniciando…' : 'Começar treino'}
          </Button>
        )}
      </motion.div>

      {/* Observacao da sessao escrita pelo trainer no backoffice
          (workout_sessions.notes). Texto puro com quebras de linha preservadas.
          Aparece antes da lista de exercicios pra o aluno ler antes de comecar. */}
      {session.notes && session.notes.trim() && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="flex-1 min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                Observações do treino
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-amber-900">
                {session.notes.trim()}
              </p>
            </div>
          </div>
        </div>
      )}

      {orderedExercises.length > 1 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReorderMode((v) => !v)}
            className="h-8 border border-slate-200 !bg-white text-xs font-semibold !text-slate-600 hover:!bg-slate-50"
          >
            <ListOrdered className="mr-1.5 h-3.5 w-3.5" />
            {reorderMode ? 'Concluir reordenação' : 'Reordenar exercícios'}
          </Button>
        </div>
      )}

      {reorderMode ? (
        <div className="space-y-2">
          <p className="px-1 text-xs text-slate-500">Ajuste a ordem do treino de hoje (ex.: aparelho ocupado). Vale só pra esta sessão.</p>
          {orderedExercises.map((ex, idx) => (
            <div key={ex.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{idx + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{subs[ex.id]?.name ?? ex.exercise_name}</span>
              <Button size="sm" variant="outline" disabled={idx === 0} onClick={() => moveExercise(ex.id, -1)} className="h-9 w-9 p-0 border-slate-200" aria-label="Subir">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={idx === orderedExercises.length - 1} onClick={() => moveExercise(ex.id, 1)} className="h-9 w-9 p-0 border-slate-200" aria-label="Descer">
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {exerciseGroups.map((g) => {
            const renderCard = (ex: typeof g.items[number]) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                displayLabel={displayLabels.get(ex.id)}
                token={token}
                values={sets[ex.id] || []}
                warmupValues={warmup[ex.id] || []}
                warmupConfig={ex.id === firstExerciseId ? warmupConfig : null}
                warmupLastWeight={ex.id === firstExerciseId ? warmupLastWeight : null}
                isFirst={ex.id === firstExerciseId}
                open={openIds.has(ex.id)}
                onOpenChange={(o) => setOpenFor(ex.id, o)}
                onChange={(idx, v) => handleSetChange(ex.id, idx, v)}
                onWarmupChange={(idx, v) => handleWarmupChange(ex.id, idx, v)}
                onWarmupCommit={handleWarmupCommit}
                onCommit={handleCommit}
                substitutedName={subs[ex.id]?.name ?? null}
                substitutedVideoUrl={subs[ex.id]?.video_url ?? null}
                substitutedThumbnailUrl={subs[ex.id]?.thumbnail_url ?? null}
                lastLoad={lastLoads[ex.id] ?? null}
                note={exerciseNotes[exKey(ex)] ?? ''}
                onSaveNote={(v) => handleSaveNote(exKey(ex), v)}
                prBaseline={ex.exercise_id ? prBaselines[ex.exercise_id] ?? null : null}
                onRequestSubstitute={ex.exercise_id ? () => setSubFor({ plannedId: ex.id, exerciseId: ex.exercise_id!, name: ex.exercise_name }) : undefined}
                onRevertSubstitution={subs[ex.id] ? () => setSubs((prev) => {
                  const next = { ...prev };
                  delete next[ex.id];
                  return next;
                }) : undefined}
              />
            );
            // Exercicios soltos: renderiza igual antes
            if (!g.supersetGroup || g.items.length < 2) {
              return <div key={g.key}>{g.items.map(renderCard)}</div>;
            }
            // Cluster bi-set: wrapper sky com badge + label "alterne entre os exercicios"
            const kindLabel = g.items.length === 2 ? 'Bi-set' : g.items.length === 3 ? 'Tri-set' : `${g.items.length}-set`;
            return (
              <div
                key={g.key}
                className="rounded-xl border-2 border-sky-200 bg-sky-50/60 p-2 space-y-2"
              >
                <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-sky-700">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5">
                    <span aria-hidden>🔗</span>
                    {kindLabel} {g.supersetGroup}
                  </span>
                  <span className="text-sky-600/80 font-normal italic">
                    Faça um exercício após o outro sem descanso.
                  </span>
                </div>
                {g.items.map(renderCard)}
              </div>
            );
          })}
        </div>
      )}

      {rest != null ? (
        <RestTimer minSeconds={rest.min} maxSeconds={rest.max} onDone={() => setRest(null)} />
      ) : null}

      <AlertDialog open={confirmReset} onOpenChange={(v) => !resetting && setConfirmReset(v)}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Descartar este treino?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              As séries marcadas até agora serão apagadas e o cronômetro zera. Use isto se começou sem querer
              ou vai fazer o treino em outro horário. Nada vai pro seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleReset(); }}
              disabled={resetting}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Descartar treino
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FinishSessionDialog
        open={finishOpen}
        onOpenChange={(v) => !finishing && setFinishOpen(v)}
        doneSets={doneSetsCount}
        totalVolumeKg={totalVolume}
        prs={prs}
        sessionName={session.name}
        canShare={!!patientId}
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
