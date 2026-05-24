import { MACRO_GROUPS, type MacroGroupId } from "@/lib/food-macro-groups";

interface MacroGroupTabsProps {
  active: MacroGroupId | "favs";
  onChange: (id: MacroGroupId | "favs") => void;
  favoritesCount: number;
  counts: Record<MacroGroupId, number>;
}

export function MacroGroupTabs({ active, onChange, favoritesCount, counts }: MacroGroupTabsProps) {
  return (
    <nav
      aria-label="Categorias de alimentos"
      className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1"
      style={{ scrollbarWidth: "thin" }}
    >
      {favoritesCount > 0 && (
        <Tab
          label="Favoritos"
          emoji="⭐"
          count={favoritesCount}
          active={active === "favs"}
          onClick={() => onChange("favs")}
        />
      )}
      {MACRO_GROUPS.map((g) => (
        <Tab
          key={g.id}
          label={g.label}
          emoji={g.emoji}
          count={counts[g.id] ?? 0}
          active={active === g.id}
          onClick={() => onChange(g.id)}
        />
      ))}
    </nav>
  );
}

function Tab({
  label,
  emoji,
  count,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className="flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-500/60 data-[active=true]:border-emerald-400 data-[active=true]:bg-emerald-500 data-[active=true]:text-slate-950 data-[active=true]:shadow-md data-[active=true]:shadow-emerald-500/20"
      aria-pressed={active}
    >
      <span aria-hidden>{emoji}</span>
      <span className="font-medium whitespace-nowrap">{label}</span>
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
            active
              ? "bg-slate-950/20 text-slate-900"
              : "bg-slate-800/80 text-slate-300"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
