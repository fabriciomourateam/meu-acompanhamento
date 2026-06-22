// Bloco de Mobilidade — renderizado em destaque acima do treino convencional
// nas sub-abas Treinos e Cardios. Sessoes de mobilidade ficam marcadas no
// MyShape com session_type='mobility' e usam a MESMA estrutura de exercicios
// das sessoes normais. Visual destaca em violeta + emoji pra diferenciar.

import { Sparkles } from 'lucide-react';
import type { HubSession } from '@/lib/workout/types';

interface MobilityBlockProps {
  sessions: HubSession[];
  onOpen: (sessionId: string) => void;
}

export function MobilityBlock({ sessions, onOpen }: MobilityBlockProps) {
  if (sessions.length === 0) return null;
  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-900/50 bg-gradient-to-br from-violet-50 dark:from-violet-950/40 via-white dark:via-slate-900 to-white dark:to-slate-900 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
          Mobilidade
        </h3>
        <span className="text-[10px] text-violet-500">
          {sessions.length} sessão{sessions.length === 1 ? '' : 'ões'}
        </span>
      </div>
      <div className="space-y-2">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpen(s.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-violet-200 dark:border-violet-900/50 bg-white dark:bg-slate-900 p-2.5 text-left shadow-sm transition hover:border-violet-400 hover:shadow-md"
          >
            <span className="inline-flex shrink-0 items-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 px-2.5 py-1 text-xs font-bold text-white">
              🧘
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{s.name}</div>
              {s.focus && <div className="truncate text-xs text-slate-500 dark:text-slate-400">{s.focus}</div>}
            </div>
            <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{s.exercises.length} exec.</span>
          </button>
        ))}
      </div>
    </div>
  );
}
