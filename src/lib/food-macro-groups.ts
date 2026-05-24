/**
 * Mapeia as ~24 categorias atuais de `food_database.category` em 8 macrogrupos
 * práticos exibidos na aba pública de substituições do portal do paciente.
 *
 * O filtro rigoroso de substituição usa o macrogrupo: banana só sugere outras
 * frutas, frango só outras proteínas.
 */

export type MacroGroupId =
  | "carbos"
  | "proteinas"
  | "frutas"
  | "vegetais"
  | "gorduras"
  | "laticinios"
  | "bebidas";

export interface MacroGroupMeta {
  id: MacroGroupId;
  label: string;
  emoji: string;
  description: string;
  categories: string[];
}

const M = (id: MacroGroupId, label: string, emoji: string, description: string, categories: string[]): MacroGroupMeta =>
  ({ id, label, emoji, description, categories });

export const MACRO_GROUPS: MacroGroupMeta[] = [
  M("carbos", "Carboidratos", "🍞", "Pães, arroz, massas, tubérculos, leguminosas, doces e preparados",
    [
      "Cereais e derivados",
      "Carboidratos",
      "carboidrato",
      "Leguminosas",
      "Produtos açucarados",
      "Alimentos preparados",
      "Industrializados",
      "Miscelâneas",
      "Outros",
    ]),
  M("proteinas", "Proteínas", "🍗", "Carnes, peixes, ovos e suplementos proteicos",
    ["Carnes e derivados", "Pescados e frutos do mar", "Ovos e derivados", "Proteínas", "proteina"]),
  M("frutas", "Frutas", "🍎", "Naturais, secas e desidratadas",
    ["Frutas", "fruta"]),
  M("vegetais", "Vegetais", "🥦", "Verduras e hortaliças",
    ["Verduras e hortaliças", "vegetal"]),
  M("gorduras", "Gorduras", "🌰", "Óleos, manteigas, oleaginosas e sementes",
    ["Gorduras e óleos", "Gorduras", "Nozes e sementes"]),
  M("laticinios", "Laticínios", "🥛", "Leites, queijos e iogurtes",
    ["Leite e derivados", "laticinio"]),
  M("bebidas", "Bebidas", "🥤", "Bebidas em geral",
    ["Bebidas"]),
];

export const CATEGORY_TO_MACRO_GROUP: Record<string, MacroGroupId> = (() => {
  const out: Record<string, MacroGroupId> = {};
  for (const g of MACRO_GROUPS) {
    for (const cat of g.categories) {
      out[cat.trim().toLowerCase()] = g.id;
    }
  }
  return out;
})();

export function getMacroGroupOfCategory(category: string | null | undefined): MacroGroupId {
  if (!category) return "carbos";
  return CATEGORY_TO_MACRO_GROUP[category.trim().toLowerCase()] ?? "carbos";
}

export function getMacroGroupMeta(id: MacroGroupId): MacroGroupMeta {
  return MACRO_GROUPS.find((g) => g.id === id) ?? MACRO_GROUPS[MACRO_GROUPS.length - 1];
}

export function categoriesOfMacroGroup(id: MacroGroupId): string[] {
  return getMacroGroupMeta(id).categories;
}
