import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Dumbbell, Clock, Info, Shuffle } from 'lucide-react';
import type { WorkoutExerciseFull } from '@/lib/workout/types';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { SetRow, type SetRowValue } from './SetRow';
import { getThumbnail } from '@/lib/workout/video-url';

export interface CommitSetArgs {
  plannedExerciseId: string;
  setIndex: number;
  value: SetRowValue;
  restSeconds: number | null;
}

interface ExerciseCardProps {
  exercise: WorkoutExerciseFull;
  values: SetRowValue[];
  onChange: (idx: number, v: SetRowValue) => void;
  onCommit: (args: CommitSetArgs) => Promise<void>;
  /** ITEM 10 — quando presente, mostra botão "Substituir por hoje". */
  onRequestSubstitute?: () => void;
  /** Nome do substituto ativo (se o aluno trocou nesta execução). */
  substitutedName?: string | null;
}

const EMPTY_SET: SetRowValue = { weightKg: null, reps: null, rpe: null, done: false };

export function ExerciseCard({ exercise, values, onChange, onCommit, onRequestSubstitute, substitutedName }: ExerciseCardProps) {
  const [open, setOpen] = useState(false);
  const totalSets = Math.max(1, exercise.sets || 1);
  const rows = useMemo(() => {
    const arr: SetRowValue[] = [];
    for (let i = 0; i < totalSets; i++) arr.push(values[i] ?? EMPTY_SET);
    return arr;
  }, [values, totalSets]);

  const doneCount = rows.filter((r) => r.done).length;
  const thumb = getThumbnail(exercise.video_url, exercise.thumbnail_url);
  const defaultReps = parseDefaultReps(exercise.reps);

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
              <span className="text-xs font-bold text-slate-400">{(exercise.exercise_order ?? 0) + 1}.</span>
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
              {exercise.rest_seconds ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {exercise.rest_seconds}s
                </span>
              ) : null}
              {exercise.muscle_group ? (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-slate-200 text-slate-500">
                  {exercise.muscle_group.replace(/^exercise_group_/, '')}
                </Badge>
              ) : null}
            </div>
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
              <div className="grid grid-cols-[28px_1fr_1fr_72px_44px] sm:grid-cols-[32px_1fr_1fr_88px_56px] gap-1.5 sm:gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="text-center">#</span>
                <span className="text-center">Peso (kg)</span>
                <span className="text-center">Reps</span>
                <span className="text-center">RPE</span>
                <span />
              </div>
              {rows.map((row, i) => (
                <SetRow
                  key={i}
                  index={i}
                  value={row}
                  defaultReps={defaultReps}
                  defaultWeight={exercise.load_kg}
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
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

/** "8-12" → 8; "AMRAP" → null; "10" → 10 */
function parseDefaultReps(reps: string | null): number | null {
  if (!reps) return null;
  const m = reps.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}
