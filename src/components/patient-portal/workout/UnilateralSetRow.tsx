import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
import type { SetRowValue } from './SetRow';

/** Carga + reps de um lado (esquerdo ou direito). */
export interface SideEntry {
  weightKg: number | null;
  reps: number | null;
}
export interface SidePair {
  e: SideEntry;
  d: SideEntry;
}

export const EMPTY_PAIR: SidePair = {
  e: { weightKg: null, reps: null },
  d: { weightKg: null, reps: null },
};

/** Primeiro inteiro de um alvo de reps ("10", "8-12", "12/10" → 10/8/12). */
function parseRepsNum(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  const m = String(v).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function parseRpe(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const m = String(v).match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(',', '.')) : null;
}

/** Combina os dois lados numa única série pra salvar/contabilizar volume:
 *  reps = E + D (conta os dois lados), carga = por lado (assume simétrica).
 *  Preenche faltantes com os defaults, como faz o SetRow ao marcar feito. */
export function combineSides(pair: SidePair, defaults: { reps: number | null; weight: number | null; rpe: number | null }): SetRowValue {
  const eR = pair.e.reps ?? defaults.reps ?? 0;
  const dR = pair.d.reps ?? defaults.reps ?? 0;
  return {
    weightKg: pair.e.weightKg ?? pair.d.weightKg ?? defaults.weight ?? 0,
    reps: eR + dR,
    rpe: defaults.rpe,
    done: true,
  };
}

/** Split de uma série combinada de volta em E/D (pra reexibir após remount):
 *  reps dividido ao meio, mesma carga nos dois lados. */
export function splitToPair(v: SetRowValue | undefined | null): SidePair {
  if (!v || (v.weightKg == null && v.reps == null)) return EMPTY_PAIR;
  const half = v.reps != null ? Math.round(v.reps / 2) : null;
  return {
    e: { weightKg: v.weightKg ?? null, reps: half },
    d: { weightKg: v.weightKg ?? null, reps: half },
  };
}

/** Input de carga com decimal "à prova de apagar o ponto" (mesma lógica do SetRow). */
function WeightInput({ value, placeholder, onChange, ariaLabel }: {
  value: number | null;
  placeholder?: string;
  onChange: (n: number | null) => void;
  ariaLabel: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (value != null ? String(value) : '');
  return (
    <Input
      inputMode="decimal"
      value={shown}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (!/^[0-9]*[.,]?[0-9]*$/.test(raw)) return;
        setText(raw);
        const n = raw.replace(',', '.');
        onChange(n === '' || n === '.' ? null : Number(n));
      }}
      onBlur={() => setText(null)}
      className="h-10 text-center font-semibold tabular-nums bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus-visible:!ring-1 focus-visible:!ring-blue-400 focus-visible:!ring-offset-0 focus-visible:!border-blue-400"
      aria-label={ariaLabel}
    />
  );
}

function RepsInput({ value, placeholder, onChange, ariaLabel }: {
  value: number | null;
  placeholder?: string;
  onChange: (n: number | null) => void;
  ariaLabel: string;
}) {
  return (
    <Input
      inputMode="numeric"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => {
        const n = e.target.value.replace(/[^0-9]/g, '');
        onChange(n === '' ? null : Number(n));
      }}
      className="h-10 text-center font-semibold tabular-nums bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus-visible:!ring-1 focus-visible:!ring-blue-400 focus-visible:!ring-offset-0 focus-visible:!border-blue-400"
      aria-label={ariaLabel}
    />
  );
}

interface UnilateralSetRowProps {
  index: number;
  done: boolean;
  pair: SidePair;
  defaultReps?: string | number | null;
  defaultWeight?: number | null;
  defaultRpe?: number | string | null;
  onPairChange: (p: SidePair) => void;
  onCommit: (combined: SetRowValue) => void | Promise<void>;
  saving?: boolean;
  onRpeClick?: () => void;
  flush?: boolean;
}

