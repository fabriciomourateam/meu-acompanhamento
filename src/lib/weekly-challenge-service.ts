import { supabase } from '@/integrations/supabase/client';
import { getBrtISODate } from '@/lib/utils';

export interface WeeklyChallenge {
  id?: string;
  trainer_user_id?: string;
  week_key: string;
  title: string;
  description: string | null;
  emoji: string | null;
  color: string;
  points: number;
  rule_type: string;
  rule_params: Record<string, number>;
  active: boolean;
}

export interface ActiveChallengeStatus {
  id: string;
  week_key: string;
  title: string;
  description: string | null;
  emoji: string | null;
  color: string;
  points: number;
  rule_type: string;
  threshold: number;
  progress: number;
  completed: boolean;
  completed_at: string | null;
}

/** ISO week key (YYYY-Www) no fuso de São Paulo (BRT) — precisa casar com a
 *  chave que a RPC get_weekly_challenge_by_token calcula no banco (também BRT),
 *  senão na virada de domingo→segunda o admin gravaria a semana errada. */
export function currentWeekKey(d: Date = new Date()): string {
  // Componentes Y-M-D do dia em São Paulo (não do fuso do navegador).
  const [y, m, day0] = getBrtISODate(d).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, day0));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export const weeklyChallengeService = {
  /** Pega desafio da semana atual pro paciente do token, auto-conclui se bateu regra. */
  async getCurrentByToken(token: string): Promise<ActiveChallengeStatus | null> {
    const { data, error } = await supabase.rpc('get_weekly_challenge_by_token', { p_token: token });
    if (error) {
      console.error('Erro ao ler desafio da semana:', error);
      return null;
    }
    if (!data || data.length === 0) return null;
    const row = data[0];
    return {
      ...row,
      threshold: Number(row.threshold) || 0,
      progress: Number(row.progress) || 0,
    } as ActiveChallengeStatus;
  },

  // -------- ADMIN --------
  async listForTrainer(trainerUserId: string): Promise<WeeklyChallenge[]> {
    const { data, error } = await supabase
      .from('weekly_challenges')
      .select('*')
      .eq('trainer_user_id', trainerUserId)
      .order('week_key', { ascending: false });
    if (error) throw error;
    return (data || []) as WeeklyChallenge[];
  },

  async upsert(c: Partial<WeeklyChallenge>): Promise<void> {
    const { error } = await supabase
      .from('weekly_challenges')
      .upsert(c, { onConflict: 'trainer_user_id,week_key' });
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('weekly_challenges')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
