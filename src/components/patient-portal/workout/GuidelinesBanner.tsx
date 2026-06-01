// ITEM 6 — Banner colapsável "Orientações importantes":
// observações gerais do plano + general_notes da periodização + notas de sessão.
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  sessions: Array<{ id: string; name: string; notes: string | null }>;
  generalNotes: string | null;
  /** Observações gerais do plano (workout_plans.notes) — escritas no MyShape. */
  planNotes?: string | null;
}

const hasText = (html: string | null | undefined) => !!(html && html.replace(/<[^>]+>/g, '').trim());

export function GuidelinesBanner({ sessions, generalNotes, planNotes }: Props) {
  const hasNotes = hasText(generalNotes);
  const hasPlanNotes = hasText(planNotes);
  const hasContent = sessions.length > 0 || hasNotes || hasPlanNotes;
  const [expanded, setExpanded] = useState(false);
  if (!hasContent) return null;

  const totalCount = sessions.length + (hasNotes ? 1 : 0) + (hasPlanNotes ? 1 : 0);

  return (
    <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left transition hover:bg-amber-100/40"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          📌 Orientações importantes
          <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold">{totalCount}</span>
        </span>
        {expanded ? <ChevronDown className="h-4 w-4 text-amber-700" /> : <ChevronRight className="h-4 w-4 text-amber-700" />}
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-amber-200 p-3 text-sm">
          {hasPlanNotes && (
            <div className="rounded border border-amber-300/50 bg-white/60 p-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">Observações gerais</div>
              <div className="text-amber-950 [&_*]:!bg-transparent" dangerouslySetInnerHTML={{ __html: planNotes! }} />
            </div>
          )}
          {hasNotes && (
            <div className="rounded border border-amber-300/50 bg-white/60 p-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">Periodização</div>
              <div className="text-amber-950 [&_*]:!bg-transparent" dangerouslySetInnerHTML={{ __html: generalNotes! }} />
            </div>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="rounded border border-amber-300/50 bg-white/60 p-2">
              <div className="mb-1 text-sm font-semibold text-amber-900">{s.name}</div>
              {s.notes && <div className="text-xs text-amber-950 [&_*]:!bg-transparent" dangerouslySetInnerHTML={{ __html: s.notes }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
