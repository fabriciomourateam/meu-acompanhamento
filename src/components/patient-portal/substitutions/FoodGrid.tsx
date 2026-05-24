import { motion } from "framer-motion";
import type { PatientFood } from "@/lib/patient-substitutions-service";
import { FoodCard } from "./FoodCard";

interface FoodGridProps {
  foods: PatientFood[];
  onSelect: (food: PatientFood) => void;
  hasFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  emptyMessage?: string;
  searchTerm?: string;
  onSuggestionClick?: (term: string) => void;
}

const SEARCH_SUGGESTIONS = ["banana", "frango", "arroz", "ovo", "azeite", "iogurte"];

export function FoodGrid({
  foods,
  onSelect,
  hasFavorite,
  onToggleFavorite,
  emptyMessage,
  searchTerm,
  onSuggestionClick,
}: FoodGridProps) {
  if (foods.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
        <span className="mb-3 text-4xl" aria-hidden>
          {searchTerm ? "🔍" : "🥗"}
        </span>
        <p className="mb-4 max-w-sm text-sm text-slate-500">
          {emptyMessage ?? "Nenhum alimento encontrado nesta categoria."}
        </p>
        {searchTerm && onSuggestionClick && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">Tente buscar por</span>
            <div className="flex flex-wrap justify-center gap-2">
              {SEARCH_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggestionClick(s)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
      {foods.map((food, i) => (
        <motion.div
          key={food.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.25 }}
          className="h-full"
        >
          <FoodCard
            food={food}
            onSelect={() => onSelect(food)}
            isFavorite={hasFavorite(food.id)}
            onToggleFavorite={(e) => {
              e.stopPropagation();
              onToggleFavorite(food.id);
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
