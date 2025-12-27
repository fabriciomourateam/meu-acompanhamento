import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from './auth-helpers';

export interface ExamType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LaboratoryExam {
  id: string;
  user_id: string | null;
  patient_id: string | null;
  telefone: string;
  exam_type_id: string | null;
  exam_name: string;
  exam_category: string | null;
  requested_at: string;
  requested_by: string | null;
  instructions: string | null;
  notes: string | null;
  status: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  completed_at: string | null;
  result_file_url: string | null;
  result_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaboratoryExamInsert {
  patient_id?: string | null;
  telefone: string;
  exam_type_id?: string | null;
  exam_name: string;
  exam_category?: string | null;
  requested_at?: string;
  requested_by?: string | null;
  instructions?: string | null;
  notes?: string | null;
  status?: 'requested' | 'scheduled' | 'completed' | 'cancelled';
}

export interface LaboratoryExamUpdate {
  exam_type_id?: string | null;
  exam_name?: string;
  exam_category?: string | null;
  instructions?: string | null;
  notes?: string | null;
  status?: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  completed_at?: string | null;
  result_file_url?: string | null;
  result_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export const laboratoryExamsService = {
  /**
   * Buscar todos os tipos de exames
   */
  async getExamTypes(category?: string): Promise<ExamType[]> {
    let query = supabase
      .from('exam_types')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Criar novo exame
   */
  async create(exam: LaboratoryExamInsert): Promise<LaboratoryExam> {
    // Obter user_id atual para multi-tenancy
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const examData = {
      ...exam,
      user_id: userId, // Multi-tenancy: garantir isolamento
      requested_at: exam.requested_at || new Date().toISOString().split('T')[0],
      requested_by: exam.requested_by || user?.id || userId,
      status: exam.status || 'requested',
    };

    const { data, error } = await supabase
      .from('laboratory_exams')
      .insert(examData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualizar exame
   */
  async update(id: string, updates: LaboratoryExamUpdate): Promise<LaboratoryExam> {
    // Se está marcando como completo, definir completed_at
    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString().split('T')[0];
    }

    // Se está adicionando resultado, marcar como revisado
    if (updates.result_file_url && !updates.reviewed_by) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        updates.reviewed_by = user.id;
        updates.reviewed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('laboratory_exams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar exames de um paciente
   */
  async getByPatientId(patientId: string): Promise<LaboratoryExam[]> {
    const { data, error } = await supabase
      .from('laboratory_exams')
      .select('*')
      .eq('patient_id', patientId)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Buscar exames por telefone
   */
  async getByTelefone(telefone: string): Promise<LaboratoryExam[]> {
    const { data, error } = await supabase
      .from('laboratory_exams')
      .select('*')
      .eq('telefone', telefone)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Buscar exame por ID
   */
  async getById(id: string): Promise<LaboratoryExam> {
    const { data, error } = await supabase
      .from('laboratory_exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar exames pendentes (requested ou scheduled)
   */
  async getPending(telefone?: string): Promise<LaboratoryExam[]> {
    let query = supabase
      .from('laboratory_exams')
      .select('*')
      .in('status', ['requested', 'scheduled'])
      .order('requested_at', { ascending: true });

    if (telefone) {
      query = query.eq('telefone', telefone);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Deletar exame
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('laboratory_exams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Upload de arquivo de resultado
   */
  async uploadResultFile(file: File, examId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `exam-result-${examId}-${Date.now()}.${fileExt}`;
    const filePath = `exam-results/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('exam-results')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('exam-results')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};

