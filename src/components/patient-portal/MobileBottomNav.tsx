import { createPortal } from 'react-dom';
import { Utensils, Pill, RefreshCw, Target, Trophy, BarChart2 } from 'lucide-react';

type TabValue = 'diet' | 'supplements' | 'substitutions' | 'challenges' | 'ranking' | 'results';

interface NavItem {
  value: TabValue;
  label: string;
  Icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { value: 'diet',          label: 'Plano',        Icon: Utensils   },
  { value: 'supplements',   label: 'Suplementos',  Icon: Pill       },
  { value: 'substitutions', label: 'Substituições', Icon: RefreshCw  },
  { value: 'challenges',    label: 'Metas',        Icon: Target     },
  { value: 'ranking',       label: 'Ranking',      Icon: Trophy     },
  { value: 'results',       label: 'Evolução',     Icon: BarChart2  },
];

interface MobileBottomNavProps {
  value: TabValue;
  onChange: (v: TabValue) => void;
}

export function MobileBottomNav({ value, onChange }: MobileBottomNavProps) {
  const nav = (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] sm:hidden">
      {/* Glass bar */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.10)] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around gap-0.5">
          {NAV_ITEMS.map(({ value: v, label, Icon }) => {
            const isActive = value === v;
            return (
              <button
                key={v}
                onClick={() => onChange(v)}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1 rounded-xl transition-all duration-200 active:scale-95"
              >
                {/* pill indicator */}
                {isActive && (
                  <span className="absolute inset-x-1 top-0.5 bottom-0.5 rounded-xl bg-emerald-50 border border-emerald-200/60 shadow-sm" />
                )}
                <span className="relative z-10">
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </span>
                <span
                  className={`relative z-10 text-[10px] leading-none font-medium transition-colors duration-200 truncate w-full text-center px-0.5 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
