import type { PatientFood, PatientSubstitution } from "./patient-substitutions-service";

/**
 * Gera uma explicação curta e determinística de por que uma substituição funciona,
 * baseada nas diferenças de macros entre original e substituto. Sem IA.
 */
export function generateSubstitutionExplanation(
  original: PatientFood,
  sub: PatientSubstitution,
  referenceGrams: number
): string {
  const parts: string[] = [];

  if (sub.similarity_score >= 90) {
    parts.push("Praticamente equivalentes em macros.");
  } else if (sub.similarity_score >= 80) {
    parts.push("Macros bem parecidos.");
  } else if (sub.similarity_score >= 70) {
    parts.push("Boa equivalência calórica, com leve variação nos macros.");
  } else {
    parts.push("Substituição razoável: o ajuste de quantidade compensa a diferença calórica.");
  }

  const dominant = dominantMacro(original);
  if (dominant === "protein") {
    parts.push("Ambos têm proteína como macro principal.");
  } else if (dominant === "carbs") {
    parts.push("Ambos são fonte principal de carboidratos.");
  } else if (dominant === "fats") {
    parts.push("Ambos são fonte principal de gorduras.");
  }

  const refMul = referenceGrams / 100;
  const subMul = sub.equivalent_grams / 100;
  const diffP = Math.abs(original.protein_per_100g * refMul - sub.protein_per_100g * subMul);
  const diffC = Math.abs(original.carbs_per_100g * refMul - sub.carbs_per_100g * subMul);
  const diffG = Math.abs(original.fats_per_100g * refMul - sub.fats_per_100g * subMul);

  const max = Math.max(diffP, diffC, diffG);
  if (max >= 3) {
    if (max === diffP) parts.push(`Diferença principal: ~${diffP.toFixed(0)}g de proteína.`);
    else if (max === diffC) parts.push(`Diferença principal: ~${diffC.toFixed(0)}g de carboidrato.`);
    else parts.push(`Diferença principal: ~${diffG.toFixed(0)}g de gordura.`);
  }

  return parts.join(" ");
}

function dominantMacro(food: {
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}): "protein" | "carbs" | "fats" | null {
  const p = food.protein_per_100g * 4;
  const c = food.carbs_per_100g * 4;
  const f = food.fats_per_100g * 9;
  const max = Math.max(p, c, f);
  if (max <= 0) return null;
  if (max === p) return "protein";
  if (max === c) return "carbs";
  return "fats";
}
