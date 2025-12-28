/**
 * Extrai medidas do texto de feedback
 */
export function extractMeasurements(text: string): {
  peso?: number;
  medidas?: Record<string, number>;
} {
  const result: {
    peso?: number;
    medidas?: Record<string, number>;
  } = {};

  // Extrair peso
  const pesoMatch = text.match(/peso[:\s]*(\d+[.,]\d+|\d+)/i);
  if (pesoMatch) {
    result.peso = parseFloat(pesoMatch[1].replace(',', '.'));
  }

  // Extrair outras medidas (exemplo básico)
  const medidas: Record<string, number> = {};
  
  // Padrões comuns de medidas
  const patterns = [
    { name: 'braco', regex: /bra[çc]o[:\s]*(\d+[.,]?\d*)/i },
    { name: 'peito', regex: /peito[:\s]*(\d+[.,]?\d*)/i },
    { name: 'cintura', regex: /cintura[:\s]*(\d+[.,]?\d*)/i },
    { name: 'quadril', regex: /quadril[:\s]*(\d+[.,]?\d*)/i },
    { name: 'coxa', regex: /coxa[:\s]*(\d+[.,]?\d*)/i },
  ];

  patterns.forEach(({ name, regex }) => {
    const match = text.match(regex);
    if (match) {
      medidas[name] = parseFloat(match[1].replace(',', '.'));
    }
  });

  if (Object.keys(medidas).length > 0) {
    result.medidas = medidas;
  }

  return result;
}

