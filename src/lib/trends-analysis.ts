// Sistema de Análise de Tendências e Insights
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];

export interface Trend {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'positive' | 'negative' | 'neutral' | 'insight';
  color: string;
  confidence: number; // 0-100
  recommendation?: string;
}

export function analyzeTrends(checkins: Checkin[]): Trend[] {
  const trends: Trend[] = [];

  if (checkins.length < 3) {
    return [{
      id: 'not_enough_data',
      title: 'Dados Insuficientes',
      description: 'Continue fazendo check-ins para gerar análises personalizadas',
      icon: '📊',
      type: 'neutral',
      color: 'from-slate-500 to-slate-600',
      confidence: 100
    }];
  }

  // Ordenar do mais antigo para o mais recente
  const sorted = [...checkins].sort((a, b) => 
    new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
  );

  // Análise de Peso
  const weightTrend = analyzeWeightTrend(sorted);
  if (weightTrend) trends.push(weightTrend);

  // Análise de Sono
  const sleepTrend = analyzeSleepPattern(sorted);
  if (sleepTrend) trends.push(sleepTrend);

  // Análise de Hidratação
  const waterTrend = analyzeWaterPattern(sorted);
  if (waterTrend) trends.push(waterTrend);

  // Análise de Treino
  const workoutTrend = analyzeWorkoutPattern(sorted);
  if (workoutTrend) trends.push(workoutTrend);

  // Análise de Stress
  const stressTrend = analyzeStressPattern(sorted);
  if (stressTrend) trends.push(stressTrend);

  // Análise de Fim de Semana vs Dias de Semana
  const weekendTrend = analyzeWeekendVsWeekday(sorted);
  if (weekendTrend) trends.push(weekendTrend);

  // Correlações
  const correlations = analyzeCorrelations(sorted);
  trends.push(...correlations);

  // Análise de Consistência
  const consistencyTrend = analyzeConsistency(sorted);
  if (consistencyTrend) trends.push(consistencyTrend);

  // Ordenar por confiança (maior primeiro)
  return trends.sort((a, b) => b.confidence - a.confidence);
}

function analyzeWeightTrend(checkins: Checkin[]): Trend | null {
  const last5 = checkins.slice(-5);
  if (last5.length < 3) return null;

  const weights = last5.map(c => parseFloat(c.peso || '0')).filter(w => w > 0);
  if (weights.length < 3) return null;

  const avgFirst = weights.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
  const avgLast = weights.slice(-2).reduce((a, b) => a + b, 0) / 2;
  const diff = avgLast - avgFirst;
  const percentChange = (diff / avgFirst) * 100;

  if (Math.abs(diff) < 0.3) {
    return {
      id: 'weight_stable',
      title: 'Peso Estável',
      description: `Seu peso manteve-se estável (±${Math.abs(diff).toFixed(1)}kg) nos últimos check-ins`,
      icon: '⚖️',
      type: 'neutral',
      color: 'from-blue-500 to-cyan-500',
      confidence: 75,
      recommendation: 'Se seu objetivo é perda de peso, considere ajustar dieta ou intensidade dos treinos'
    };
  }

  if (diff < 0) {
    return {
      id: 'weight_decreasing',
      title: 'Tendência de Perda',
      description: `Você perdeu ${Math.abs(diff).toFixed(1)}kg (${Math.abs(percentChange).toFixed(1)}%) nos últimos check-ins`,
      icon: '📉',
      type: 'positive',
      color: 'from-green-500 to-emerald-500',
      confidence: 85,
      recommendation: 'Excelente! Continue com a estratégia atual'
    };
  } else {
    return {
      id: 'weight_increasing',
      title: 'Tendência de Ganho',
      description: `Seu peso aumentou ${diff.toFixed(1)}kg (${percentChange.toFixed(1)}%) recentemente`,
      icon: '📈',
      type: 'negative',
      color: 'from-orange-500 to-red-500',
      confidence: 80,
      recommendation: 'Revise seus hábitos alimentares e certifique-se de estar em déficit calórico'
    };
  }
}

