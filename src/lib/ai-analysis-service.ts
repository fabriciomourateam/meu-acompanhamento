import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];

export interface AnalysisInsight {
  type: 'strength' | 'warning' | 'suggestion' | 'goal';
  icon: string;
  title: string;
  description: string;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIAnalysisResult {
  strengths: AnalysisInsight[];
  warnings: AnalysisInsight[];
  suggestions: AnalysisInsight[];
  goals: AnalysisInsight[];
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Analisa os check-ins do paciente e gera insights inteligentes
 */
export function analyzePatientProgress(checkins: Checkin[]): AIAnalysisResult {
  if (checkins.length === 0) {
    return {
      strengths: [],
      warnings: [],
      suggestions: [],
      goals: [],
      overallScore: 0,
      trend: 'stable'
    };
  }

  const strengths: AnalysisInsight[] = [];
  const warnings: AnalysisInsight[] = [];
  const suggestions: AnalysisInsight[] = [];
  const goals: AnalysisInsight[] = [];

  // Calcular médias
  const avgWorkout = calculateAverage(checkins, 'pontos_treinos');
  const avgCardio = calculateAverage(checkins, 'pontos_cardios');
  const avgSleep = calculateAverage(checkins, 'pontos_sono');
  const avgWater = calculateAverage(checkins, 'pontos_agua');
  const avgStress = calculateAverage(checkins, 'pontos_stress');
  const avgLibido = calculateAverage(checkins, 'pontos_libido');
  const avgTotal = calculateAverage(checkins, 'total_pontuacao');

  // Analisar evolução de peso e composição corporal
  const weightAnalysis = analyzeWeightTrend(checkins);
  if (weightAnalysis) {
    if (weightAnalysis.trend === 'losing') {
      strengths.push({
        type: 'strength',
        icon: '📉',
        title: 'Ótima evolução na composição corporal!',
        description: `Redução de ${Math.abs(weightAnalysis.change).toFixed(1)}kg - possível perda de gordura`,
        priority: 'high'
      });
    } else if (weightAnalysis.trend === 'gaining' && weightAnalysis.change > 2) {
      warnings.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Mudança significativa na composição',
        description: `Aumento de ${weightAnalysis.change.toFixed(1)}kg detectado`,
        recommendation: 'Avaliar se é ganho de massa muscular ou gordura. Revisar dieta e treino',
        priority: 'high'
      });
    }
  }

  // Analisar treinos (foco em hipertrofia e composição)
  if (avgWorkout >= 8) {
    strengths.push({
      type: 'strength',
      icon: '💪',
      title: 'Treinos consistentes para ganho muscular',
      description: `Pontuação média: ${avgWorkout.toFixed(1)}/10 - ótimo para hipertrofia`,
      priority: 'high'
    });
  } else if (avgWorkout < 6) {
    warnings.push({
      type: 'warning',
      icon: '🏋️',
      title: 'Volume de treino insuficiente para recomposição',
      description: `Média: ${avgWorkout.toFixed(1)}/10 - dificulta ganho muscular`,
      recommendation: 'Mínimo 4 treinos de força/semana para otimizar composição corporal',
      priority: 'high'
    });
    suggestions.push({
      type: 'suggestion',
      icon: '📅',
      title: 'Estabelecer rotina de treino progressivo',
      description: 'Treinos consistentes são essenciais para ganhar massa muscular',
      recommendation: 'Segunda/Quarta/Sexta/Sábado - foco em compostos e progressão de carga',
      priority: 'medium'
    });
  }

