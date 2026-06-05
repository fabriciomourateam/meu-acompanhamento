import { supabase } from '@/integrations/supabase/client';

export type RankingPeriod = 'weekly' | 'monthly' | 'yearly' | 'all_time';

export interface LeaderboardEntry {
  patient_id: string;
  patient_name: string;
  photo_url?: string | null;
  points: number;
  position: number;
  is_current_patient: boolean;
}

function getStartDate(period: RankingPeriod): string | null {
  const now = new Date();

  if (period === 'all_time') return null;

  if (period === 'weekly') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  }

  if (period === 'monthly') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  if (period === 'yearly') {
    return `${now.getFullYear()}-01-01`;
  }

  return null;
}

/** ISO week pad: YYYY-Www */
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Period_key do período anterior ao atual. weekly → semana passada; monthly → mês passado. */
export function previousPeriodKey(period: 'weekly' | 'monthly' | 'yearly', offset = 1): string {
  const now = new Date();
  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7 * offset);
    return isoWeekKey(d);
  }
  if (period === 'monthly') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - offset);
    return monthKey(d);
  }
  return String(now.getFullYear() - offset);
}

export interface HistoryEntry {
  rank: number;
  patient_id: string;
  patient_name: string;
  photo_url: string | null;
  points: number;
  frozen_at: string;
}

export interface PeriodSummary {
  period: 'weekly' | 'monthly' | 'yearly';
  period_key: string;
  top_count: number;
  top1_name: string | null;
  top1_points: number | null;
}

export const rankingService = {
  async getLeaderboard(
    trainerUserId: string,
    currentPatientId: string,
    period: RankingPeriod
  ): Promise<LeaderboardEntry[]> {
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, nome, apelido, foto_perfil')
      .eq('user_id', trainerUserId);

    if (patientsError || !patients || patients.length === 0) return [];

    const patientMap = new Map(
      patients.map(p => [p.id, p.apelido || p.nome || 'Paciente'])
    );
    const photoMap = new Map(
      patients.map(p => [p.id, (p as any).foto_perfil as string | null])
    );
    const pointsMap = new Map<string, number>();

    if (period === 'all_time') {
      const { data: pointsData, error } = await supabase
        .from('patient_points')
        .select('patient_id, total_points, patients!inner(user_id)')
        .eq('patients.user_id', trainerUserId);

      if (!error && pointsData) {
        for (const row of pointsData) {
          pointsMap.set(row.patient_id, (row as any).total_points || 0);
        }
      }
    } else {
      const startDate = getStartDate(period);

      let query = supabase
        .from('patient_points_history')
        .select('patient_id, points_earned, patients!inner(user_id)')
        .eq('patients.user_id', trainerUserId);

      if (startDate) {
        query = query.gte('action_date', startDate);
      }

      const { data: historyData, error } = await query;

      if (!error && historyData) {
        for (const row of historyData) {
          const current = pointsMap.get(row.patient_id) || 0;
          pointsMap.set(row.patient_id, current + ((row as any).points_earned || 0));
        }
      }
    }

    const entries: Omit<LeaderboardEntry, 'position'>[] = [];

    for (const [patientId, name] of patientMap.entries()) {
      const points = pointsMap.get(patientId) || 0;
      if (points > 0 || patientId === currentPatientId) {
        entries.push({
          patient_id: patientId,
          patient_name: name,
          photo_url: photoMap.get(patientId) || null,
          points,
          is_current_patient: patientId === currentPatientId,
        });
      }
    }

    entries.sort((a, b) => b.points - a.points);

    return entries.map((entry, index) => ({ ...entry, position: index + 1 }));
  },

  /**
   * Hall da Fama: top do período encerrado. Auto-freeze lazy — primeira leitura
   * congela o snapshot, leituras seguintes retornam o mesmo.
   */
  async getHistory(
    trainerUserId: string,
    period: 'weekly' | 'monthly' | 'yearly',
    periodKey: string,
    topN = 10,
  ): Promise<HistoryEntry[]> {
    const { data, error } = await supabase.rpc('get_ranking_history', {
      p_trainer_user_id: trainerUserId,
      p_period: period,
      p_period_key: periodKey,
      p_top_n: topN,
    });
    if (error) {
      console.error('Erro Hall da Fama:', error);
      return [];
    }
    return (data || []) as HistoryEntry[];
  },

  /** Lista todos os períodos passados já congelados (pra timeline do Hall da Fama). */
  async listHistoryPeriods(trainerUserId: string): Promise<PeriodSummary[]> {
    const { data, error } = await supabase.rpc('list_ranking_history_periods', {
      p_trainer_user_id: trainerUserId,
    });
    if (error) {
      console.error('Erro lista de períodos:', error);
      return [];
    }
    return (data || []) as PeriodSummary[];
  },
};
