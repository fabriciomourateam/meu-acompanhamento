import { Share2, AlertTriangle } from "lucide-react";
import type { PatientFood, PatientSubstitution } from "@/lib/patient-substitutions-service";
import { MacroBadgeRow } from "./MacroBadgeRow";
import { generateSubstitutionExplanation } from "@/lib/substitution-explanation";
import { getFoodEmoji } from "@/lib/food-emoji";

interface SubstitutionCardProps {
  original: PatientFood;
  referenceGrams: number;
  sub: PatientSubstitution;
}

function similarityTone(score: number): { ring: string; label: string; tone: string; bar: string } {
  if (score >= 85) return { ring: "ring-emerald-200", tone: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40", label: "Equivalência alta", bar: "bg-emerald-500" };
  if (score >= 70) return { ring: "ring-amber-200", tone: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40", label: "Equivalência média", bar: "bg-amber-500" };
  return { ring: "ring-orange-200", tone: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40", label: "Equivalência baixa", bar: "bg-orange-500" };
}

export function SubstitutionCard({ original, referenceGrams, sub }: SubstitutionCardProps) {
  const tone = similarityTone(sub.similarity_score);
  const explanation = generateSubstitutionExplanation(original, sub, referenceGrams);
  const subMul = sub.equivalent_grams / 100;
  const emoji = getFoodEmoji(sub.name, sub.macro_group);
  const isLowSimilarity = sub.similarity_score < 70;

  const handleShare = async () => {
    const measure = sub.household_measure ? ` (${sub.household_measure})` : "";
    const text = `Posso trocar ${referenceGrams}g de ${original.name} por ${sub.equivalent_grams}g de ${sub.name}${measure} 💪`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* canceled — fallback abaixo */
      }
    }
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ring-1 shadow-sm ${tone.ring}`}>
      {/* Banner de alerta quando similaridade é baixa */}
      {isLowSimilarity && (
        <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-950/40 px-3 py-2 text-xs text-orange-800 dark:text-orange-300 border-b border-orange-200 dark:border-orange-900/50">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Atenção:</strong> macros bem diferentes do original. Use com moderação e idealmente fale com seu nutri.
          </span>
        </div>
      )}

      <div className="p-4">
        <button
          type="button"
          onClick={handleShare}
          title="Compartilhar no WhatsApp"
          aria-label="Compartilhar no WhatsApp"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-100 hover:text-emerald-700"
          style={{ top: isLowSimilarity ? '3.25rem' : '0.75rem' }}
        >
          <Share2 className="h-4 w-4" />
        </button>

        <div className="mb-2 flex items-start justify-between gap-2 pr-10">
          <div className="flex min-w-0 items-start gap-2">
            <span className="shrink-0 text-xl leading-tight" aria-hidden>{emoji}</span>
            <h3 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100">{sub.name}</h3>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2" title={tone.label}>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full ${tone.bar} transition-all`}
              style={{ width: `${Math.max(8, sub.similarity_score)}%` }}
            />
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.tone}`}>
            {sub.similarity_score}%
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {sub.equivalent_grams}g
          </span>
          {sub.household_measure && (
            <span className="text-sm text-slate-600 dark:text-slate-400">≈ {sub.household_measure}</span>
          )}
        </div>

        <MacroBadgeRow
          size="sm"
          calories={sub.calories_per_100g * subMul}
          protein={sub.protein_per_100g * subMul}
          carbs={sub.carbs_per_100g * subMul}
          fats={sub.fats_per_100g * subMul}
        />

        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{explanation}</p>
      </div>
    </div>
  );
}
