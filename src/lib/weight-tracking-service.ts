import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from './auth-helpers';

export interface WeightEntry {
  id: string;
  user_id: string | null;
  telefone: string;
  data_pesagem: string;
  peso_jejum: number | null;
  peso_dia: number | null;
  tipo: 'jejum' | 'dia';
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeightEntryInsert {
  telefone: string;
  data_pesagem?: string;
  peso_jejum?: number | null;
  peso_dia?: number | null;
  tipo: 'jejum' | 'dia';
  observacoes?: string | null;
}

export const weightTrackingService = {
  /**
   * Registrar peso diário
   */
  async create(entry: WeightEntryInsert): Promise<WeightEntry> {
    // Garantir user_id para multi-tenancy
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    // Validar que tipo foi fornecido
    if (!entry.tipo) {
      throw new Error('Campo "tipo" é obrigatório (deve ser "jejum" ou "dia")');
    }

    const { data, error } = await supabase
      .from('weight_tracking')
      .insert({
        ...entry,
        user_id: userId,
        tipo: entry.tipo, // Campo obrigatório
        data_pesagem: entry.data_pesagem || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualizar peso existente
   */
  async update(id: string, updates: Partial<WeightEntryInsert>): Promise<WeightEntry> {
    const { data, error } = await supabase
      .from('weight_tracking')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar pesos de um paciente
   */
  async getByTelefone(telefone: string, limit?: number): Promise<WeightEntry[]> {
    let query = supabase
      .from('weight_tracking')
      .select('*')
      .eq('telefone', telefone)
      .order('data_pesagem', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Buscar último peso em jejum de um mês específico
   */
  async getLastFastingWeightOfMonth(telefone: string, month: number, year: number): Promise<WeightEntry | null> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('weight_tracking')
      .select('*')
      .eq('telefone', telefone)
      .eq('tipo', 'jejum')
      .not('peso_jejum', 'is', null)
      .gte('data_pesagem', startDate)
      .lte('data_pesagem', endDate)
      .order('data_pesagem', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar último peso em jejum (geral)
   */
  async getLastFastingWeight(telefone: string): Promise<WeightEntry | null> {
    const { data, error } = await supabase
      .from('weight_tracking')
      .select('*')
      .eq('telefone', telefone)
      .eq('tipo', 'jejum')
      .not('peso_jejum', 'is', null)
      .order('data_pesagem', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar peso de uma data específica
   */
  async getByDate(telefone: string, date: string): Promise<WeightEntry | null> {
    const { data, error } = await supabase
      .from('weight_tracking')
      .select('*')
      .eq('telefone', telefone)
      .eq('data_pesagem', date)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Deletar registro de peso
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('weight_tracking')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Buscar pesos em um intervalo de datas
   */
  async getByDateRange(telefone: string, startDate: string, endDate: string): Promise<WeightEntry[]> {
    const { data, error } = await supabase
      .from('weight_tracking')
      .select('*')
      .eq('telefone', telefone)
      .gte('data_pesagem', startDate)
      .lte('data_pesagem', endDate)
      .order('data_pesagem', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

