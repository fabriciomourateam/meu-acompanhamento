// ITEM 6 — Banner colapsável "Orientações importantes":
// observações gerais do plano + general_notes da periodização + notas de sessão.
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { adaptHtmlColorsForDark } from '@/lib/utils';

interface Props {
  sessions: Array<{ id: string; name: string; notes: string | null }>;
  generalNotes: string | null;
  /** Observações gerais do plano (workout_plans.notes) — escritas no MyShape. */
  planNotes?: string | null;
  /** ID do aluno — usado pra persistir "ja viu as orientacoes" e parar o pulse. */
  patientId?: string;
}

const hasText = (html: string | null | undefined) => !!(html && html.replace(/<[^>]+>/g, '').trim());

export function GuidelinesBanner({ sessions, generalNotes, planNotes, patientId }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  // No escuro, clareia cores escuras do conteúdo (rich text do back-office).
  const adapt = (h: string) => (isDark ? adaptHtmlColorsForDark(h) : h);
  const hasNotes = hasText(generalNotes);
  const hasPlanNotes = hasText(planNotes);
  const hasContent = sessions.length > 0 || hasNotes || hasPlanNotes;
  const [expanded, setExpanded] = useState(false);
  // 'seen' = aluno ja abriu pelo menos uma vez (entao para o pulse pra sempre).
  // Persistido por aluno em localStorage. Default true (sem pulse) quando nao
  // ha patientId, pra evitar pisca-pisca em casos exoticos.
  const seenKey = patientId ? `workout_guidelines_seen_${patientId}` : null;
  const [seen, setSeen] = useState(() => {
    if (!seenKey) return true;
    try { return localStorage.getItem(seenKey) === '1'; } catch { return true; }
  });
  // Se patientId muda em runtime (raro), re-le o flag.
  useEffect(() => {
    if (!seenKey) return;
    try { setSeen(localStorage.getItem(seenKey) === '1'); } catch { /* ignora */ }
  }, [seenKey]);

  if (!hasContent) return null;

  const totalCount = sessions.length + (hasNotes ? 1 : 0) + (hasPlanNotes ? 1 : 0);

  const handleClick = () => {
    setExpanded((v) => !v);
    if (!seen && seenKey) {
      setSeen(true);
      try { localStorage.setItem(seenKey, '1'); } catch { /* ignora */ }
    }
  };

  return (
    <div
      className={`rounded-lg border bg-amber-50/60 dark:bg-amber-950/25 overflow-hidden transition-all ${
        seen ? 'border-amber-200 dark:border-amber-900/50' : 'border-amber-300 ring-2 ring-amber-300/40 animate-pulse-soft'
      }`}
    >
      <button
        onClick={handleClick}
        className="flex w-full items-center justify-between gap-2 p-3 text-left transition hover:bg-amber-100/40 dark:hover:bg-amber-900/40"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
          📌 Orientações importantes
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${seen ? 'bg-amber-200 text-amber-800 dark:text-amber-300' : 'bg-amber-500 text-white'}`}>
            {totalCount}
          </span>
          {!seen && (
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 normal-case">
              ← toque pra ler
            </span>
          )}
        </span>
        {expanded ? <ChevronDown className="h-4 w-4 text-amber-700 dark:text-amber-300" /> : <ChevronRight className="h-4 w-4 text-amber-700 dark:text-amber-300" />}
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-amber-200 dark:border-amber-900/50 p-3 text-sm">
          {hasPlanNotes && (
            <div className="rounded border border-amber-200/60 bg-white/70 dark:bg-slate-950/70 p-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Observações gerais</div>
              <div className="text-slate-950 dark:text-slate-100 [&_*]:!bg-transparent" dangerouslySetInnerHTML={{ __html: adapt(planNotes!) }} />
            </div>
          )}
          {hasNotes && (
            <div className="rounded border border-amber-200/60 bg-white/70 dark:bg-slate-950/70 p-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Periodização</div>
              <div className="text-slate-950 dark:text-slate-100 [&_*]:!bg-transparent" dangerouslySetInnerHTML={{ __html: adapt(generalNotes!) }} />
            </div>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="rounded border border-amber-200/60 bg-white/70 dark:bg-slate-950/70 p-2">
              <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
              {s.notes && <div className="text-xs text-slate-950 dark:text-slate-100 [&_*]:!bg-transparent" dangerouslySetInnerHTML={{ __html: adapt(s.notes) }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
