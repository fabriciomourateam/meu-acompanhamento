import { supabase } from '@/integrations/supabase/client';

export interface PatientLevel {
  id?: string;
  level_order: number;
  name: string;
  emoji: string | null;
  color: string;
  min_points: number;
  description: string | null;
  active: boolean;
}

export interface CurrentLevel {
  current_level_order: number | null;
  current_name: string | null;
  current_emoji: string | null;
  current_color: string | null;
  current_min_points: number | null;
  next_level_order: number | null;
  next_name: string | null;
  next_min_points: number | null;
  total_points: number;
  progress_pct: number;
}

export const levelsService = {
  async getByToken(token: string): Promise<CurrentLevel | null> {
    const { data, error } = await supabase.rpc('get_patient_level_by_token', {
      p_token: token,
    });
    if (error) {
      console.error('Erro ao buscar nível:', error);
      return null;
    }
    if (!data || data.length === 0) return null;
    const row = data[0];
    return {
      ...row,
      progress_pct: parseFloat(row.progress_pct as unknown as string) || 0,
    } as CurrentLevel;
  },

  async listAll(): Promise<PatientLevel[]> {
    const { data, error } = await supabase
      .from('patient_levels')
      .select('*')
      .order('level_order', { ascending: true });
    if (error) throw error;
    return (data || []) as PatientLevel[];
  },

  async upsert(level: Partial<PatientLevel>): Promise<void> {
    const { error } = await supabase
      .from('patient_levels')
      .upsert(level, { onConflict: 'level_order' });
    if (error) throw error;
  },

  async remove(levelOrder: number): Promise<void> {
    const { error } = await supabase
      .from('patient_levels')
      .delete()
      .eq('level_order', levelOrder);
    if (error) throw error;
  },
};