function analyzeSleepPattern(checkins: Checkin[]): Trend | null {
  const sleepScores = checkins.map(c => parseFloat(c.pontos_sono || '0'));
  const avgSleep = sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length;

  if (avgSleep >= 8) {
    return {
      id: 'sleep_excellent',
      title: 'Sono Excelente',
      description: `Média de ${avgSleep.toFixed(1)}/10 pontos de sono - Recuperação ideal!`,
      icon: '😴',
      type: 'positive',
      color: 'from-purple-500 to-indigo-500',
      confidence: 90
    };
  } else if (avgSleep < 6) {
    return {
      id: 'sleep_poor',
      title: 'Sono Insuficiente',
      description: `Média de ${avgSleep.toFixed(1)}/10 pontos - Isso pode afetar seus resultados`,
      icon: '⚠️',
      type: 'negative',
      color: 'from-red-500 to-orange-500',
      confidence: 85,
      recommendation: 'Priorize 7-9 horas de sono por noite. Sono é essencial para recuperação muscular e perda de gordura'
    };
  }

  return null;
}

function analyzeWaterPattern(checkins: Checkin[]): Trend | null {
  const waterScores = checkins.map(c => parseFloat(c.pontos_agua || '0'));
  const avgWater = waterScores.reduce((a, b) => a + b, 0) / waterScores.length;

  if (avgWater >= 8) {
    return {
      id: 'water_excellent',
      title: 'Hidratação Perfeita',
      description: `Média de ${avgWater.toFixed(1)}/10 pontos - Você está bem hidratado!`,
      icon: '💧',
      type: 'positive',
      color: 'from-cyan-500 to-blue-500',
      confidence: 88
    };
  } else if (avgWater < 5) {
    return {
      id: 'water_low',
      title: 'Hidratação Baixa',
      description: `Média de ${avgWater.toFixed(1)}/10 pontos - Beba mais água!`,
      icon: '💧',
      type: 'negative',
      color: 'from-orange-500 to-red-500',
      confidence: 82,
      recommendation: 'Aumente sua ingestão de água. Meta: 35ml por kg de peso corporal'
    };
  }

  return null;
}

function analyzeWorkoutPattern(checkins: Checkin[]): Trend | null {
  const workoutScores = checkins.map(c => parseFloat(c.pontos_treinos || '0'));
  const avgWorkout = workoutScores.reduce((a, b) => a + b, 0) / workoutScores.length;

  if (avgWorkout >= 8) {
    return {
      id: 'workout_consistent',
      title: 'Treinos Consistentes',
      description: `Média de ${avgWorkout.toFixed(1)}/10 pontos - Dedicação exemplar!`,
      icon: '💪',
      type: 'positive',
      color: 'from-green-500 to-emerald-500',
      confidence: 92
    };
  } else if (avgWorkout < 5) {
    return {
      id: 'workout_low',
      title: 'Frequência de Treino Baixa',
      description: `Média de ${avgWorkout.toFixed(1)}/10 pontos - Aumente a frequência`,
      icon: '⚠️',
      type: 'negative',
      color: 'from-red-500 to-pink-500',
      confidence: 87,
      recommendation: 'Tente treinar pelo menos 3-4x por semana para melhores resultados'
    };
  }

  return null;
}

function analyzeStressPattern(checkins: Checkin[]): Trend | null {
  const stressScores = checkins.map(c => parseFloat(c.pontos_stress || '0'));
  const avgStress = stressScores.reduce((a, b) => a + b, 0) / stressScores.length;

  if (avgStress < 4) {
    return {
      id: 'stress_high',
      title: 'Stress Elevado',
      description: `Média de ${avgStress.toFixed(1)}/10 pontos - Cuide da sua saúde mental`,
      icon: '😰',
      type: 'negative',
      color: 'from-red-500 to-orange-500',
      confidence: 78,
      recommendation: 'Pratique meditação, respiração profunda ou atividades relaxantes. Stress alto prejudica resultados'
    };
  } else if (avgStress >= 7) {
    return {
      id: 'stress_low',
      title: 'Stress Controlado',
      description: `Média de ${avgStress.toFixed(1)}/10 pontos - Equilíbrio mental excelente!`,
      icon: '😌',
      type: 'positive',
      color: 'from-green-500 to-teal-500',
      confidence: 80
    };
  }

  return null;
}

