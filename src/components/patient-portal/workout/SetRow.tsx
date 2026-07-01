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
  if (n == null) return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 focus:ring-slate-400';
  if (n >= 10) return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-200 focus:ring-red-400';
  if (n >= 9) return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 hover:bg-orange-200 focus:ring-orange-400';
  if (n >= 8) return 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 focus:ring-amber-400';
  return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 focus:ring-emerald-400';
}

interface SetRowProps {
  index: number;
  value: SetRowValue;
  defaultReps?: string | number | null;
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
  const defaultRepsLabel = defaultReps != null ? String(defaultReps) : null;
  const [localBusy, setLocalBusy] = useState(false);
  // Texto em edição da carga. Enquanto o aluno digita guardamos a string crua
  // (ex.: "20." ou "0,") pra o ponto/vírgula final NÃO ser "comido" pelo parse
  // pra número — senão o React re-renderiza "20" e trava a digitação do decimal
  // (meio quilo: 20,5 / 0,5). Fora de edição (null) o campo reflete value.weightKg.
  const [weightText, setWeightText] = useState<string | null>(null);
  const [repsText, setRepsText] = useState<string | null>(null);
  const weight = value.weightKg ?? defaultWeight ?? 0;
  const reps = value.reps ?? defaultReps ?? 0;

  const weightInputValue = weightText ?? (value.weightKg != null ? String(value.weightKg) : '');
  const repsInputValue = repsText ?? (value.reps != null ? String(value.reps) : '');

  const patch = (p: Partial<SetRowValue>) => onChange({ ...value, ...p });

  // Botões +/-: definem a carga e descartam o texto em edição pra o campo
  // mostrar o número canônico recém-calculado.
  const setWeightFromButton = (kg: number) => {
    setWeightText(null);
    patch({ weightKg: kg });
  };

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
    'h-11 text-center font-semibold tabular-nums bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal ' +
    'focus-visible:!ring-1 focus-visible:!ring-blue-400 focus-visible:!ring-offset-0 focus-visible:!border-blue-400';
  const stepBtn = 'hidden sm:inline-flex h-11 w-9 p-0 shrink-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900';

  return (
    <div
      className={`grid grid-cols-[46px_1fr_1fr_72px_44px] sm:grid-cols-[52px_1fr_1fr_88px_56px] items-center gap-1.5 sm:gap-2 p-1.5 ${
        flush
          ? `rounded-t-lg ${value.done ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-slate-50 dark:bg-slate-900'}`
          : `rounded-lg border ${value.done ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`
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
          // Numero da serie: azul claro com texto azul escuro quando vazia
          // (combina com o badge 'Seg · Treino A' do hub), emerald solido
          // quando concluida. Antes era ring-slate-300 chapado e quase apagado.
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            value.done
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200'
          }`}
        >
          {index + 1}
        </span>
        {defaultRepsLabel != null && (
          <span className="mt-1 text-[9px] font-medium text-slate-400 dark:text-slate-500">Alvo: {defaultRepsLabel}</span>
        )}
      </div>

      {/* Reps (à esquerda — pedido do dono) */}
      <div className="flex items-center gap-1 min-w-0">
        <Button type="button" variant="outline" size="sm" className={stepBtn} onClick={() => patch({ reps: Math.max(0, reps - 1) })}>
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          inputMode="text"
          value={repsInputValue}
          placeholder={defaultRepsLabel ?? 'reps'}
          onChange={(e) => {
            const raw = e.target.value;
            // Aceita número simples ("12") ou faixa ("20-30" = feito entre 20 e 30 reps).
            // Faixa incompleta em digitação (ex.: "20-") também é permitida pra não travar.
            if (!/^[0-9]*(-[0-9]*)?$/.test(raw)) return;
            setRepsText(raw);
            const range = raw.match(/^(\d+)-(\d+)$/);
            if (range) {
              patch({ reps: Math.round((Number(range[1]) + Number(range[2])) / 2) });
            } else if (/^\d+$/.test(raw)) {
              patch({ reps: Number(raw) });
            } else {
              patch({ reps: null });
            }
          }}
          onBlur={() => setRepsText(null)}
          className={baseInput}
          aria-label={`Reps série ${index + 1}`}
        />
        <Button type="button" variant="outline" size="sm" className={stepBtn} onClick={() => patch({ reps: reps + 1 })}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Peso (à direita) */}
      <div className="flex items-center gap-1 min-w-0">
        <Button type="button" variant="outline" size="sm" className={stepBtn} onClick={() => setWeightFromButton(Math.max(0, +(weight - 2.5).toFixed(2)))}>
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          inputMode="decimal"
          value={weightInputValue}
          placeholder={defaultWeight != null ? String(defaultWeight) : 'kg'}
          onChange={(e) => {
            const raw = e.target.value;
            // Só dígitos com um separador decimal (ponto ou vírgula). Bloqueia
            // letras/segundo ponto sem descartar o decimal em digitação.
            if (!/^[0-9]*[.,]?[0-9]*$/.test(raw)) return;
            setWeightText(raw);
            const n = raw.replace(',', '.');
            patch({ weightKg: n === '' || n === '.' ? null : Number(n) });
          }}
          onBlur={() => setWeightText(null)}
          className={baseInput}
          aria-label={`Peso série ${index + 1}`}
        />
        <Button type="button" variant="outline" size="sm" className={stepBtn} onClick={() => setWeightFromButton(+(weight + 2.5).toFixed(2))}>
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

      {/* Done — outline emerald quando vazio (padrao consistente com o + de
          refeicao / meta) e solido emerald com sombra quando marcado. Antes era
          cinza claro chapado, quase invisivel — nao convidava ao toque. */}
      <Button
        type="button"
        size="sm"
        disabled={saving || localBusy}
        className={`h-11 w-11 p-0 shrink-0 ${
          value.done
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
            : 'bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 shadow-none'
        }`}
        onClick={handleDone}
        aria-label={value.done ? 'Série feita' : 'Marcar série feita'}
      >
        <Check className="w-5 h-5" />
      </Button>
    </div>
  );
}
