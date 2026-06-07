import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, Dumbbell, Clock, Info, Shuffle, Gauge, TrendingUp, Check, PlayCircle, NotebookPen, Undo2 } from 'lucide-react';
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
  restSecondsMax: number | null;
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
  /** Reverte a substituição: volta pro exercício original (vídeo, nome, tudo). */
  onRevertSubstitution?: () => void;
  /** Nome do substituto ativo (se o aluno trocou nesta execução). */
  substitutedName?: string | null;
  /** Vídeo/thumb do substituto ativo — quando trocado, o vídeo acompanha. */
  substitutedVideoUrl?: string | null;
  substitutedThumbnailUrl?: string | null;
  /** Última carga registrada pra este exercício (sugestão de peso). */
  lastLoad?: { weight_kg: number | null; reps: number | null; rpe: number | null } | null;
  /** Observação do aluno (persiste entre treinos). */
  note?: string;
  /** Salva a observação (chamado no blur). */
  onSaveNote?: (note: string) => void;
  /** Recorde all-time deste exercício (snapshot no início da sessão) — pra medalha. */
  prBaseline?: { max_weight_kg: number | null; estimated_1rm: number | null } | null;
  /** Controle externo do aberto/fechado (pra auto-avançar pro próximo). Opcional. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Séries de aquecimento (valores + handlers). Logam com is_warmup. */
  warmupValues?: SetRowValue[];
  onWarmupChange?: (idx: number, v: SetRowValue) => void;
  onWarmupCommit?: (args: CommitSetArgs) => Promise<void>;
  /** Config do aquecimento a exibir neste card (o runner coloca no 1º da lista). */
  warmupConfig?: { sets: number; reps: string | null; rpe: number | null } | null;
  /** Última carga de aquecimento registrada (sugestão de peso). */
  warmupLastWeight?: number | null;
  /** Primeiro exercício da lista do dia — usado pra mostrar a instrução de "como
   *  preencher" apenas uma vez, em vez de repetir em todo card. */
  isFirst?: boolean;
}

const EMPTY_SET: SetRowValue = { weightKg: null, reps: null, rpe: null, done: false };

