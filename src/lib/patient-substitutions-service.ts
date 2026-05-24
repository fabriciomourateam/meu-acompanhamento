import { supabase } from "@/integrations/supabase/client";
import {
  categoriesOfMacroGroup,
  getMacroGroupOfCategory,
  type MacroGroupId,
} from "./food-macro-groups";

export interface PatientFood {
  id: string;
  name: string;
  category: string;
  macro_group: MacroGroupId;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g: number | null;
  sodium_per_100g: number | null;
  common_units: HouseholdUnit[];
}

export interface HouseholdUnit {
  unit: string;
  grams: number;
}

export interface PatientSubstitution {
  id: string;
  name: string;
  category: string;
  macro_group: MacroGroupId;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  similarity_score: number;
  equivalent_grams: number;
  household_measure: string | null;
  common_units: HouseholdUnit[];
}

export interface PatientSubstitutionsResult {
  original: PatientFood;
  reference_quantity_g: number;
  substitutions: PatientSubstitution[];
}

const FOOD_FIELDS =
  "id,name,category,calories_per_100g,protein_per_100g,carbs_per_100g,fats_per_100g,fiber_per_100g,sodium_per_100g,common_units";

export async function fetchAllPatientFoods(): Promise<PatientFood[]> {
  const { data, error } = await supabase
    .from("food_database")
    .select(FOOD_FIELDS)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(normalizeFood);
}

interface MacrosOnly {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

function calculateSimilarity(a: MacrosOnly, b: MacrosOnly): number {
  const calorieDiff = Math.abs(a.calories - b.calories) / Math.max(a.calories, b.calories, 1);
  const proteinDiff = Math.abs(a.protein - b.protein) / Math.max(a.protein, b.protein, 1);
  const carbsDiff = Math.abs(a.carbs - b.carbs) / Math.max(a.carbs, b.carbs, 1);
  const fatsDiff = Math.abs(a.fats - b.fats) / Math.max(a.fats, b.fats, 1);

  const avgDiff =
    calorieDiff * 0.4 + proteinDiff * 0.25 + carbsDiff * 0.2 + fatsDiff * 0.15;

  return Math.max(0, Math.min(100, (1 - avgDiff) * 100));
}

function calculateQuantityAdjustment(
  origPer100g: MacrosOnly,
  subPer100g: MacrosOnly,
  origQtyG: number
): number {
  if (subPer100g.calories === 0) return origQtyG;
  const ratio = origPer100g.calories / subPer100g.calories;
  return origQtyG * ratio;
}

export async function findPatientSubstitutions(
  foodId: string,
  options: { limit?: number; referenceQuantityG?: number } = {}
): Promise<PatientSubstitutionsResult | null> {
  const { limit = 12, referenceQuantityG = 100 } = options;

  const { data: original, error } = await supabase
    .from("food_database")
    .select(FOOD_FIELDS)
    .eq("id", foodId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !original) return null;

  const originalNormalized = normalizeFood(original);
  const macroGroup = originalNormalized.macro_group;

  const { data: candidates } = await supabase
    .from("food_database")
    .select(FOOD_FIELDS)
    .eq("is_active", true)
    .neq("id", original.id)
    .in("category", categoriesOfMacroGroup(macroGroup));

  if (!candidates || candidates.length === 0) {
    return {
      original: originalNormalized,
      reference_quantity_g: referenceQuantityG,
      substitutions: [],
    };
  }

  const origMacros: MacrosOnly = {
    calories: originalNormalized.calories_per_100g,
    protein: originalNormalized.protein_per_100g,
    carbs: originalNormalized.carbs_per_100g,
    fats: originalNormalized.fats_per_100g,
  };

  const subs: PatientSubstitution[] = candidates.map((raw: any) => {
    const food = normalizeFood(raw);
    const subMacros: MacrosOnly = {
      calories: food.calories_per_100g,
      protein: food.protein_per_100g,
      carbs: food.carbs_per_100g,
      fats: food.fats_per_100g,
    };
    const similarity = calculateSimilarity(origMacros, subMacros);
    const equivalentGrams = calculateQuantityAdjustment(origMacros, subMacros, referenceQuantityG);

    return {
      id: food.id,
      name: food.name,
      category: food.category,
      macro_group: food.macro_group,
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fats_per_100g: food.fats_per_100g,
      similarity_score: Math.round(similarity),
      equivalent_grams: Math.round(equivalentGrams),
      household_measure: formatHouseholdMeasure(equivalentGrams, food.common_units),
      common_units: food.common_units,
    };
  });

  subs.sort((a, b) => b.similarity_score - a.similarity_score);

  return {
    original: originalNormalized,
    reference_quantity_g: referenceQuantityG,
    substitutions: subs.slice(0, limit),
  };
}

function normalizeFood(raw: any): PatientFood {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category ?? "",
    macro_group: getMacroGroupOfCategory(raw.category),
    calories_per_100g: Number(raw.calories_per_100g) || 0,
    protein_per_100g: Number(raw.protein_per_100g) || 0,
    carbs_per_100g: Number(raw.carbs_per_100g) || 0,
    fats_per_100g: Number(raw.fats_per_100g) || 0,
    fiber_per_100g: raw.fiber_per_100g != null ? Number(raw.fiber_per_100g) : null,
    sodium_per_100g: raw.sodium_per_100g != null ? Number(raw.sodium_per_100g) : null,
    common_units: normalizeCommonUnits(raw.common_units),
  };
}

export function normalizeCommonUnits(raw: unknown): HouseholdUnit[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    const out: HouseholdUnit[] = [];
    for (const entry of raw) {
      if (entry && typeof entry === "object" && "unit" in entry && "grams" in entry) {
        const grams = Number((entry as any).grams);
        const unit = String((entry as any).unit ?? "").trim();
        if (unit && Number.isFinite(grams) && grams > 0) {
          out.push({ unit: humanizeUnit(unit), grams });
        }
      }
    }
    return out;
  }

  if (typeof raw === "object") {
    const out: HouseholdUnit[] = [];
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const grams = Number(v);
      if (Number.isFinite(grams) && grams > 0) {
        out.push({ unit: humanizeUnit(k), grams });
      }
    }
    return out;
  }

  return [];
}

function humanizeUnit(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toLowerCase())
    .trim();
}

export function formatHouseholdMeasure(
  grams: number,
  commonUnits: HouseholdUnit[]
): string | null {
  if (!commonUnits.length || !Number.isFinite(grams) || grams <= 0) return null;

  const ranked = commonUnits
    .map((u) => ({ unit: u, qty: grams / u.grams }))
    .filter((x) => Number.isFinite(x.qty) && x.qty > 0)
    .sort((a, b) => Math.abs(Math.log(a.qty)) - Math.abs(Math.log(b.qty)));

  const best = ranked[0];
  if (!best) return null;

  const rounded = Math.round(best.qty * 2) / 2;
  if (rounded < 0.5) return null;

  const label = best.unit.unit;
  const plural = rounded === 1 ? label : pluralize(label);
  return `${formatQty(rounded)} ${plural}`;
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1).replace(".", ",");
}

function pluralize(word: string): string {
  if (/s$/i.test(word)) return word;
  return `${word}s`;
}
