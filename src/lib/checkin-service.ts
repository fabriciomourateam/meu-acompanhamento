import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type CheckinInsert = Database['public']['Tables']['checkin']['Insert'];
type CheckinUpdate = Database['public']['Tables']['checkin']['Update'];

export interface CheckinWithPatient extends Checkin {
  patient?: {
    id: string;
    nome: string;
    telefone: string;
  };
}

export const checkinService = {
  // Buscar todos os checkins
  async getAll(): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .order('data_checkin', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins com dados do paciente (usando telefone)
  async getAllWithPatient(): Promise<CheckinWithPatient[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select(`
        *,
        patient:patients!inner(
          id,
          nome,
          apelido,
          telefone,
          plano
        )
      `)
      .order('data_checkin', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins por telefone do paciente
  async getByPhone(telefone: string): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('telefone', telefone)
      .order('data_checkin', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkin específico por telefone e mês/ano
  async getByPhoneAndMonth(telefone: string, mesAno: string): Promise<Checkin | null> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('telefone', telefone)
      .eq('mes_ano', mesAno)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Criar novo checkin
  async create(checkin: CheckinInsert): Promise<Checkin> {
    // Obter user_id do usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado. Faça login para criar checkins.');
    }

    const checkinData = {
      ...checkin,
      user_id: user.id, // Garantir que user_id seja definido (trigger também faz isso, mas é bom garantir)
      data_preenchimento: checkin.data_preenchimento || new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('checkin')
      .insert(checkinData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar checkin existente
  async update(id: string, updates: CheckinUpdate): Promise<Checkin> {
    const { data, error } = await supabase
      .from('checkin')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Upsert checkin (criar ou atualizar)
  async upsert(checkin: CheckinInsert): Promise<Checkin> {
    const checkinData = {
      ...checkin,
      data_preenchimento: checkin.data_preenchimento || new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('checkin')
      .upsert(checkinData, { 
        onConflict: 'telefone,mes_ano',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Deletar checkin
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('checkin')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Buscar checkins por período
  async getByPeriod(startDate: string, endDate: string): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .gte('data_checkin', startDate)
      .lte('data_checkin', endDate)
      .order('data_checkin', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins do mês atual
  async getCurrentMonth(): Promise<Checkin[]> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const mesAno = `${year}-${month}`;
    
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('mes_ano', mesAno)
      .order('data_checkin', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar estatísticas de checkins
  async getStats(): Promise<{
    totalCheckins: number;
    checkinsThisMonth: number;
    patientsWithCheckin: number;
    averageScore: number;
  }> {
    // Total de checkins
    const { count: totalCheckins } = await supabase
      .from('checkin')
      .select('*', { count: 'exact', head: true });

    // Checkins deste mês
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { count: checkinsThisMonth } = await supabase
      .from('checkin')
      .select('*', { count: 'exact', head: true })
      .eq('mes_ano', currentMonth);

    // Pacientes únicos com checkin
    const { data: uniquePatients } = await supabase
      .from('checkin')
      .select('telefone')
      .not('telefone', 'is', null);
    
    const patientsWithCheckin = new Set(uniquePatients?.map(p => p.telefone)).size;

    // Score médio
    const { data: scores } = await supabase
      .from('checkin')
      .select('total_pontuacao')
      .not('total_pontuacao', 'is', null);
    
    const averageScore = scores?.length 
      ? scores.reduce((acc, curr) => acc + (curr.total_pontuacao || 0), 0) / scores.length
      : 0;

    return {
      totalCheckins: totalCheckins || 0,
      checkinsThisMonth: checkinsThisMonth || 0,
      patientsWithCheckin,
      averageScore: Math.round(averageScore * 100) / 100
    };
  },

  // Buscar evolução de um paciente específico
  async getPatientEvolution(telefone: string, months: number = 12): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('telefone', telefone)
      .order('data_checkin', { ascending: true })
      .limit(months);
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins por data de preenchimento
  async getByFillDate(startDate: string, endDate: string): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .gte('data_preenchimento', startDate)
      .lte('data_preenchimento', endDate)
      .order('data_preenchimento', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins preenchidos hoje
  async getFilledToday(): Promise<Checkin[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .gte('data_preenchimento', `${today}T00:00:00`)
      .lte('data_preenchimento', `${today}T23:59:59`)
      .order('data_preenchimento', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins preenchidos na última semana
  async getFilledLastWeek(): Promise<Checkin[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .gte('data_preenchimento', oneWeekAgo.toISOString())
      .order('data_preenchimento', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};
