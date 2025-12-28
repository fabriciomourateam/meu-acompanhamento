import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];

export interface AIAnalysisResult {
  strengths: string[];
  warnings: string[];
  suggestions: string[];
  goals: string[];
  overallTrend: 'positive' | 'negative' | 'stable';
}

/**
 * Analisa o progresso do paciente baseado nos check-ins
 */
export function analyzePatientProgress(checkins: Checkin[]): AIAnalysisResult {
  if (checkins.length === 0) {
    return {
      strengths: [],
      warnings: [],
      suggestions: [],
      goals: [],
      overallTrend: 'stable'
    };
  }

  // Ordenar check-ins por data (mais antigo primeiro)
  const sortedCheckins = [...checkins].sort((a, b) => {
    const dateA = new Date(a.data_checkin || '').getTime();
    const dateB = new Date(b.data_checkin || '').getTime();
    return dateA - dateB;
  });

  const firstCheckin = sortedCheckins[0];
  const lastCheckin = sortedCheckins[sortedCheckins.length - 1];

  const strengths: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const goals: string[] = [];

  // Análise de peso
  if (firstCheckin.peso && lastCheckin.peso) {
    const pesoDiff = lastCheckin.peso - firstCheckin.peso;
    if (pesoDiff < 0) {
      strengths.push('Redução de peso consistente');
      goals.push('Manter a consistência na perda de peso');
    } else if (pesoDiff > 0) {
      warnings.push('Aumento de peso detectado');
      suggestions.push('Revisar hábitos alimentares e atividade física');
    }
  }

  // Análise de frequência de check-ins
  if (sortedCheckins.length >= 4) {
    strengths.push('Boa frequência de acompanhamento');
  } else {
    suggestions.push('Aumentar a frequência de check-ins para melhor acompanhamento');
  }

  // Determinar tendência geral
  let overallTrend: 'positive' | 'negative' | 'stable' = 'stable';
  if (firstCheckin.peso && lastCheckin.peso) {
    const pesoDiff = lastCheckin.peso - firstCheckin.peso;
    if (pesoDiff < -2) {
      overallTrend = 'positive';
    } else if (pesoDiff > 2) {
      overallTrend = 'negative';
    }
  }

  return {
    strengths,
    warnings,
    suggestions,
    goals,
    overallTrend
  };
}

