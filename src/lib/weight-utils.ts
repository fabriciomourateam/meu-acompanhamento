/**
 * Remove unidades de medida e caracteres extras do peso
 * Exemplos:
 * "75kg" -> "75"
 * "75 kg" -> "75"
 * "75,5kg" -> "75,5"
 * "75.5 kgs" -> "75.5"
 */
export function cleanWeight(weight: string | null | undefined): string {
  if (!weight) return '';
  
  // Converter para string e remover espaços extras
  let cleaned = weight.toString().trim();
  
  // Remover "kg", "kgs", "Kg", "KG", etc (case insensitive)
  cleaned = cleaned.replace(/\s*kgs?\s*/gi, '');
  
  // Remover outros caracteres não numéricos exceto vírgula e ponto
  cleaned = cleaned.replace(/[^\d.,]/g, '');
  
  return cleaned;
}

/**
 * Formata o peso para exibição com "kg"
 * Garante que não haja duplicação de "kg"
 */
export function formatWeight(weight: string | null | undefined): string {
  if (!weight) return 'N/A';
  
  const cleaned = cleanWeight(weight);
  if (!cleaned) return 'N/A';
  
  return `${cleaned} kg`;
}

/**
 * Converte peso para número (útil para cálculos)
 */
export function parseWeight(weight: string | null | undefined): number | null {
  const cleaned = cleanWeight(weight);
  if (!cleaned) return null;
  
  // Substituir vírgula por ponto para conversão
  const normalized = cleaned.replace(',', '.');
  const parsed = parseFloat(normalized);
  
  return isNaN(parsed) ? null : parsed;
}