  // Analisar cardio (equilibrado para composição corporal)
  if (avgCardio >= 7) {
    strengths.push({
      type: 'strength',
      icon: '❤️',
      title: 'Cardio adequado para definição',
      description: `Pontuação: ${avgCardio.toFixed(1)}/10 - ajuda na perda de gordura sem prejuízo muscular`,
      priority: 'medium'
    });
  } else if (avgCardio < 5) {
    suggestions.push({
      type: 'suggestion',
      icon: '🏃',
      title: 'Cardio estratégico para definição',
      description: 'Cardio moderado ajuda queimar gordura preservando músculo',
      recommendation: '2-3x/semana, 20-30min após treino de força ou em jejum moderado (HIIT ou LISS)',
      priority: 'high'
    });
  } else if (avgCardio > 8) {
    warnings.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Cardio em excesso pode afetar ganho muscular',
      description: `Pontuação alta: ${avgCardio.toFixed(1)}/10 - pode interferir na recuperação`,
      recommendation: 'Reduzir volume de cardio se objetivo é ganhar massa muscular',
      priority: 'medium'
    });
  }

  // Analisar sono (crítico para composição corporal)
  if (avgSleep < 6) {
    warnings.push({
      type: 'warning',
      icon: '😴',
      title: 'Sono inadequado prejudica ganho muscular',
      description: `Pontuação: ${avgSleep.toFixed(1)}/10 - afeta recuperação e síntese proteica`,
      recommendation: 'Rotina de sono 7-9h: hormônio do crescimento é liberado durante sono profundo',
      priority: 'high'
    });
    suggestions.push({
      type: 'suggestion',
      icon: '🌙',
      title: 'Otimize sono para hipertrofia',
      description: 'Sono ruim = perda de músculo, metabolismo lento, mais gordura corporal',
      recommendation: 'Dormir 22h-6h, quarto escuro/frio, evitar telas 1h antes, suplemento de magnésio',
      priority: 'high'
    });
  } else if (avgSleep >= 8) {
    strengths.push({
      type: 'strength',
      icon: '😊',
      title: 'Sono excelente para recuperação muscular',
      description: `Pontuação: ${avgSleep.toFixed(1)}/10 - ótimo para síntese proteica e queima de gordura`,
      priority: 'medium'
    });
  }

  // Analisar hidratação (importante para performance muscular)
  if (avgWater >= 8) {
    strengths.push({
      type: 'strength',
      icon: '💧',
      title: 'Hidratação ótima para performance',
      description: `Pontuação: ${avgWater.toFixed(1)}/10 - essencial para síntese proteica e força`,
      priority: 'low'
    });
  } else if (avgWater < 6) {
    warnings.push({
      type: 'warning',
      icon: '🚰',
      title: 'Desidratação prejudica ganho muscular',
      description: `Média: ${avgWater.toFixed(1)}/10 - afeta força e recuperação`,
      recommendation: 'Mínimo 35ml/kg de peso corporal - músculo é 75% água!',
      priority: 'medium'
    });
  }

  // Analisar stress (afeta hormônios e composição)
  if (avgStress < 5) {
    warnings.push({
      type: 'warning',
      icon: '😰',
      title: 'Stress alto = cortisol alto = catabolismo muscular',
      description: `Pontuação: ${avgStress.toFixed(1)}/10 - prejudica ganho de massa e queima de gordura`,
      recommendation: 'Cortisol elevado destrói músculo e acumula gordura abdominal',
      priority: 'high'
    });
    suggestions.push({
      type: 'suggestion',
      icon: '🧘',
      title: 'Controlar stress para otimizar resultados',
      description: 'Stress crônico bloqueia progresso físico via hormônios',
      recommendation: 'Meditação 10min/dia, sono adequado, ashwagandha, reduzir cafeína',
      priority: 'medium'
    });
  } else if (avgStress >= 8) {
    strengths.push({
      type: 'strength',
      icon: '😌',
      title: 'Excelente controle hormonal via stress',
      description: `Pontuação: ${avgStress.toFixed(1)}/10 - cortisol baixo favorece anabolismo`,
      priority: 'low'
    });
  }

  // Analisar tendências dos últimos check-ins
  const recentTrend = analyzeRecentTrend(checkins);
  if (recentTrend === 'improving') {
    strengths.push({
      type: 'strength',
      icon: '📈',
      title: 'Tendência positiva nos últimos check-ins',
      description: 'Suas pontuações estão melhorando consistentemente',
      priority: 'high'
    });
  } else if (recentTrend === 'declining') {
    warnings.push({
      type: 'warning',
      icon: '📉',
      title: 'Queda no desempenho recente',
      description: 'Últimos check-ins mostram pontuações menores',
      recommendation: 'Revisar rotina e identificar possíveis causas',
      priority: 'high'
    });
  }

  // Gerar metas personalizadas
  const personalizedGoals = generateGoals(checkins, avgWorkout, avgCardio, avgSleep, avgWater);
  goals.push(...personalizedGoals);

  // Calcular score geral e tendência
  const overallScore = avgTotal;
  const trend = recentTrend;

  return {
    strengths,
    warnings,
    suggestions,
    goals,
    overallScore,
    trend
  };
}

