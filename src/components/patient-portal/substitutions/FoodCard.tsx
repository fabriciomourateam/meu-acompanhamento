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
  if (kcal < 100) return { emoji: "🌿", label: "Leve", classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
  if (kcal < 300) return { emoji: "⚡", label: "Médio", classes: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" };
  if (kcal < 500) return { emoji: "🔥", label: "Denso", classes: "bg-orange-500/15 text-orange-300 border-orange-500/30" };
  return { emoji: "💥", label: "Calórico", classes: "bg-red-500/15 text-red-300 border-red-500/30" };
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
      className="group relative flex h-full min-h-[220px] w-full flex-col items-start gap-2 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/70 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      <span
        onClick={onToggleFavorite}
        role="button"
        tabIndex={0}
        aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-slate-300 transition hover:text-amber-400"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleFavorite(e as any);
          }
        }}
      >
        <Star className={`h-4 w-4 transition-transform ${pulse ? "scale-150" : "scale-100"} ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
      </span>

      <span className="text-3xl leading-none" aria-hidden>
        {emoji}
      </span>

      <div className="flex w-full flex-col gap-0.5">
        <h3 className="line-clamp-2 pr-7 text-sm font-semibold leading-snug text-slate-100">
          {primary}
        </h3>
        {modifiers && (
          <p className="line-clamp-1 text-[11px] leading-tight text-slate-500">{modifiers}</p>
        )}
      </div>

      {measure && (
        <p className="text-[11px] leading-tight text-emerald-400/90">
          ≈ {measure}
        </p>
      )}

      <div className="mt-auto flex w-full flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-xl font-extrabold text-emerald-400">
              {compactNum(food.calories_per_100g)}
            </span>
            <span className="text-xs text-slate-500">
              kcal/100g
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${chip.classes}`}
            title={`${chip.label} (${Math.round(food.calories_per_100g)} kcal/100g)`}
          >
            <span className="mr-0.5" aria-hidden>{chip.emoji}</span>
            {chip.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] tabular-nums text-slate-400">
          <span>
            <span className="font-semibold text-rose-300">Prot</span> {compactNum(food.protein_per_100g)}
          </span>
          <span aria-hidden className="text-slate-700">·</span>
          <span>
            <span className="font-semibold text-sky-300">Carb</span> {compactNum(food.carbs_per_100g)}
          </span>
          <span aria-hidden className="text-slate-700">·</span>
          <span>
            <span className="font-semibold text-amber-300">Gord</span> {compactNum(food.fats_per_100g)}
          </span>
        </div>
      </div>
    </button>
  );
}
