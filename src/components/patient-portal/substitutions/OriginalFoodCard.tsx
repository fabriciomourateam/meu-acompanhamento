import type { PatientFood } from "@/lib/patient-substitutions-service";
import { formatHouseholdMeasure } from "@/lib/patient-substitutions-service";
import { getMacroGroupMeta } from "@/lib/food-macro-groups";
import { getFoodEmoji } from "@/lib/food-emoji";
import { MacroBadgeRow } from "./MacroBadgeRow";

interface OriginalFoodCardProps {
  food: PatientFood;
  referenceGrams: number;
}

export function OriginalFoodCard({ food, referenceGrams }: OriginalFoodCardProps) {
  const meta = getMacroGroupMeta(food.macro_group);
  const emoji = getFoodEmoji(food.name, food.macro_group);
  const multiplier = referenceGrams / 100;
  const measure = formatHouseholdMeasure(referenceGrams, food.common_units);

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-400">
        <span aria-hidden>{emoji}</span>
        <span>Você selecionou • {meta.label}</span>
      </div>

      <h2 className="mb-1 text-xl font-bold text-slate-100">{food.name}</h2>
      <p className="mb-3 text-sm text-slate-400">
        Referência:{" "}
        <span className="font-semibold text-slate-200">{referenceGrams}g</span>
        {measure && (
          <>
            {" "}
            • aproximadamente{" "}
            <span className="font-semibold text-slate-200">{measure}</span>
          </>
        )}
      </p>

      <MacroBadgeRow
        calories={food.calories_per_100g * multiplier}
        protein={food.protein_per_100g * multiplier}
        carbs={food.carbs_per_100g * multiplier}
        fats={food.fats_per_100g * multiplier}
      />
    </div>
  );
}