/**
 * Calcula média de um campo específico
 */
function calculateAverage(checkins: Checkin[], field: keyof Checkin): number {
  const values = checkins
    .map(c => parseFloat(c[field] as string || '0'))
    .filter(v => !isNaN(v) && v > 0);

  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Analisa tendência de peso
 */
function analyzeWeightTrend(checkins: Checkin[]) {
  // Ordenar checkins do mais antigo para o mais recente para análise correta
  const sortedCheckins = [...checkins]
    .filter(c => c.peso)
    .sort((a, b) => new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime());

  const weights = sortedCheckins.map(c => parseFloat(c.peso || '0'));

  if (weights.length < 2) return null;

  const firstWeight = weights[0];
  const lastWeight = weights[weights.length - 1];
  const change = lastWeight - firstWeight;

  return {
    change,
    trend: change < -0.5 ? 'losing' : change > 0.5 ? 'gaining' : 'stable'
  };
}

/**
 * Analisa tendência recente (últimos 3 check-ins)
 */
function analyzeRecentTrend(checkins: Checkin[]): 'improving' | 'stable' | 'declining' {
  if (checkins.length < 3) return 'stable';

  // Ordenar do mais antigo para o mais recente
  const sortedCheckins = [...checkins].sort((a, b) =>
    new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
  );

  const recent = sortedCheckins.slice(-3);
  const scores = recent
    .map(c => parseFloat(c.total_pontuacao || '0'))
    .filter(s => !isNaN(s));

  if (scores.length < 2) return 'stable';

  const trend = scores[scores.length - 1] - scores[0];

  if (trend > 0.5) return 'improving';
  if (trend < -0.5) return 'declining';
  return 'stable';
}

/**
 * Gera metas personalizadas focadas em composição corporal
 */
function generateGoals(
  checkins: Checkin[],
  avgWorkout: number,
  avgCardio: number,
  avgSleep: number,
  avgWater: number
): AnalysisInsight[] {
  const goals: AnalysisInsight[] = [];

  // Meta de composição corporal
  const weightData = analyzeWeightTrend(checkins);
  if (weightData) {
    if (weightData.change > 0) {
      goals.push({
        type: 'goal',
        icon: '🎯',
        title: 'Otimizar composição corporal',
        description: 'Reduzir percentual de gordura mantendo/aumentando massa muscular',
        recommendation: 'Déficit calórico moderado (300-500 kcal), proteína 2-2.5g/kg, treino de força 4x/semana com progressão de carga, descanso 60-90s entre séries para preservar músculo',
        priority: 'high'
      });
    } else if (weightData.change < -3) {
      goals.push({
        type: 'goal',
        icon: '💪',
        title: 'Preservar massa muscular magra',
        description: 'Continuar reduzindo gordura sem perder músculo',
        recommendation: 'Proteína alta (2.5g/kg), treino de força intenso com progressão de carga, descanso adequado 60-90s, não reduzir calorias drasticamente para manter força e músculo',
        priority: 'high'
      });
    } else {
      goals.push({
        type: 'goal',
        icon: '⚖️',
        title: 'Recomposição corporal',
        description: 'Ganhar massa muscular enquanto reduz gordura',
        recommendation: 'Calorias de manutenção, proteína alta (2-2.5g/kg), treino intenso com progressão de carga semanal (2-5%), descanso 60-90s entre séries, foco em compostos',
        priority: 'high'
      });
    }
  } else {
    // Caso não tenha dados de peso suficientes
    goals.push({
      type: 'goal',
      icon: '🎯',
      title: 'Melhorar composição corporal',
      description: 'Foco em ganho de massa muscular e redução de gordura',
      recommendation: 'Treino de força com progressão de carga semanal, descanso adequado 60-90s entre séries, proteína 2-2.5g/kg, acompanhar medidas e força nos exercícios',
      priority: 'high'
    });
  }

  // Meta de treino para hipertrofia/força
  if (avgWorkout < 8) {
    goals.push({
      type: 'goal',
      icon: '💪',
      title: 'Maximizar ganho de massa muscular',
      description: `Elevar consistência de treinos de ${avgWorkout.toFixed(1)} para 8.5+`,
      recommendation: 'Progressão de carga semanal (2-5%), descanso 60-90s entre séries, 8-12 reps até falha técnica, foco em exercícios compostos (agachamento, supino, terra)',
      priority: 'high'
    });
  } else {
    goals.push({
      type: 'goal',
      icon: '🔥',
      title: 'Manter hipertrofia e definição',
      description: 'Continuar com treinos intensos para preservar/ganhar músculo',
      recommendation: 'Progressão de carga constante (aumentar 2-5% semanalmente), descanso adequado 60-90s entre séries, variar rep ranges (6-15 reps), priorizar exercícios compostos',
      priority: 'medium'
    });
  }

  // Meta de sono para recuperação muscular
  if (avgSleep < 8) {
    goals.push({
      type: 'goal',
      icon: '😴',
      title: 'Otimizar recuperação e síntese proteica',
      description: `Melhorar sono de ${avgSleep.toFixed(1)} para 8+ (crucial para ganho muscular)`,
      recommendation: '7-9 horas por noite para máxima recuperação muscular e liberação de hormônio do crescimento. Descanso adequado = mais força e hipertrofia nos treinos',
      priority: 'high'
    });
  }

  // Meta de nutrição para composição corporal
  goals.push({
    type: 'goal',
    icon: '🥗',
    title: 'Nutrição estratégica para hipertrofia',
    description: 'Otimizar macronutrientes para maximizar ganho muscular',
    recommendation: 'Proteína: 2-2.5g/kg (essencial para síntese proteica), carboidratos pré/pós-treino (energia e recuperação), superávit calórico leve 200-300kcal para ganho muscular limpo',
    priority: 'high'
  });

  // Meta geral de composição corporal
  goals.push({
    type: 'goal',
    icon: '🏆',
    title: 'Meta de transformação física',
    description: 'Alcançar melhor relação músculo/gordura nos próximos 30 dias',
    recommendation: 'Treino: progressão de carga semanal + descanso 60-90s | Nutrição: proteína alta + timing correto | Recuperação: 7-9h sono + controle de stress para otimizar hipertrofia',
    priority: 'high'
  });

  return goals;
}

/**
 * Função preparada para integração com API de IA (OpenAI, Gemini, etc.)
 * Quando ativada, substitui ou complementa a análise baseada em regras
 */
export async function analyzeWithAI(
  checkins: Checkin[],
  apiKey?: string,
  provider: 'openai' | 'gemini' | 'claude' = 'openai'
): Promise<AIAnalysisResult | null> {
  // Se não houver API key, retorna análise baseada em regras
  if (!apiKey) {
    return analyzePatientProgress(checkins);
  }

  try {
    // Preparar dados para envio à API
    const summary = checkins.map(c => ({
      data: c.data_checkin,
      peso: c.peso,
      treino: c.pontos_treinos,
      cardio: c.pontos_cardios,
      sono: c.pontos_sono,
      agua: c.pontos_agua,
      stress: c.pontos_stress,
      total: c.total_pontuacao,
      dificuldades: c.dificuldades,
      objetivo: c.objetivo
    }));

    const prompt = `
Analise os dados de progresso fitness deste paciente e forneça insights personalizados:

${JSON.stringify(summary, null, 2)}

Forneça uma análise detalhada em JSON com:
1. Pontos fortes (strengths)
2. Pontos de atenção (warnings)
3. Sugestões de melhoria (suggestions)
4. Metas para próximo mês (goals)

Seja específico, encorajador e prático nas recomendações.
`;

    // TODO: Implementar chamada à API quando usuário fornecer key
    // Exemplo para OpenAI:
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    return parseAIResponse(data);
    */

    // Por enquanto, retorna análise baseada em regras
    console.log('API de IA não configurada, usando análise local');
    return analyzePatientProgress(checkins);

  } catch (error) {
    console.error('Erro ao analisar com IA:', error);
    // Fallback para análise local
    return analyzePatientProgress(checkins);
  }
}