/** Linha de série unilateral: registra Esquerdo e Direito separados, mantendo o
 *  mesmo número de série (1-1, 2-2…). Ao marcar feito, soma os dois lados numa
 *  única série (reps E+D, carga por lado) que vai pro volume e pro banco. */
export function UnilateralSetRow({ index, done, pair, defaultReps, defaultWeight, defaultRpe, onPairChange, onCommit, saving, onRpeClick, flush }: UnilateralSetRowProps) {
  const [localBusy, setLocalBusy] = useState(false);
  const repsTarget = parseRepsNum(defaultReps);
  const repsPlaceholder = defaultReps != null ? String(defaultReps) : 'reps';
  const weightPlaceholder = defaultWeight != null ? String(defaultWeight) : 'kg';

  const patchSide = (side: 'e' | 'd', p: Partial<SideEntry>) =>
    onPairChange({ ...pair, [side]: { ...pair[side], ...p } });

  const handleDone = async () => {
    const combined = combineSides(pair, {
      reps: repsTarget,
      weight: defaultWeight ?? null,
      rpe: parseRpe(defaultRpe),
    });
    setLocalBusy(true);
    try {
      await onCommit(combined);
    } finally {
      setLocalBusy(false);
    }
  };

  const totalReps = (pair.e.reps ?? 0) + (pair.d.reps ?? 0);

  return (
    <div
      className={`p-2 ${flush ? `rounded-t-lg ${done ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-slate-50 dark:bg-slate-900'}` : `rounded-lg border ${done ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}`}
    >
      <div className="flex items-center gap-2">
        {/* Número da série + badge "Unilateral" */}
        <div className="flex flex-col items-center justify-center gap-1 w-11 shrink-0">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              done ? 'bg-emerald-600 text-white' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200'
            }`}
          >
            {index + 1}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-tight text-violet-500">E/D</span>
        </div>

        {/* Dois lados empilhados */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {(['e', 'd'] as const).map((side) => (
            <div key={side} className="grid grid-cols-[20px_1fr_1fr] items-center gap-1.5">
              <span className={`text-center text-[11px] font-bold ${side === 'e' ? 'text-sky-600 dark:text-sky-400' : 'text-orange-500'}`}>
                {side === 'e' ? 'E' : 'D'}
              </span>
              <WeightInput
                value={pair[side].weightKg}
                placeholder={weightPlaceholder}
                onChange={(n) => patchSide(side, { weightKg: n })}
                ariaLabel={`Peso ${side === 'e' ? 'esquerdo' : 'direito'} série ${index + 1}`}
              />
              <RepsInput
                value={pair[side].reps}
                placeholder={repsPlaceholder}
                onChange={(n) => patchSide(side, { reps: n })}
                ariaLabel={`Reps ${side === 'e' ? 'esquerdo' : 'direito'} série ${index + 1}`}
              />
            </div>
          ))}
        </div>

        {/* RPE + Done */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onRpeClick}
            disabled={!onRpeClick}
            className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-500 dark:text-slate-400 disabled:cursor-default"
            aria-label={`RPE prescrito série ${index + 1}`}
            title="O que é RPE?"
          >
            {defaultRpe != null && defaultRpe !== '' ? String(defaultRpe) : '—'}
          </button>
          <Button
            type="button"
            size="sm"
            disabled={saving || localBusy}
            className={`h-10 w-10 p-0 ${
              done
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
            }`}
            onClick={handleDone}
            aria-label={done ? 'Série feita' : 'Marcar série feita'}
          >
            <Check className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Total combinado (o que conta no volume) */}
      <p className="mt-1.5 pl-[52px] text-[10px] text-slate-400 dark:text-slate-500">
        Conta como <strong className="text-slate-500 dark:text-slate-400">{totalReps || '—'} reps</strong> no total (os dois lados somados).
      </p>
    </div>
  );
}
