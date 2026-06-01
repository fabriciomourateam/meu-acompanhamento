import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Dumbbell, Clock, Info, Shuffle, Gauge, TrendingUp } from 'lucide-react';
import type { HubExercise, ExerciseTechnique } from '@/lib/workout/types';
import { workoutExtrasService } from '@/lib/workout/workout-extras-service';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { SetRow, type SetRowValue } from './SetRow';
import { getThumbnail } from '@/lib/workout/video-url';
import { humanizeAppliesTo, techniquesForSet, techniqueColors } from '@/lib/workout/techniques';
import { cn } from '@/lib/utils';

export interface CommitSetArgs {
  plannedExerciseId: string;
  setIndex: number;
  value: SetRowValue;
  restSeconds: number | null;
}

interface ExerciseCardProps {
  exercise: HubExercise & { techniques?: ExerciseTechnique[] };
  /** Token do portal — usado pra carregar o histórico de carga do exercício. */
  token: string;
  values: SetRowValue[];
  onChange: (idx: number, v: SetRowValue) => void;
  onCommit: (args: CommitSetArgs) => Promise<void>;
  /** ITEM 10 — quando presente, mostra botão "Substituir por hoje". */
  onRequestSubstitute?: () => void;
  /** Nome do substituto ativo (se o aluno trocou nesta execução). */
  substitutedName?: string | null;
  /** Última carga registrada pra este exercício (sugestão de peso). */
  lastLoad?: { weight_kg: number | null; reps: number | null; rpe: number | null } | null;
}

const EMPTY_SET: SetRowValue = { weightKg: null, reps: null, rpe: null, done: false };

