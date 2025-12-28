// Sistema de Conquistas e Badges
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: 'weight' | 'consistency' | 'performance' | 'body_fat' | 'milestone';
  achieved: boolean;
  progress?: number; // 0-100
  maxProgress?: number;
  dateAchieved?: Date;
}

// Detectar conquistas baseadas nos check-ins
export function detectAchievements(
  checkins: Checkin[],
  bodyCompositions?: any[]
): Achievement[] {
  const achievements: Achievement[] = [];

  if (checkins.length === 0) return achievements;

  // Ordenar check-ins do mais antigo para o mais recente
  const sortedCheckins = [...checkins].sort((a, b) => 
    new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
  );

  const firstCheckin = sortedCheckins[0];
  const lastCheckin = sortedCheckins[sortedCheckins.length - 1];

  // CONQUISTAS DE PESO
  const pesoInicial = parseFloat(firstCheckin.peso || '0');
  const pesoAtual = parseFloat(lastCheckin.peso || '0');
  const pesoPerdido = pesoInicial - pesoAtual;

  if (pesoPerdido >= 5) {
    achievements.push({
      id: 'weight_5kg',
      title: '🔥 Perdeu 5kg',
      description: `Você já perdeu ${pesoPerdido.toFixed(1)}kg desde o início!`,
      icon: '🔥',
      color: 'from-orange-500 to-red-500',
      type: 'weight',
      achieved: true,
      dateAchieved: new Date(lastCheckin.data_checkin)
    });
  }

  if (pesoPerdido >= 10) {
    achievements.push({
      id: 'weight_10kg',
      title: '💪 Perdeu 10kg',
      description: `Incrível! ${pesoPerdido.toFixed(1)}kg eliminados!`,
      icon: '💪',
      color: 'from-red-500 to-pink-500',
      type: 'weight',
      achieved: true,
      dateAchieved: new Date(lastCheckin.data_checkin)
    });
  }

  if (pesoPerdido >= 15) {
    achievements.push({
      id: 'weight_15kg',
      title: '🏆 Transformação Épica',
      description: `${pesoPerdido.toFixed(1)}kg perdidos! Você é uma inspiração!`,
      icon: '🏆',
      color: 'from-yellow-500 to-orange-500',
      type: 'weight',
      achieved: true,
      dateAchieved: new Date(lastCheckin.data_checkin)
    });
  }

  // CONQUISTAS DE CONSISTÊNCIA
  const totalCheckins = sortedCheckins.length;

  if (totalCheckins >= 10) {
    achievements.push({
      id: 'consistency_10',
      title: '⭐ 10 Check-ins',
      description: 'Consistência é a chave do sucesso!',
      icon: '⭐',
      color: 'from-blue-500 to-cyan-500',
      type: 'consistency',
      achieved: true
    });
  }

  if (totalCheckins >= 30) {
    achievements.push({
      id: 'consistency_30',
      title: '🎯 30 Check-ins',
      description: 'Comprometimento exemplar!',
      icon: '🎯',
      color: 'from-purple-500 to-pink-500',
      type: 'consistency',
      achieved: true
    });
  }

  if (totalCheckins >= 50) {
    achievements.push({
      id: 'consistency_50',
      title: '👑 50 Check-ins',
      description: 'Você é um(a) campeão(ã)!',
      icon: '👑',
      color: 'from-yellow-500 to-amber-500',
      type: 'consistency',
      achieved: true
    });
  }

  // Detectar streak (dias consecutivos)
  const streak = calculateStreak(sortedCheckins);
  if (streak >= 7) {
    achievements.push({
      id: 'streak_7',
      title: '🔥 7 Dias Seguidos',
      description: `${streak} dias de dedicação sem parar!`,
      icon: '🔥',
      color: 'from-orange-500 to-red-500',
      type: 'consistency',
      achieved: true
    });
  }

  if (streak >= 30) {
    achievements.push({
      id: 'streak_30',
      title: '🚀 1 Mês Consecutivo',
      description: `${streak} dias sem falhar! Incrível!`,
      icon: '🚀',
      color: 'from-indigo-500 to-purple-500',
      type: 'consistency',
      achieved: true
    });
  }

  // CONQUISTAS DE PERFORMANCE
  const avgScore = sortedCheckins.reduce((acc, c) => 
    acc + parseFloat(c.total_pontuacao || '0'), 0
  ) / totalCheckins;

  if (avgScore >= 8) {
    achievements.push({
      id: 'high_performer',
      title: '⚡ Alta Performance',
      description: `Média de ${avgScore.toFixed(1)} pontos! Excelente!`,
      icon: '⚡',
      color: 'from-green-500 to-emerald-500',
      type: 'performance',
      achieved: true
    });
  }

  // Semana perfeita (todos os dias com pontuação >= 8)
  const perfectWeeks = detectPerfectWeeks(sortedCheckins);
  if (perfectWeeks > 0) {
    achievements.push({
      id: 'perfect_week',
      title: '✨ Semana Impecável',
      description: `${perfectWeeks} semana(s) com pontuações perfeitas!`,
      icon: '✨',
      color: 'from-cyan-500 to-blue-500',
      type: 'performance',
      achieved: true
    });
  }

  // CONQUISTAS DE % GORDURA
  if (bodyCompositions && bodyCompositions.length >= 2) {
    const sortedBio = [...bodyCompositions].sort((a, b) => 
      new Date(a.data_avaliacao).getTime() - new Date(b.data_avaliacao).getTime()
    );
    const firstBio = sortedBio[0];
    const lastBio = sortedBio[sortedBio.length - 1];
    
    const gorduraInicial = firstBio.percentual_gordura;
    const gorduraAtual = lastBio.percentual_gordura;
    const gorduraPerdida = gorduraInicial - gorduraAtual;

    if (gorduraPerdida >= 3) {
      achievements.push({
        id: 'body_fat_3',
        title: '💎 Definição Iniciada',
        description: `${gorduraPerdida.toFixed(1)}% de gordura eliminada!`,
        icon: '💎',
        color: 'from-teal-500 to-cyan-500',
        type: 'body_fat',
        achieved: true,
        dateAchieved: new Date(lastBio.data_avaliacao)
      });
    }

    if (gorduraPerdida >= 5) {
      achievements.push({
        id: 'body_fat_5',
        title: '💪 Transformação Corporal',
        description: `${gorduraPerdida.toFixed(1)}% de gordura perdida!`,
        icon: '💪',
        color: 'from-emerald-500 to-green-500',
        type: 'body_fat',
        achieved: true,
        dateAchieved: new Date(lastBio.data_avaliacao)
      });
    }

    if (gorduraPerdida >= 10) {
      achievements.push({
        id: 'body_fat_10',
        title: '🏆 Transformação Completa',
        description: `${gorduraPerdida.toFixed(1)}% de gordura! Resultado incrível!`,
        icon: '🏆',
        color: 'from-yellow-500 to-orange-500',
        type: 'body_fat',
        achieved: true,
        dateAchieved: new Date(lastBio.data_avaliacao)
      });
    }
  }

  // CONQUISTAS DE MARCO
  const daysSinceStart = Math.floor(
    (new Date(lastCheckin.data_checkin).getTime() - 
     new Date(firstCheckin.data_checkin).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  if (daysSinceStart >= 30) {
    achievements.push({
      id: 'milestone_30days',
      title: '🎉 1 Mês de Jornada',
      description: '30 dias de dedicação e superação!',
      icon: '🎉',
      color: 'from-pink-500 to-rose-500',
      type: 'milestone',
      achieved: true
    });
  }

  if (daysSinceStart >= 90) {
    achievements.push({
      id: 'milestone_90days',
      title: '🌟 3 Meses de Evolução',
      description: 'Três meses transformando sua vida!',
      icon: '🌟',
      color: 'from-violet-500 to-purple-500',
      type: 'milestone',
      achieved: true
    });
  }

  if (daysSinceStart >= 180) {
    achievements.push({
      id: 'milestone_180days',
      title: '👑 6 Meses de Conquistas',
      description: 'Meio ano de resultados incríveis!',
      icon: '👑',
      color: 'from-amber-500 to-yellow-500',
      type: 'milestone',
      achieved: true
    });
  }

  // Ordenar por tipo e data (mais recentes primeiro)
  return achievements.sort((a, b) => {
    if (a.dateAchieved && b.dateAchieved) {
      return b.dateAchieved.getTime() - a.dateAchieved.getTime();
    }
    return 0;
  });
}

// Calcular streak de dias consecutivos
function calculateStreak(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0;

  const dates = checkins.map(c => {
    const date = new Date(c.data_checkin);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }).sort((a, b) => b - a); // Mais recente primeiro

  let streak = 1;
  let currentDate = dates[0];

  for (let i = 1; i < dates.length; i++) {
    const dayDiff = Math.floor((currentDate - dates[i]) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      streak++;
      currentDate = dates[i];
    } else if (dayDiff > 1) {
      break;
    }
    // Se dayDiff === 0, é o mesmo dia, continua
  }

  return streak;
}

// Detectar semanas perfeitas (todos os dias com pontuação >= 8)
function detectPerfectWeeks(checkins: Checkin[]): number {
  // Agrupar check-ins por semana
  const weekMap = new Map<string, Checkin[]>();

  checkins.forEach(checkin => {
    const date = new Date(checkin.data_checkin);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(checkin);
  });

  let perfectWeeks = 0;

  weekMap.forEach(weekCheckins => {
    // Verificar se todos os check-ins da semana têm pontuação >= 8
    const allPerfect = weekCheckins.every(c => 
      parseFloat(c.total_pontuacao || '0') >= 8
    );

    // E se tem pelo menos 5 check-ins na semana (considerando que é uma semana completa)
    if (allPerfect && weekCheckins.length >= 5) {
      perfectWeeks++;
    }
  });

  return perfectWeeks;
}