export function ExerciseCard({ exercise, token, values, onChange, onCommit, onRequestSubstitute, onRevertSubstitution, substitutedName, substitutedVideoUrl, substitutedThumbnailUrl, lastLoad, note, onSaveNote, prBaseline, open: openProp, onOpenChange, warmupValues, onWarmupChange, onWarmupCommit, warmupConfig, warmupLastWeight, isFirst }: ExerciseCardProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;
  const [showRpeHelp, setShowRpeHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  // Observação do aluno: estado local, persistido no blur via onSaveNote.
  const [noteDraft, setNoteDraft] = useState(note ?? '');
  useEffect(() => { setNoteDraft(note ?? ''); }, [note]);
  const [showNote, setShowNote] = useState(false); // colapsado por padrão
  const totalSets = Math.max(1, exercise.sets || 1);
  const warmupCount = Math.max(0, warmupConfig?.sets || 0);
  const warmupReps = warmupConfig?.reps ?? null;
  const warmupRpe = warmupConfig?.rpe ?? null;
  const techniques = exercise.techniques ?? [];
  const warmupRows = useMemo(() => {
    const arr: SetRowValue[] = [];
    for (let i = 0; i < warmupCount; i++) arr.push((warmupValues ?? [])[i] ?? EMPTY_SET);
    return arr;
  }, [warmupValues, warmupCount]);
  const rows = useMemo(() => {
    const arr: SetRowValue[] = [];
    for (let i = 0; i < totalSets; i++) arr.push(values[i] ?? EMPTY_SET);
    return arr;
  }, [values, totalSets]);

  const doneCount = rows.filter((r) => r.done).length;
  const allDone = totalSets > 0 && doneCount >= totalSets;
  // Quando há substituto ativo, vídeo e thumb acompanham o exercício trocado.
  const effectiveVideoUrl = substitutedVideoUrl ?? exercise.video_url;
  const thumb = getThumbnail(effectiveVideoUrl, substitutedThumbnailUrl ?? exercise.thumbnail_url);

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
      className={cn(
        'rounded-xl border shadow-sm overflow-hidden transition-colors',
        allDone ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white',
      )}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className={cn('w-full text-left p-3 flex items-center gap-3 transition-colors', allDone ? 'hover:bg-emerald-100/40' : 'hover:bg-slate-50')}>
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
              {/* 'X×Y reps' embaixo do nome — fonte ligeiramente maior (text-sm)
                  porque e a informacao principal de prescricao (qtas series e reps). */}
              <span className="font-semibold text-slate-700 text-sm">
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
                <span className="capitalize text-slate-400">{exercise.muscle_group.replace(/^exercise_group_/, '')}</span>
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
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                allDone ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700',
              )}
            >
              {allDone && <Check className="h-3 w-3" />}
              {doneCount}/{totalSets}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-100 p-3 space-y-3">
            {/* Vídeo recolhível: por padrão fica fechado pra não empurrar os campos */}
            {effectiveVideoUrl ? (
              showVideo ? (
                <div className="space-y-1">
                  <SmartVideoPlayer url={effectiveVideoUrl} />
                  <button onClick={() => setShowVideo(false)} className="text-[11px] font-medium text-slate-400 hover:text-slate-600">
                    Ocultar vídeo
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowVideo(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  <PlayCircle className="h-4 w-4 text-red-500" /> Ver execução (vídeo)
                </button>
              )
            ) : null}

            {(exercise.instructions || exercise.tips) && (
              <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 flex gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <div className="space-y-1">
                  {exercise.instructions ? <p>{exercise.instructions}</p> : null}
                  {exercise.tips ? <p className="text-slate-500 italic">{exercise.tips}</p> : null}
                </div>
              </div>
            )}

            {/* Séries de aquecimento (aparecem antes das séries de trabalho) */}
            {warmupCount > 0 && (
              <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50/60 p-2">
                <div className="px-1 text-[11px] font-bold uppercase tracking-wide text-amber-600 leading-snug">
                  <div>
                    🔥 Aquecimento — {warmupCount} {warmupCount === 1 ? 'série' : 'séries'}
                    {warmupReps ? ` × ${warmupReps} reps` : ''}
                    {warmupRpe != null ? ` · RPE ${warmupRpe}` : ''}
                  </div>
                  {warmupLastWeight != null && (
                    <div className="mt-0.5 font-semibold text-amber-700/80">
                      📊 Última vez: {warmupLastWeight}kg
                    </div>
                  )}
                </div>
                {/* Cabeçalho de colunas (mesmo das séries de trabalho) */}
                <div className="grid grid-cols-[46px_1fr_1fr_72px_44px] sm:grid-cols-[52px_1fr_1fr_88px_56px] gap-1.5 sm:gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700/70">
                  <span className="text-center">Série</span>
                  <span className="text-center">Peso (kg)</span>
                  <span className="text-center">Reps</span>
                  <span className="text-center">RPE</span>
                  <span />
                </div>
                {warmupRows.map((row, i) => (
                  <SetRow
                    key={`w${i}`}
                    index={i}
                    value={row}
                    defaultReps={parseDefaultReps(warmupReps)}
                    defaultWeight={warmupLastWeight ?? null}
                    defaultRpe={warmupRpe != null ? String(warmupRpe) : null}
                    onChange={(v) => onWarmupChange?.(i, v)}
                    onCommit={async (v) => {
                      // set_index negativo pro aquecimento: evita colidir com a série
                      // de trabalho de mesmo número no índice único (session, exercise, set_index).
                      await onWarmupCommit?.({ plannedExerciseId: exercise.id, setIndex: -(i + 1), value: v, restSeconds: null, restSecondsMax: null });
                    }}
                    onRpeClick={() => setShowRpeHelp(true)}
                  />
                ))}
              </div>
            )}

            <div className="space-y-2">
              {/* Instrução de uso — aparece só no 1º exercício do dia, como onboarding.
                  Nos demais é redundante; os campos vazios + ✓ já são auto-explicativos. */}
              {isFirst && (
                <p className="mx-1 rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-1.5 text-xs text-blue-700">
                  💡 Preencha a carga e as repetições de cada série, depois toque no <strong>✓</strong> pra registrar.
                </p>
              )}
              {/* Sugestão: última carga registrada + meta de carga da fase atual */}
              {(lastLoad?.weight_kg != null || exercise.load_kg != null) && (
                <div className="mx-1 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                  {lastLoad?.weight_kg != null ? (
                    // 'Ultima vez' como referencia rapida — so peso × reps.
                    // O RPE foi removido pra nao induzir 'preciso bater igual'
                    // em alunos iniciantes (o RPE prescrito da serie atual ja
                    // sinaliza a intensidade alvo).
                    <span className="text-slate-600">
                      <span className="text-slate-400">📊 Última vez:</span>{' '}
                      <strong className="tabular-nums text-slate-800">{lastLoad.weight_kg}kg</strong>
                      {lastLoad.reps != null ? <span className="text-slate-400"> × {lastLoad.reps}</span> : null}
                    </span>
                  ) : null}
                  {exercise.load_kg != null ? (
                    <span className="text-slate-600">
                      <span className="text-slate-400">🎯 Meta da fase:</span>{' '}
                      <strong className="tabular-nums text-slate-800">{exercise.load_kg}kg</strong>
                    </span>
                  ) : null}
                </div>
              )}
              <div className="grid grid-cols-[46px_1fr_1fr_72px_44px] sm:grid-cols-[52px_1fr_1fr_88px_56px] gap-1.5 sm:gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="text-center">Série</span>
                <span className="text-center">Peso (kg)</span>
                <span className="text-center">Reps</span>
                <button
                  type="button"
                  onClick={() => setShowRpeHelp(true)}
                  className="flex items-center justify-center gap-0.5 text-slate-400 hover:text-blue-600"
                  aria-label="O que é RPE?"
                >
                  RPE <Info className="h-3 w-3" />
                </button>
                <span />
              </div>

              {rows.map((row, i) => {
                const setTechs = techniquesForSet(techniques, i + 1, totalSets);
                const hasTech = setTechs.length > 0;
                const setRow = (
                  <SetRow
                    index={i}
                    value={row}
                    defaultReps={repsTargetForSet(i)}
                    defaultWeight={suggestedWeight}
                    defaultRpe={rpeTargetForSet(i)}
                    prevBest={{ weight: prBaseline?.max_weight_kg ?? null, oneRm: prBaseline?.estimated_1rm ?? null }}
                    flush={hasTech}
                    onRpeClick={() => setShowRpeHelp(true)}
                    onChange={(v) => onChange(i, v)}
                    onCommit={async (v) => {
                      await onCommit({
                        plannedExerciseId: exercise.id,
                        setIndex: i + 1,
                        value: v,
                        restSeconds: exercise.rest_seconds,
                        restSecondsMax: exercise.rest_seconds_max,
                      });
                    }}
                  />
                );
                if (!hasTech) return <div key={i}>{setRow}</div>;
                // Card da série "abraçando" o card da técnica: tudo num único container.
                return (
                  <div
                    key={i}
                    className={cn('overflow-hidden rounded-lg border', row.done ? 'border-emerald-200' : 'border-slate-200')}
                  >
                    {setRow}
                    {setTechs.map((t) => (
                      <div key={t.technique_id} className={cn('border-t px-2.5 py-2 text-xs', techniqueColors(t.color).banner)}>
                        <div className="flex flex-wrap items-center gap-1.5 font-semibold">
                          <span>{t.emoji ?? '⚡'} {t.name}</span>
                          <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                            aplicar nesta série
                          </span>
                        </div>
                        {t.description && <p className="mt-1 font-normal">{t.description}</p>}
                        {t.notes && <p className="mt-0.5 font-normal italic opacity-80">{t.notes}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Rodapé: progressão (lazy) + substituir (discreto) */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {showHistory ? 'Ocultar progressão' : 'Ver progressão de carga'}
                </button>
                {substitutedName && onRevertSubstitution ? (
                  <button
                    onClick={onRevertSubstitution}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    title={`Voltar para ${exercise.exercise_name}`}
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Voltar ao original
                  </button>
                ) : onRequestSubstitute ? (
                  /* 'Substituir' outline puro (sem bg-amber-50 chapado). Vira
                     acao secundaria discreta — antes competia com 'Ver progressao'
                     a esquerda. */
                  <button
                    onClick={onRequestSubstitute}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-600 transition hover:bg-amber-50 hover:text-amber-700"
                  >
                    <Shuffle className="h-3.5 w-3.5" /> Substituir
                  </button>
                ) : null}
              </div>
              {showHistory && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                  <LoadHistoryChart token={token} plannedExerciseId={exercise.id} />
                </div>
              )}
            </div>

            {/* Observação do aluno — colapsada por padrão; fica salva de um treino pro outro */}
            {onSaveNote && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowNote((v) => !v)}
                  className="flex w-full items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  <NotebookPen className="h-3.5 w-3.5" /> Minhas anotações
                  {!showNote && noteDraft.trim() && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Você tem uma anotação" />}
                  <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${showNote ? 'rotate-180' : ''}`} />
                </button>
                {showNote && (
                  <>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      onBlur={() => { if (noteDraft !== (note ?? '')) onSaveNote(noteDraft); }}
                      rows={2}
                      maxLength={2000}
                      autoFocus
                      placeholder="Ex.: banco no furo 4, peguei 12kg em cada lado, ombro incomodou um pouco…"
                      className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                    />
                    <p className="mt-0.5 text-[10px] text-slate-400">Salvo automaticamente — aparece no próximo treino deste exercício.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Modal de ajuda do RPE — abre pelo ⓘ no cabeçalho ou pelo chip 🎯 da série.
          O DialogContent global tem um X com focus-ring amarelo do tema (var --ring);
          o seletor [&>button] customiza só o botão de fechar deste modal. */}
      <Dialog open={showRpeHelp} onOpenChange={setShowRpeHelp}>
        <DialogContent
          className="bg-white max-w-md p-0 overflow-hidden border-0 rounded-2xl shadow-2xl gap-0
                     [&>button]:rounded-full [&>button]:p-1.5 [&>button]:bg-white/80 [&>button]:backdrop-blur-sm
                     [&>button]:text-slate-600 [&>button]:hover:bg-white [&>button]:hover:text-slate-900
                     [&>button]:focus:ring-2 [&>button]:focus:ring-blue-400 [&>button]:focus:ring-offset-0
                     [&>button]:transition-colors [&>button]:shadow-sm
                     [&>button>svg]:h-4 [&>button>svg]:w-4"
        >
          {/* Header com gradiente azul */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-5 py-4 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-white text-base font-bold">
                <span className="inline-flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm w-9 h-9 text-lg">🎯</span>
                <span>
                  RPE — Esforço Percebido
                  <span className="block text-xs font-normal text-blue-100 mt-0.5">Escala de 0 a 10</span>
                </span>
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Conteúdo */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-slate-600">
              Mede o quão difícil foi a série:
            </p>
            <ul className="space-y-1.5">
              {[
                { n: 10, color: 'bg-red-500', desc: 'falha total, sem mais nenhuma repetição' },
                { n: 9, color: 'bg-orange-500', desc: 'daria pra fazer +1 repetição' },
                { n: 8, color: 'bg-amber-500', desc: 'daria pra fazer +2 repetições' },
                { n: 7, color: 'bg-emerald-500', desc: 'daria pra fazer +3 repetições' },
              ].map((row) => (
                <li key={row.n} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className={`shrink-0 inline-flex items-center justify-center rounded-full ${row.color} text-white font-bold w-8 h-8 text-sm shadow-sm`}>
                    {row.n}
                  </span>
                  <span className="text-sm text-slate-700">{row.desc}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs text-slate-600 leading-relaxed">
              💡 O RPE de cada série é prescrito pelo treinador — use como referência do esforço-alvo enquanto executa.
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
