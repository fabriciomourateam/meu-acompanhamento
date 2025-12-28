import { supabase } from '@/integrations/supabase/client';

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
  async getAllChallenges(): Promise<DailyChallenge[]> {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('is_active', true)
      .order('points_earned', { ascending: false });
    
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
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já está completo hoje
    const { data: existing } = await supabase
      .from('patient_daily_challenges')
      .select('*')
      .eq('patient_id', patientId)
      .eq('challenge_key', challengeKey)
      .eq('completion_date', today)
      .single();
    
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
    const today = new Date().toISOString().split('T')[0];
    
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
    const targetDate = date || new Date().toISOString().split('T')[0];
    
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
};

