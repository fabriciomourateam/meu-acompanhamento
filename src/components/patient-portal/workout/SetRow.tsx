import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Minus, Plus } from 'lucide-react';

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

interface SetRowProps {
  index: number;
  value: SetRowValue;
  defaultReps?: number | null;
  defaultWeight?: number | null;
  defaultRpe?: number | string | null;
  onChange: (v: SetRowValue) => void;
  onCommit: (v: SetRowValue) => void | Promise<void>;
  saving?: boolean;
}

export function SetRow({ index, value, defaultReps, defaultWeight, defaultRpe, onChange, onCommit, saving }: SetRowProps) {
  const [localBusy, setLocalBusy] = useState(false);
  const weight = value.weightKg ?? defaultWeight ?? 0;
  const reps = value.reps ?? defaultReps ?? 0;

  const patch = (p: Partial<SetRowValue>) => onChange({ ...value, ...p });

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
  const stepBtn = 'h-11 w-9 p-0 shrink-0 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900';

  return (
    <div
      className={`grid grid-cols-[28px_1fr_1fr_72px_44px] sm:grid-cols-[32px_1fr_1fr_88px_56px] items-center gap-1.5 sm:gap-2 rounded-lg p-1.5 ${
        value.done ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'
      }`}
    >
      <span className="text-xs font-bold text-slate-500 text-center">{index + 1}</span>

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
          value={value.reps ?? (defaultReps != null ? defaultReps : '')}
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

      {/* RPE */}
      <Input
        inputMode="decimal"
        value={value.rpe ?? (parseRpe(defaultRpe) ?? '')}
        placeholder={defaultRpe != null && defaultRpe !== '' ? String(defaultRpe) : 'RPE'}
        onChange={(e) => {
          const n = e.target.value.replace(',', '.');
          patch({ rpe: n === '' ? null : Number(n) });
        }}
        className={baseInput}
        aria-label={`RPE série ${index + 1}`}
      />

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
