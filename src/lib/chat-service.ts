// chat-service.ts — Suporte (chat interno) — lado PACIENTE / app do aluno.
//
// Fatia 1: chat 1:1 do aluno com a equipe ("Fale com o Fabricio").
// O paciente NÃO é usuário do Supabase Auth, então tudo passa por funções
// SECURITY DEFINER (mesmo padrão de community-service.ts), recebendo p_patient_id.
// Atualização no app do aluno é por polling enquanto a tela está aberta
// (a conexão anon não pode ouvir Realtime das tabelas protegidas por RLS).

import { supabase } from '@/integrations/supabase/client';

export interface SupportMessage {
  id: string;
  sender_type: 'patient' | 'team';
  body: string;
  created_at: string;
  is_mine: boolean;
}

export const chatService = {
  /** Garante a conversa do paciente e retorna o id. */
  async getOrCreateConversation(patientId: string): Promise<string> {
    const { data, error } = await supabase.rpc('chat_patient_get_or_create_conversation', {
      p_patient_id: patientId,
    });
    if (error) throw error;
    return data as string;
  },

  /** Mensagens da conversa do paciente (ordem cronológica). Marca como lidas. */
  async getMessages(patientId: string, limit = 100): Promise<SupportMessage[]> {
    const { data, error } = await supabase.rpc('chat_patient_get_messages', {
      p_patient_id: patientId,
      p_limit: limit,
      p_before: null,
    });
    if (error) throw error;
    return (data || []) as SupportMessage[];
  },

  /** Paciente envia mensagem; reabre a conversa se estava resolvida. */
  async sendMessage(patientId: string, body: string): Promise<string> {
    const { data, error } = await supabase.rpc('chat_patient_send_message', {
      p_patient_id: patientId,
      p_body: body,
    });
    if (error) throw error;
    return data as string;
  },

  /** Contador de não-lidas para o selo da aba. */
  async getUnreadCount(patientId: string): Promise<number> {
    const { data, error } = await supabase.rpc('chat_patient_unread_count', {
      p_patient_id: patientId,
    });
    if (error) throw error;
    return (data as number) || 0;
  },
};
