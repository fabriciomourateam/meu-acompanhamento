import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { PatientFood } from "@/lib/patient-substitutions-service";
import { formatHouseholdMeasure } from "@/lib/patient-substitutions-service";
import { getFoodEmoji } from "@/lib/food-emoji";

interface FoodCardProps {
  food: PatientFood;
  onSelect: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

function splitName(name: string): { primary: string; modifiers: string | null } {
  const idx = name.indexOf(",");
  if (idx === -1) return { primary: name, modifiers: null };
  return {
    primary: name.slice(0, idx).trim(),
    modifiers: name.slice(idx + 1).trim() || null,
  };
}

function calorieChip(kcal: number): { emoji: string; label: string; classes: string } {
  if (kcal < 100) return { emoji: "🌿", label: "Leve", classes: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50" };
  if (kcal < 300) return { emoji: "⚡", label: "Médio", classes: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/50" };
  if (kcal < 500) return { emoji: "🔥", label: "Denso", classes: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50" };
  return { emoji: "💥", label: "Calórico", classes: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50" };
}

function compactNum(n: number): string {
  return Math.round(n).toString();
}

export function FoodCard({ food, onSelect, isFavorite, onToggleFavorite }: FoodCardProps) {
  const emoji = getFoodEmoji(food.name, food.macro_group);
  const { primary, modifiers } = splitName(food.name);
  const chip = calorieChip(food.calories_per_100g);
  const measure = formatHouseholdMeasure(100, food.common_units);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!isFavorite) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 400);
    return () => clearTimeout(t);
  }, [isFavorite]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      {/* Topo: emoji + chip de densidade + estrela */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-2xl leading-none shrink-0" aria-hidden>
            {emoji}
          </span>
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${chip.classes}`}
            title={`${chip.label} (${Math.round(food.calories_per_100g)} kcal/100g)`}
          >
            <span className="mr-0.5" aria-hidden>{chip.emoji}</span>
            {chip.label}
          </span>
        </div>
        <span
          onClick={onToggleFavorite}
          role="button"
          tabIndex={0}
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 transition hover:text-amber-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggleFavorite(e as any);
            }
          }}
        >
          <Star className={`h-4 w-4 transition-transform ${pulse ? "scale-150" : "scale-100"} ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
        </span>
      </div>

      {/* Nome */}
      <div className="flex w-full flex-col gap-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {primary}
        </h3>
        {modifiers && (
          <p className="line-clamp-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">{modifiers}</p>
        )}
        {measure && (
          <p className="text-[11px] leading-tight text-emerald-600/90">
            ≈ {measure}
          </p>
        )}
      </div>

      {/* Rodapé: kcal grande + macros embaixo */}
      <div className="mt-auto pt-1.5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-baseline gap-1 tabular-nums">
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {compactNum(food.calories_per_100g)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">kcal/100g</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] tabular-nums text-slate-600 dark:text-slate-400 mt-0.5">
          <span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">P</span> {compactNum(food.protein_per_100g)}
          </span>
          <span aria-hidden className="text-slate-300">·</span>
          <span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">C</span> {compactNum(food.carbs_per_100g)}
          </span>
          <span aria-hidden className="text-slate-300">·</span>
          <span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">G</span> {compactNum(food.fats_per_100g)}
          </span>
        </div>
      </div>
    </button>
  );
}
