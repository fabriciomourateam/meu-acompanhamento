import { createPortal } from 'react-dom';
import { Utensils, Target, Trophy, BarChart2, Users } from 'lucide-react';

type TabValue = 'diet' | 'challenges' | 'ranking' | 'community' | 'results';

interface NavItem {
  value: TabValue;
  label: string;
  Icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { value: 'diet',          label: 'Dieta',         Icon: Utensils   },
  { value: 'challenges',    label: 'Metas',         Icon: Target     },
  { value: 'ranking',       label: 'Ranking',       Icon: Trophy     },
  { value: 'community',     label: 'Comunidade',    Icon: Users      },
  { value: 'results',       label: 'Evolução',      Icon: BarChart2  },
];

interface MobileBottomNavProps {
  value: TabValue;
  onChange: (v: TabValue) => void;
  /** Abas a ocultar (ex.: quando o treinador desativa a Comunidade). */
  hidden?: TabValue[];
  /** Contadores de "novos" por aba (ex.: posts novos na Comunidade). */
  badges?: Partial<Record<TabValue, number>>;
}

export function MobileBottomNav({ value, onChange, hidden = [], badges = {} }: MobileBottomNavProps) {
  const items = NAV_ITEMS.filter((item) => !hidden.includes(item.value));
  const nav = (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] sm:hidden">
      {/* Glass bar */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-stretch justify-around gap-0">
          {items.map(({ value: v, label, Icon }) => {
            const isActive = value === v;
            return (
              <button
                key={v}
                onClick={() => onChange(v)}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1 px-0.5 rounded-xl transition-all duration-200 active:scale-95"
              >
                {/* pill indicator */}
                {isActive && (
                  <span className="absolute inset-x-0.5 top-0.5 bottom-0.5 rounded-xl bg-emerald-500 shadow-md shadow-emerald-500/30" />
                )}
                <span className="relative z-10">
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  {(badges[v] ?? 0) > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                      {(badges[v] ?? 0) > 9 ? '9+' : badges[v]}
                    </span>
                  )}
                </span>
                <span
                  className={`relative z-10 text-[9px] leading-none font-medium tracking-tight whitespace-nowrap transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-slate-600'
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