export function ExerciseCard({ exercise, token, values, onChange, onCommit, onRequestSubstitute, substitutedName, lastLoad }: ExerciseCardProps) {
  const [open, setOpen] = useState(false);
  const [showRpeHelp, setShowRpeHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const totalSets = Math.max(1, exercise.sets || 1);
  const techniques = exercise.techniques ?? [];
  const rows = useMemo(() => {
    const arr: SetRowValue[] = [];
    for (let i = 0; i < totalSets; i++) arr.push(values[i] ?? EMPTY_SET);
    return arr;
  }, [values, totalSets]);

  const doneCount = rows.filter((r) => r.done).length;
  const thumb = getThumbnail(exercise.video_url, exercise.thumbnail_url);

  // Alvos por série: reps e RPE podem vir como valor único ("15"), faixa ("8-12")
  // ou por série separados por "/" ou "," ("12/10/8"). Repete o último se faltar.
  const repsParts = splitPerSet(exercise.reps);
  const rpeParts = splitPerSet(exercise.rpe_per_set ?? (exercise.rpe != null ? String(exercise.rpe) : null));
  const repsTargetForSet = (i: number) => parseDefaultReps(perSetAt(repsParts, i) ?? exercise.reps);
  const rpeTargetForSet = (i: number) => perSetAt(rpeParts, i);

  // Descanso: mostra a faixa (ex.: 60–120s) quando há mínimo e máximo distintos.
  const restLabel = exercise.rest_seconds
    ? exercise.rest_seconds_max && exercise.rest_seconds_max > exercise.rest_seconds
      ? `${exercise.rest_seconds}–${exercise.rest_seconds_max}s`
      : `${exercise.rest_seconds}s`
    : null;

  // RPE alvo para o resumo do cabeçalho (por série tem prioridade sobre o único).
  const rpeSummary = exercise.rpe_per_set || (exercise.rpe != null ? String(exercise.rpe) : null);

  // Sugestão de peso: usa a última carga registrada; se não houver, a prescrição.
  const suggestedWeight = lastLoad?.weight_kg ?? exercise.load_kg ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
          <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
            {thumb ? (
              <img src={thumb} alt={exercise.exercise_name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <Dumbbell className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                {(exercise.exercise_order ?? 0) + 1}
              </span>
              <h3 className="font-semibold text-slate-800 truncate">{substitutedName || exercise.exercise_name}</h3>
              {substitutedName && (
                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  trocado
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                {exercise.sets}×{exercise.reps || '-'}
                {exercise.load_kg ? ` @ ${exercise.load_kg}kg` : ''}
              </span>
              {rpeSummary ? (
                <span className="flex items-center gap-1 text-slate-600">
                  <Gauge className="w-3 h-3" /> RPE {rpeSummary}
                </span>
              ) : null}
              {restLabel ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {restLabel}
                </span>
              ) : null}
              {exercise.muscle_group ? (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-slate-200 text-slate-500">
                  {exercise.muscle_group.replace(/^exercise_group_/, '')}
                </Badge>
              ) : null}
            </div>
            {/* Pilar 2 — badges de técnicas avançadas */}
            {techniques.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {techniques.map((t) => (
                  <span
                    key={t.technique_id}
                    className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', techniqueColors(t.color).badge)}
                  >
                    {t.emoji && <span>{t.emoji}</span>}
                    {t.name}
                    <span className="font-normal opacity-75">· {humanizeAppliesTo(t.applies_to, totalSets)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
              {doneCount}/{totalSets}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-100 p-3 space-y-3">
            {exercise.video_url ? <SmartVideoPlayer url={exercise.video_url} /> : null}

            {(exercise.instructions || exercise.tips) && (
              <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 flex gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <div className="space-y-1">
                  {exercise.instructions ? <p>{exercise.instructions}</p> : null}
                  {exercise.tips ? <p className="text-slate-500 italic">{exercise.tips}</p> : null}
                </div>
              </div>
            )}

            {onRequestSubstitute && (
              <button
                onClick={onRequestSubstitute}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <Shuffle className="h-3.5 w-3.5" /> Substituir por hoje
              </button>
            )}

            <div className="space-y-2">
              <p className="px-1 text-xs text-slate-500">
                {totalSets === 1
                  ? 'Preencha a carga e as reps que você fez e toque no ✓.'
                  : <>Preencha a carga de cada uma das <strong className="text-slate-700">{totalSets} séries</strong> e toque no ✓ a cada série feita.</>}
              </p>

              {/* Sugestão: última carga registrada + meta de carga da fase atual */}
              {(lastLoad?.weight_kg != null || exercise.load_kg != null) && (
                <div className="mx-1 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                  {lastLoad?.weight_kg != null ? (
                    <span className="text-slate-600">
                      <span className="text-slate-400">Última vez:</span>{' '}
                      <strong className="tabular-nums text-slate-800">{lastLoad.weight_kg}kg</strong>
                      {lastLoad.reps != null ? <span className="text-slate-400"> × {lastLoad.reps}</span> : null}
                      {lastLoad.rpe != null ? <span className="text-slate-400"> · RPE {lastLoad.rpe}</span> : null}
                    </span>
                  ) : null}
                  {exercise.load_kg != null ? (
                    <span className="text-slate-600">
                      <span className="text-slate-400">Meta da fase:</span>{' '}
                      <strong className="tabular-nums text-slate-800">{exercise.load_kg}kg</strong>
                    </span>
                  ) : null}
                </div>
              )}
              <div className="grid grid-cols-[28px_1fr_1fr_72px_44px] sm:grid-cols-[32px_1fr_1fr_88px_56px] gap-1.5 sm:gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="text-center">#</span>
                <span className="text-center">Peso (kg)</span>
                <span className="text-center">Reps</span>
                <button
                  type="button"
                  onClick={() => setShowRpeHelp((v) => !v)}
                  className="flex items-center justify-center gap-0.5 text-slate-400 hover:text-blue-600"
                  aria-label="O que é RPE?"
                >
                  RPE <Info className="h-3 w-3" />
                </button>
                <span />
              </div>

              {showRpeHelp && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-xs leading-relaxed text-slate-700">
                  <p className="mb-1 font-semibold text-slate-900">RPE — Esforço Percebido</p>
                  <p>Mede o quão difícil foi a série, numa escala de 0 a 10:</p>
                  <ul className="mt-1 space-y-0.5">
                    <li><strong>10</strong> — falha total, sem mais nenhuma rep</li>
                    <li><strong>9</strong> — daria pra fazer +1 rep</li>
                    <li><strong>8</strong> — daria pra fazer +2 reps</li>
                    <li><strong>7</strong> — daria pra fazer +3 reps</li>
                  </ul>
                  <p className="mt-1 text-slate-500">O número cinza no campo é o RPE alvo da série. Anote o que você sentiu.</p>
                </div>
              )}
              {rows.map((row, i) => {
                const setTechs = techniquesForSet(techniques, i + 1, totalSets);
                return (
                  <div key={i} className="space-y-1.5">
                    <SetRow
                      index={i}
                      value={row}
                      defaultReps={repsTargetForSet(i)}
                      defaultWeight={suggestedWeight}
                      defaultRpe={rpeTargetForSet(i)}
                      onChange={(v) => onChange(i, v)}
                      onCommit={async (v) => {
                        await onCommit({
                          plannedExerciseId: exercise.id,
                          setIndex: i + 1,
                          value: v,
                          restSeconds: exercise.rest_seconds,
                        });
                      }}
                    />
                    {/* Pilar 2 — banner da técnica na série em que ela aplica */}
                    {setTechs.map((t) => (
                      <div
                        key={t.technique_id}
                        className={cn('rounded-lg border px-2.5 py-1.5 text-xs', techniqueColors(t.color).banner)}
                      >
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span>{t.emoji ?? '⚡'} {t.name}</span>
                          <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                            aplicar nesta série ({i + 1}/{totalSets})
                          </span>
                        </div>
                        {t.description && <p className="mt-0.5">{t.description}</p>}
                        {t.notes && <p className="mt-0.5 italic opacity-80">{t.notes}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Progressão de carga — mini-gráfico (lazy) */}
            <div>
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {showHistory ? 'Ocultar progressão' : 'Ver progressão de carga'}
              </button>
              {showHistory && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                  <LoadHistoryChart token={token} plannedExerciseId={exercise.id} />
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

// Mini-gráfico da evolução do top set (carga) ao longo das sessões.
function LoadHistoryChart({ token, plannedExerciseId }: { token: string; plannedExerciseId: string }) {
  const [data, setData] = useState<Array<{ date: string; kg: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    workoutExtrasService
      .getExerciseLoadHistory(token, plannedExerciseId, 12)
      .then((rows) => {
        if (alive) setData(rows.map((r) => ({ date: r.logged_at.slice(5, 10), kg: Number(r.top_weight) })));
      })
      .catch((e) => console.error('Erro no histórico de carga:', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token, plannedExerciseId]);

  if (loading) return <p className="py-4 text-center text-xs text-slate-400">Carregando…</p>;
  if (data.length < 2) {
    return <p className="py-4 text-center text-xs italic text-slate-400">Registre este exercício por mais sessões pra ver a evolução. 📈</p>;
  }

  const first = data[0].kg;
  const last = data[data.length - 1].kg;
  const delta = +(last - first).toFixed(1);

  return (
    <>
      <div className="mb-1 flex items-center justify-between px-1 text-[11px]">
        <span className="font-semibold text-slate-700">Top set por sessão</span>
        <span className={cn('font-bold', delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400')}>
          {delta > 0 ? `+${delta}` : delta} kg
        </span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={34} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip formatter={(v: number) => [`${v} kg`, 'Top set']} labelClassName="text-xs" />
          <Line type="monotone" dataKey="kg" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

/** "8-12" → 8; "AMRAP" → null; "10" → 10 */
function parseDefaultReps(reps: string | null | undefined): number | null {
  if (!reps) return null;
  const m = String(reps).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Quebra valores por série: "12/10/8" ou "12,10,8" → ['12','10','8']; "15" → ['15']. */
function splitPerSet(value: string | null | undefined): string[] {
  if (!value) return [];
  return String(value)
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Valor da série i; se a lista acabou, repete o último (prescrição única vale pra todas). */
function perSetAt(parts: string[], i: number): string | null {
  if (parts.length === 0) return null;
  return parts[i] ?? parts[parts.length - 1];
}
