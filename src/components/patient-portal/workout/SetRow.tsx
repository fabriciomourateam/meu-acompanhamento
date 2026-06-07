import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Minus, Plus, Medal } from 'lucide-react';

export interface SetRowValue {
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  done: boolean;
}

/** Extrai o primeiro número do RPE alvo ("8" ou "8-9" → 8) pra pré-preencher. */
function parseRpe(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const m = String(v).match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(',', '.')) : null;
}

/** Cor do chip do RPE por intensidade — comunica esforco visualmente antes
 *  do aluno ler o numero. Verde=baixa, ambar=media, laranja=alta, vermelho=falha. */
function rpeChipColors(rpe: number | string | null | undefined): string {
  const n = parseRpe(rpe);
  if (n == null) return 'bg-slate-100 text-slate-500 hover:bg-slate-200 focus:ring-slate-400';
  if (n >= 10) return 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-400';
  if (n >= 9) return 'bg-orange-100 text-orange-700 hover:bg-orange-200 focus:ring-orange-400';
  if (n >= 8) return 'bg-amber-100 text-amber-700 hover:bg-amber-200 focus:ring-amber-400';
  return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 focus:ring-emerald-400';
}

interface SetRowProps {
  index: number;
  value: SetRowValue;
  defaultReps?: number | null;
  defaultWeight?: number | null;
  defaultRpe?: number | string | null;
  onChange: (v: SetRowValue) => void;
  onCommit: (v: SetRowValue) => void | Promise<void>;
  saving?: boolean;
  /** Clique no chip do RPE — usado pra abrir a ajuda do RPE no card pai. */
  onRpeClick?: () => void;
  /** Sem borda própria / só canto superior arredondado — pra encaixar dentro de um card maior. */
  flush?: boolean;
  /** Recorde all-time do exercício (peso e 1RM estimado) antes desta sessão. Se a série superar, ganha medalha. */
  prevBest?: { weight: number | null; oneRm: number | null } | null;
}

