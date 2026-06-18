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
  // Fatia 2 (mídia): anexo opcional guardado no bucket público `patient-photos`.
  media_url?: string | null;
  media_type?: 'image' | 'audio' | 'video' | null;
  // Editar/apagar: mensagem apagada vem com body='' e mídia nula (a UI mostra
  // um aviso "mensagem apagada"); editada mostra "(editado)".
  deleted?: boolean;
  edited?: boolean;
  // Read receipt (✓✓): quando a equipe leu esta mensagem do aluno. null = só enviada.
  read_at?: string | null;
  // Responder/citar: id da mensagem citada (resolvida localmente na lista).
  reply_to_message_id?: string | null;
  // Reações: no máx uma por lado (patient/team).
  reactions?: { reactor: 'patient' | 'team'; emoji: string }[] | null;
}

export type ChatMediaType = 'image' | 'audio' | 'video';

export interface ChatMediaInput {
  url: string;
  type: ChatMediaType;
  mime: string | null;
}

/** Limite de upload de mídia do chat (vídeo é o caso pesado). */
const CHAT_MEDIA_MAX_BYTES = 25 * 1024 * 1024;

function mediaTypeFromFile(file: File): ChatMediaType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'image';
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

  /**
   * Sobe um anexo de mídia (foto/áudio/vídeo) pro bucket público `patient-photos`
   * (pasta `chat/`) — mesmo padrão de avatar/evolução/comunidade — e devolve a URL
   * pública + tipo + mime pra anexar na mensagem.
   */
  async uploadMedia(patientId: string, file: File): Promise<ChatMediaInput> {
    if (file.size > CHAT_MEDIA_MAX_BYTES) {
      throw new Error('Arquivo muito grande (máximo 25 MB).');
    }
    const type = mediaTypeFromFile(file);
    const fallbackExt = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'webm';
    const ext = (file.name.split('.').pop() || fallbackExt).toLowerCase();
    const path = `chat/${patientId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('patient-photos')
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (error) throw error;
    const { data } = supabase.storage.from('patient-photos').getPublicUrl(path);
    return { url: data.publicUrl, type, mime: file.type || null };
  },

  /** Paciente envia mensagem (texto e/ou mídia); reabre a conversa se estava resolvida. */
  async sendMessage(
    patientId: string,
    body: string,
    media?: ChatMediaInput | null,
    replyTo?: string | null,
  ): Promise<string> {
    const { data, error } = await supabase.rpc('chat_patient_send_message', {
      p_patient_id: patientId,
      p_body: body,
      p_media_url: media?.url ?? null,
      p_media_type: media?.type ?? null,
      p_media_mime: media?.mime ?? null,
      p_reply_to: replyTo ?? null,
    });
    if (error) throw error;
    return data as string;
  },

  /** Edita uma mensagem do próprio aluno (mantém o texto original no banco). */
  async editMessage(patientId: string, messageId: string, body: string): Promise<void> {
    const { error } = await supabase.rpc('chat_patient_edit_message', {
      p_patient_id: patientId,
      p_message_id: messageId,
      p_body: body,
    });
    if (error) throw error;
  },

  /** Apaga (soft-delete) uma mensagem do próprio aluno; o conteúdo fica salvo no banco. */
  async deleteMessage(patientId: string, messageId: string): Promise<void> {
    const { error } = await supabase.rpc('chat_patient_delete_message', {
      p_patient_id: patientId,
      p_message_id: messageId,
    });
    if (error) throw error;
  },

  /** Reage (ou remove a reação) numa mensagem. Mesma emoji = toggle. */
  async react(patientId: string, messageId: string, emoji: string): Promise<void> {
    const { error } = await supabase.rpc('chat_patient_react', {
      p_patient_id: patientId,
      p_message_id: messageId,
      p_emoji: emoji,
    });
    if (error) throw error;
  },

  /** Contador de não-lidas para o selo da aba. */
  async getUnreadCount(patientId: string): Promise<number> {
    const { data, error } = await supabase.rpc('chat_patient_unread_count', {
      p_patient_id: patientId,
    });
    if (error) throw error;
    return (data as number) || 0;
  },

  /**
   * Realtime Broadcast: entrega quase instantânea de mensagens novas/editadas
   * sem depender do polling. O aluno é anon e não pode ouvir postgres_changes da
   * tabela protegida por RLS; por isso o servidor emite um "ping" SEM conteúdo no
   * tópico da conversa (trigger trg_chat_broadcast -> realtime.send). O conteúdo
   * continua vindo da RPC chat_patient_get_messages (escopada por p_patient_id).
   * Retorna o cleanup. O polling segue como fallback (intervalo longo) caso o
   * socket caia.
   */
  subscribeToConversation(conversationId: string, onChange: () => void): () => void {
    const channel = supabase
      .channel(`chat:conv:${conversationId}`, { config: { private: false } })
      .on('broadcast', { event: 'chat_changed' }, () => onChange())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Indicador "digitando…" via Realtime Broadcast (efêmero, sem banco). Canal
   * dedicado por conversa. `notify()` avisa o outro lado que estou digitando
   * (throttle interno); `onTyping` é chamado quando o outro lado digita.
   * O aluno emite sempre como 'patient' e só reage a 'team'.
   */
  subscribeTyping(
    conversationId: string,
    onTyping: (sender: 'patient' | 'team') => void,
  ): { notify: () => void; cleanup: () => void } {
    const channel = supabase
      .channel(`chat:typing:${conversationId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, (msg) => {
        const sender = (msg.payload as { sender?: 'patient' | 'team' })?.sender;
        if (sender) onTyping(sender);
      })
      .subscribe();
    let last = 0;
    const notify = () => {
      const now = Date.now();
      if (now - last < 1800) return; // throttle: no máx ~1 ping/1.8s
      last = now;
      channel.send({ type: 'broadcast', event: 'typing', payload: { sender: 'patient' } });
    };
    return { notify, cleanup: () => supabase.removeChannel(channel) };
  },
};