function analyzeWeekendVsWeekday(checkins: Checkin[]): Trend | null {
  const weekdayCheckins = checkins.filter(c => {
    const day = new Date(c.data_checkin).getDay();
    return day >= 1 && day <= 5; // Segunda a Sexta
  });

  const weekendCheckins = checkins.filter(c => {
    const day = new Date(c.data_checkin).getDay();
    return day === 0 || day === 6; // Sábado e Domingo
  });

  if (weekdayCheckins.length < 3 || weekendCheckins.length < 2) return null;

  const avgWeekday = weekdayCheckins.reduce((acc, c) => 
    acc + parseFloat(c.total_pontuacao || '0'), 0
  ) / weekdayCheckins.length;

  const avgWeekend = weekendCheckins.reduce((acc, c) => 
    acc + parseFloat(c.total_pontuacao || '0'), 0
  ) / weekendCheckins.length;

  const diff = avgWeekday - avgWeekend;

  if (diff > 1.5) {
    return {
      id: 'weekend_dip',
      title: 'Queda no Fim de Semana',
      description: `Sua pontuação cai ${diff.toFixed(1)} pontos nos fins de semana`,
      icon: '📅',
      type: 'insight',
      color: 'from-yellow-500 to-orange-500',
      confidence: 75,
      recommendation: 'Planeje suas refeições do fim de semana com antecedência e mantenha-se ativo'
    };
  } else if (diff < -1.5) {
    return {
      id: 'weekend_better',
      title: 'Melhor no Fim de Semana',
      description: `Você performa ${Math.abs(diff).toFixed(1)} pontos melhor nos fins de semana!`,
      icon: '🎉',
      type: 'positive',
      color: 'from-green-500 to-emerald-500',
      confidence: 72
    };
  }

  return null;
}

function analyzeCorrelations(checkins: Checkin[]): Trend[] {
  const trends: Trend[] = [];

  // Correlação entre sono e pontuação total
  const sleepVsTotal = calculateCorrelation(
    checkins.map(c => parseFloat(c.pontos_sono || '0')),
    checkins.map(c => parseFloat(c.total_pontuacao || '0'))
  );

  if (sleepVsTotal > 0.6) {
    trends.push({
      id: 'sleep_performance_correlation',
      title: 'Sono Afeta Performance',
      description: 'Você performa melhor quando dorme bem! Correlação forte detectada',
      icon: '🌙',
      type: 'insight',
      color: 'from-indigo-500 to-purple-500',
      confidence: Math.round(sleepVsTotal * 100),
      recommendation: 'Priorize 8h de sono para maximizar seus resultados'
    });
  }

  // Correlação entre hidratação e pontuação
  const waterVsTotal = calculateCorrelation(
    checkins.map(c => parseFloat(c.pontos_agua || '0')),
    checkins.map(c => parseFloat(c.total_pontuacao || '0'))
  );

  if (waterVsTotal > 0.5) {
    trends.push({
      id: 'water_performance_correlation',
      title: 'Hidratação é Chave',
      description: 'Dias com boa hidratação resultam em melhor desempenho geral',
      icon: '💦',
      type: 'insight',
      color: 'from-cyan-500 to-blue-500',
      confidence: Math.round(waterVsTotal * 100)
    });
  }

  return trends;
}

function analyzeConsistency(checkins: Checkin[]): Trend | null {
  // Calcular desvio padrão das pontuações
  const scores = checkins.map(c => parseFloat(c.total_pontuacao || '0'));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((acc, score) => acc + Math.pow(score - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 1.5) {
    return {
      id: 'high_consistency',
      title: 'Consistência Impressionante',
      description: `Suas pontuações são muito consistentes (desvio: ${stdDev.toFixed(2)})`,
      icon: '🎯',
      type: 'positive',
      color: 'from-blue-500 to-purple-500',
      confidence: 88,
      recommendation: 'Sua consistência é excelente! Continue assim para resultados duradouros'
    };
  } else if (stdDev > 3) {
    return {
      id: 'low_consistency',
      title: 'Variação Alta',
      description: `Suas pontuações variam bastante (desvio: ${stdDev.toFixed(2)})`,
      icon: '📊',
      type: 'insight',
      color: 'from-yellow-500 to-orange-500',
      confidence: 75,
      recommendation: 'Tente manter uma rotina mais regular para otimizar seus resultados'
    };
  }

  return null;
}

// Calcular correlação de Pearson entre dois arrays
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n < 3) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;

  return numerator / denominator;
}