export function SetRow({ index, value, defaultReps, defaultWeight, defaultRpe, onChange, onCommit, saving, onRpeClick, flush, prevBest }: SetRowProps) {
  const [localBusy, setLocalBusy] = useState(false);
  const weight = value.weightKg ?? defaultWeight ?? 0;
  const reps = value.reps ?? defaultReps ?? 0;

  const patch = (p: Partial<SetRowValue>) => onChange({ ...value, ...p });

  // Recorde all-time (independe da fase): a série feita supera o melhor peso OU o
  // melhor 1RM estimado (Epley) já registrado. O 1RM normaliza as reps, então uma
  // série de 12 forte na base pode ser recorde mesmo sem bater o peso da força.
  const isPr = (() => {
    if (!value.done || value.weightKg == null || value.weightKg <= 0) return false;
    if (!prevBest) return false;
    const oneRm = value.reps != null && value.reps > 0 ? value.weightKg * (1 + value.reps / 30) : value.weightKg;
    const beatWeight = prevBest.weight != null && prevBest.weight > 0 && value.weightKg > prevBest.weight;
    const beatOneRm = prevBest.oneRm != null && prevBest.oneRm > 0 && oneRm > prevBest.oneRm + 0.01;
    return beatWeight || beatOneRm;
  })();

  const handleDone = async () => {
    const next: SetRowValue = {
      weightKg: value.weightKg ?? defaultWeight ?? 0,
      reps: value.reps ?? defaultReps ?? 0,
      rpe: value.rpe ?? parseRpe(defaultRpe),
      done: true,
    };
    onChange(next);
    setLocalBusy(true);
    try {
      await onCommit(next);
    } finally {
      setLocalBusy(false);
    }
  };

  const baseInput =
    'h-11 text-center font-semibold tabular-nums bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 placeholder:font-normal ' +
    'focus-visible:!ring-1 focus-visible:!ring-blue-400 focus-visible:!ring-offset-0 focus-visible:!border-blue-400';
  const stepBtn = 'hidden sm:inline-flex h-11 w-9 p-0 shrink-0 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900';

  return (
    <div
      className={`grid grid-cols-[46px_1fr_1fr_72px_44px] sm:grid-cols-[52px_1fr_1fr_88px_56px] items-center gap-1.5 sm:gap-2 p-1.5 ${
        flush
          ? `rounded-t-lg ${value.done ? 'bg-emerald-50' : 'bg-slate-50'}`
          : `rounded-lg border ${value.done ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`
      }`}
    >
      {/* Mini-cartão da série: número + alvo de reps (estilo MyShape) */}
      <div className="relative flex flex-col items-center justify-center leading-none">
        {isPr && (
          <span
            className="absolute -right-1 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-white shadow ring-2 ring-white"
            title="Recorde! Você superou a carga do treino passado 🎉"
            aria-label="Recorde de carga"
          >
            <Medal className="h-2.5 w-2.5" />
          </span>
        )}
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            value.done ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300'
          }`}
        >
          {index + 1}
        </span>
        {defaultReps != null && (
          <span className="mt-1 text-[9px] font-medium text-slate-400">alvo: {defaultReps}</span>
        )}
      </div>

      {/* Peso */}
      <div className="flex items-center gap-1 min-w-0">
        <Button type="button" variant="outline" size="sm" className={stepBtn} onClick={() => patch({ weightKg: Math.max(0, +(weight - 2.5).toFixed(2)) })}>
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          inputMode="decimal"
          value={value.weightKg ?? ''}
          placeholder={defaultWeight != null ? String(defaultWeight) : 'kg'}
          onChange={(e) => {
            const n = e.target.value.replace(',', '.');
            patch({ weightKg: n === '' ? null : Number(n) });
          }}
          className={baseInput}
          aria-label={`Peso série ${index + 1}`}
        />
        <Button type="button" variant="outline" size="sm" className={stepBtn} onClick={() => patch({ weightKg: +(weight + 2.5).toFixed(2) })}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Reps */}
      <div className="flex items-center gap-1 min-w-0">
        <Button type="button" variant="outline" size="sm" className={stepBtn} onClick={() => patch({ reps: Math.max(0, reps - 1) })}>
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          inputMode="numeric"
          value={value.reps ?? ''}
          placeholder={defaultReps != null ? String(defaultReps) : 'reps'}
          onChange={(e) => {
            const n = e.target.value.replace(/[^0-9]/g, '');
            patch({ reps: n === '' ? null : Number(n) });
          }}
          className={baseInput}
          aria-label={`Reps série ${index + 1}`}
        />
        <Button type="button" variant="outline" size="sm" className={stepBtn} onClick={() => patch({ reps: reps + 1 })}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* RPE — fixo: referencia de esforco prescrita pelo treinador. Cor por
          intensidade (verde 7- / ambar 8 / laranja 9 / vermelho 10=falha) —
          aluno sente a 'gravidade' do esforco antes de ler o numero. Sem emoji
          (o 🎯 anterior sugeria 'alvo' e colidia com a coluna SERIE/REPS). */}
      <div className="h-11 flex items-center justify-center">
        <button
          type="button"
          onClick={onRpeClick}
          disabled={!onRpeClick}
          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums transition-colors disabled:cursor-default focus:outline-none focus:ring-2 ${rpeChipColors(defaultRpe)}`}
          aria-label={`RPE prescrito ${index + 1} — tocar pra explicação`}
          title="O que é RPE?"
        >
          {defaultRpe != null && defaultRpe !== '' ? String(defaultRpe) : '—'}
        </button>
      </div>

      {/* Done */}
      <Button
        type="button"
        size="sm"
        disabled={saving || localBusy}
        className={`h-11 w-11 p-0 shrink-0 ${
          value.done ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 hover:bg-emerald-500'
        } text-white`}
        onClick={handleDone}
        aria-label={value.done ? 'Série feita' : 'Marcar série feita'}
      >
        <Check className="w-5 h-5" />
      </Button>
    </div>
  );
}
