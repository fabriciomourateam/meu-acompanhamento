import { supabase } from '@/integrations/supabase/client';
import type { RankingPeriod } from '@/lib/portal-settings-service';

export type { RankingPeriod };

export interface LeaderboardEntry {
  patient_id: string;
  patient_name: string;
  points: number;
  position: number;
  is_current_patient: boolean;
}

function getStartDate(period: RankingPeriod): string | null {
  const now = new Date();

  if (period === 'all_time') return null;

  if (period === 'weekly') {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
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

export const rankingService = {
  async getLeaderboard(
    trainerUserId: string,
    currentPatientId: string,
    period: RankingPeriod
  ): Promise<LeaderboardEntry[]> {
    // Fetch patients for name lookup
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, nome, apelido')
      .eq('user_id', trainerUserId);

    if (patientsError || !patients || patients.length === 0) return [];

    const patientMap = new Map(patients.map((p) => [p.id, p.apelido || p.nome || 'Paciente']));
    const pointsMap = new Map<string, number>();

    if (period === 'all_time') {
      // Join patient_points with patients server-side — avoids large in() URL
      const { data: pointsData, error } = await supabase
        .from('patient_points')
        .select('patient_id, total_points, patients!inner(user_id)')
        .eq('patients.user_id', trainerUserId);

      if (!error && pointsData) {
        for (const row of pointsData) {
          pointsMap.set(row.patient_id, row.total_points || 0);
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
          pointsMap.set(row.patient_id, current + (row.points_earned || 0));
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
          points,
          is_current_patient: patientId === currentPatientId,
        });
      }
    }

    entries.sort((a, b) => b.points - a.points);

    return entries.map((entry, index) => ({ ...entry, position: index + 1 }));
  },
};
