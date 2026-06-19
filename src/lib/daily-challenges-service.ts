import { supabase } from '@/integrations/supabase/client';
import { getSaoPauloISODate, shiftISODate } from '@/lib/utils';

export interface DailyChallenge {
  challenge_key: string;
  challenge_name: string;
  challenge_description: string;
  emoji?: string;
  icon_name?: string;
  points_earned: number;
  is_active: boolean;
}

export interface PatientDailyChallenge {
  id?: string;
  patient_id: string;
  challenge_key: string;
  completion_date: string;
  completed_at?: string;
  notes?: string;
}

export const dailyChallengesService = {
  /**
   * Buscar todos os desafios disponíveis
   */
  async getAllChallenges(userId?: string): Promise<DailyChallenge[]> {
    let query = supabase
      .from('daily_challenges')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('points_earned', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Marcar desafio como completo
   */
  async completeChallenge(
    patientId: string,
    challengeKey: string,
    notes?: string
  ): Promise<PatientDailyChallenge> {
    const today = getSaoPauloISODate();
    
    // Verificar se já está completo hoje
    const { data: existing } = await supabase
      .from('patient_daily_challenges')
      .select('*')
      .eq('patient_id', patientId)
      .eq('challenge_key', challengeKey)
      .eq('completion_date', today)
      .maybeSingle();
    
    if (existing) {
      // Já está completo, retornar existente
      return existing;
    }
    
    // Criar novo registro
    const { data, error } = await supabase
      .from('patient_daily_challenges')
      .insert({
        patient_id: patientId,
        challenge_key: challengeKey,
        completion_date: today,
        notes: notes || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Buscar pontos do desafio e adicionar
    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('points_earned, challenge_name')
      .eq('challenge_key', challengeKey)
      .single();
    
    if (challenge) {
      // Adicionar pontos
      const { dietConsumptionService } = await import('@/lib/diet-consumption-service');
      await dietConsumptionService.addPoints(
        patientId,
        challenge.points_earned,
        'challenge',
        `Desafio: ${challenge.challenge_name}`
      );
    }
    
    return data;
  },

  /**
   * Desmarcar desafio (remover do dia)
   */
  async uncompleteChallenge(
    patientId: string,
    challengeKey: string
  ): Promise<void> {
    const today = getSaoPauloISODate();
    
    const { error } = await supabase
      .from('patient_daily_challenges')
      .delete()
      .eq('patient_id', patientId)
      .eq('challenge_key', challengeKey)
      .eq('completion_date', today);
    
    if (error) throw error;
  },

  /**
   * Buscar desafios completados de um dia
   */
  async getCompletedChallenges(
    patientId: string,
    date?: string
  ): Promise<string[]> {
    const targetDate = date || getSaoPauloISODate();
    
    const { data, error } = await supabase
      .from('patient_daily_challenges')
      .select('challenge_key')
      .eq('patient_id', patientId)
      .eq('completion_date', targetDate);
    
    if (error) throw error;
    return data?.map(c => c.challenge_key) || [];
  },

  /**
   * Buscar desafios completados de um período
   */
  async getChallengesHistory(
    patientId: string,
    startDate: string,
    endDate: string
  ): Promise<PatientDailyChallenge[]> {
    const { data, error } = await supabase
      .from('patient_daily_challenges')
      .select('*')
      .eq('patient_id', patientId)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate)
      .order('completion_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Calcular streak a partir dos desafios diários e sincronizar em patient_points
   */
  async calculateAndSyncStreak(patientId: string): Promise<number> {
    // Buscar todas as datas distintas com ao menos um desafio completado
    const { data, error } = await supabase
      .from('patient_daily_challenges')
      .select('completion_date')
      .eq('patient_id', patientId)
      .order('completion_date', { ascending: false });

    if (error) throw error;

    // Extrair datas únicas
    const uniqueDates = Array.from(
      new Set((data || []).map((r: { completion_date: string }) => r.completion_date))
    ).sort((a, b) => b.localeCompare(a)); // desc

    // Calcular streak consecutiva contando para trás a partir de hoje (ou ontem),
    // sempre no fuso de São Paulo (o "dia" termina à meia-noite de Brasília).
    const todayStr = getSaoPauloISODate();
    const yesterdayStr = shiftISODate(todayStr, -1);

    // Se não tem nem hoje nem ontem, streak é 0
    if (uniqueDates.length === 0 || (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr)) {
      // Sync streak = 0
      await this._upsertStreak(patientId, 0);
      return 0;
    }

    // Contar dias consecutivos
    let streak = 0;
    // Se a data mais recente é ontem (ainda não fez hoje), começa de ontem.
    let cursorStr = (uniqueDates[0] === yesterdayStr && uniqueDates[0] !== todayStr) ? yesterdayStr : todayStr;

    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === cursorStr) {
        streak++;
        cursorStr = shiftISODate(cursorStr, -1);
      } else if (uniqueDates[i] < cursorStr) {
        // Gap: streak quebrou
        break;
      }
      // uniqueDates[i] > cursorStr não ocorre (lista desc e o cursor anda pra trás)
    }

    await this._upsertStreak(patientId, streak);
    return streak;
  },

  /**
   * Helper interno: upsert streak em patient_points
   */
  async _upsertStreak(patientId: string, streak: number): Promise<void> {
    const { data: existing } = await supabase
      .from('patient_points')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('patient_points')
        .update({
          current_streak: streak,
          longest_streak: Math.max(existing.longest_streak || 0, streak),
        })
        .eq('patient_id', patientId);
    } else {
      await supabase
        .from('patient_points')
        .insert({
          patient_id: patientId,
          total_points: 0,
          points_diet: 0,
          points_consistency: 0,
          points_achievements: 0,
          current_level: 1,
          total_days_tracked: 0,
          current_streak: streak,
          longest_streak: streak,
        });
    }
  },

  /**
   * Verificar e desbloquear conquistas de streak
   */
  async checkAndUnlockStreakAchievements(patientId: string, streak: number): Promise<void> {
    // Buscar conquistas já desbloqueadas
    const { data: existingAchievements } = await supabase
      .from('patient_achievements')
      .select('achievement_type')
      .eq('patient_id', patientId);

    const unlockedTypes = new Set((existingAchievements || []).map((a: { achievement_type: string }) => a.achievement_type));

    // Milestones de streak
    const milestones = [
      { days: 3, type: 'streak_3' },
      { days: 7, type: 'streak_7' },
      { days: 30, type: 'streak_30' },
    ];

    // Buscar templates relevantes
    const { data: templates } = await supabase
      .from('achievement_templates')
      .select('*')
      .in('achievement_type', milestones.map(m => m.type));

    if (!templates || templates.length === 0) return;

    const today = getSaoPauloISODate();

    for (const milestone of milestones) {
      if (streak < milestone.days) continue;
      if (unlockedTypes.has(milestone.type)) continue;

      const template = templates.find((t: { achievement_type: string }) => t.achievement_type === milestone.type);
      if (!template) continue;

      // Inserir conquista
      await supabase
        .from('patient_achievements')
        .insert({
          patient_id: patientId,
          achievement_type: template.achievement_type,
          achievement_name: template.achievement_name,
          achievement_description: template.achievement_description,
          points_earned: template.points_earned,
        });

      // Registrar no histórico de pontos
      const { data: pointsRow } = await supabase
        .from('patient_points')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (pointsRow) {
        const newTotal = (pointsRow.total_points || 0) + template.points_earned;
        const newAchPts = (pointsRow.points_achievements || 0) + template.points_earned;
        const { dietConsumptionService } = await import('@/lib/diet-consumption-service');
        const newLevel = dietConsumptionService.calculateLevel(newTotal);

        await supabase
          .from('patient_points')
          .update({
            total_points: newTotal,
            points_achievements: newAchPts,
            current_level: newLevel,
          })
          .eq('patient_id', patientId);

        await supabase
          .from('patient_points_history')
          .insert({
            patient_id: patientId,
            points_id: pointsRow.id,
            points_earned: template.points_earned,
            action_type: 'achievement',
            action_description: `Conquista: ${template.achievement_name}`,
            action_date: today,
          });
      }
    }
  },
};

