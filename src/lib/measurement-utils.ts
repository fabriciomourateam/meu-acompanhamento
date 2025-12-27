/**
 * Utilitários para extrair e processar medidas corporais de texto
 */

export interface MeasurementData {
  cintura: number | null;
  quadril: number | null;
}

/**
 * Extrai medidas de cintura e quadril de um texto de forma inteligente
 * Analisa o contexto e valores típicos para identificar qual número corresponde a cada medida
 * 
 * @param text - Texto contendo as medidas (ex: "64cm 97cm", "97 64", "cintura 63 quadril 97")
 * @returns Objeto com cintura e quadril extraídos
 */
export function extractMeasurements(text: string | null | undefined): MeasurementData {
  if (!text) return { cintura: null, quadril: null };
  
  const textStr = text.toString();
  
  let cintura: number | null = null;
  let quadril: number | null = null;
  
  // Padrão 1: Procurar por palavras-chave específicas com mais precisão
  // Buscar por "Cintura" seguido de dois pontos e número (incluindo texto complexo)
  // Padrões mais específicos primeiro (com palavras-chave explícitas)
  const cinturaPatterns = [
    /cintura\s+(\d+(?:\.\d+)?)(?:\s|$|cm|quadril|\n)/i, // Padrão mais específico primeiro: "Cintura 87" seguido de espaço, fim, quebra de linha ou "Quadril"
    /cintura[^:]*:\*?\s*(\d+(?:\.\d+)?)/i,
    /cintura[^:]*\s+(\d+(?:\.\d+)?)/i,
    /waist[^:]*:\*?\s*(\d+(?:\.\d+)?)/i,
    /abaixo.*costela[^:]*:\*?\s*(\d+(?:\.\d+)?)/i
  ];
  
  const quadrilPatterns = [
    /quadril\s+(\d+(?:\.\d+)?)(?:\s|$|cm|\n)/i, // Padrão mais específico primeiro: "Quadril 115" seguido de espaço, fim, quebra de linha ou "cm"
    /quadril[^:]*:\*?\s*(\d+(?:\.\d+)?)/i,
    /quadril[^:]*\s+(\d+(?:\.\d+)?)/i,
    /glúteo[^:]*:\*?\s*(\d+(?:\.\d+)?)/i,
    /hip[^:]*:\*?\s*(\d+(?:\.\d+)?)/i,
    /glúteo\s+maior[^:]*:\*?\s*(\d+(?:\.\d+)?)/i
  ];
  
  // Tentar encontrar cintura - buscar primeiro para evitar conflitos
  for (const pattern of cinturaPatterns) {
    const match = textStr.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (isValidMeasurement(value, 'cintura')) {
        cintura = value;
        break;
      }
    }
  }
  
  // Tentar encontrar quadril - buscar após cintura para evitar capturar o mesmo número
  for (const pattern of quadrilPatterns) {
    const match = textStr.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      // Verificar se não é o mesmo valor da cintura (para evitar duplicação)
      if (isValidMeasurement(value, 'quadril') && (cintura === null || value !== cintura)) {
        quadril = value;
        break;
      }
    }
  }
  
  // Se encontrou ambos com palavras-chave, retornar
  if (cintura !== null || quadril !== null) {
    return { cintura, quadril };
  }
  
  // Padrão 2: Fallback para textos simples (dois números consecutivos)
  const textLower = textStr.toLowerCase();
  const numbers = textLower.match(/\d+(?:\.\d+)?/g);
  
  if (!numbers || numbers.length < 2) {
    // Se só tem um número, tentar identificar pelo contexto
    if (numbers && numbers.length === 1) {
      const num = parseFloat(numbers[0]);
      if (textLower.includes('quadril') || textLower.includes('hip') || textLower.includes('glúteo')) {
        return { cintura: null, quadril: isValidMeasurement(num, 'quadril') ? num : null };
      } else if (textLower.includes('cintura') || textLower.includes('waist')) {
        return { cintura: isValidMeasurement(num, 'cintura') ? num : null, quadril: null };
      }
    }
    return { cintura: null, quadril: null };
  }
  
  const nums = numbers.map(n => parseFloat(n));
  const validNums = nums.filter(n => n >= 40 && n <= 200);
  
  if (validNums.length >= 2) {
    // Para textos simples como "63 97" ou "97 63"
    const consecutivePattern = textLower.match(/(\d+(?:\.\d+)?)\s*(?:cm|e)?\s*(\d+(?:\.\d+)?)/);
    
    if (consecutivePattern) {
      const num1 = parseFloat(consecutivePattern[1]);
      const num2 = parseFloat(consecutivePattern[2]);
      
      if (num1 >= 40 && num1 <= 200 && num2 >= 40 && num2 <= 200) {
        // Lógica para identificar qual é cintura e qual é quadril
        if (num1 >= 50 && num1 <= 100 && num2 >= 80 && num2 <= 150 && num2 > num1) {
          // num1 parece cintura, num2 parece quadril
          cintura = num1;
          quadril = num2;
        } else if (num2 >= 50 && num2 <= 100 && num1 >= 80 && num1 <= 150 && num1 > num2) {
          // num2 parece cintura, num1 parece quadril
          cintura = num2;
          quadril = num1;
        } else {
          // Usar o menor como cintura (regra geral)
          if (num1 < num2) {
            cintura = isValidMeasurement(num1, 'cintura') ? num1 : null;
            quadril = isValidMeasurement(num2, 'quadril') ? num2 : null;
          } else {
            cintura = isValidMeasurement(num2, 'cintura') ? num2 : null;
            quadril = isValidMeasurement(num1, 'quadril') ? num1 : null;
          }
        }
        
        return { cintura, quadril };
      }
    }
    
    // Fallback final - usar os dois primeiros números válidos
    const [num1, num2] = validNums;
    
    if (num1 < num2) {
      cintura = isValidMeasurement(num1, 'cintura') ? num1 : null;
      quadril = isValidMeasurement(num2, 'quadril') ? num2 : null;
    } else {
      cintura = isValidMeasurement(num2, 'cintura') ? num2 : null;
      quadril = isValidMeasurement(num1, 'quadril') ? num1 : null;
    }
  }
  
  return { cintura, quadril };
}

/**
 * Valida se uma medida está dentro de um range razoável
 */
export function isValidMeasurement(value: number, type: 'cintura' | 'quadril'): boolean {
  if (type === 'cintura') {
    return value >= 50 && value <= 120;
  } else {
    return value >= 70 && value <= 150;
  }
}

/**
 * Formata uma medida para exibição
 */
export function formatMeasurement(value: number | null): string {
  if (!value) return 'N/A';
  return `${value}cm`;
}

