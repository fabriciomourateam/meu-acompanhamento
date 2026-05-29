import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Comunidade — wrappers tipados dos RPCs SECURITY DEFINER.
// O servidor deriva o trainer_user_id a partir do paciente (isolamento por
// treinador), entao o cliente nunca escolhe em qual feed grava/le.
// ---------------------------------------------------------------------------

export type ReactionType = 'curtir' | 'amei' | 'forca' | 'fogo' | 'parabens' | 'apoio';
export type CommunityCategory = 'geral' | 'treino' | 'dieta' | 'conquista' | 'duvida';
export type FeedSort = 'recent' | 'popular';

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'curtir',   emoji: '👍', label: 'Curtir' },
  { type: 'amei',     emoji: '❤️', label: 'Amei' },
  { type: 'forca',    emoji: '💪', label: 'Força' },
  { type: 'fogo',     emoji: '🔥', label: 'Foguinho' },
  { type: 'parabens', emoji: '🎉', label: 'Parabéns' },
  { type: 'apoio',    emoji: '🙌', label: 'Apoio' },
];

export const CATEGORIES: { value: CommunityCategory; label: string; emoji: string }[] = [
  { value: 'geral',     label: 'Geral',     emoji: '💬' },
  { value: 'treino',    label: 'Treino',    emoji: '🏋️' },
  { value: 'dieta',     label: 'Dieta',     emoji: '🥗' },
  { value: 'conquista', label: 'Conquista', emoji: '🏆' },
  { value: 'duvida',    label: 'Dúvida',    emoji: '❓' },
];

export interface CommunityPost {
  id: string;
  author_patient_id: string;
  author_name: string;
  author_photo: string | null;
  content: string;
  image_url: string | null;
  category: CommunityCategory;
  created_at: string;
  reactions: Partial<Record<ReactionType, number>>;
  my_reactions: ReactionType[];
  comment_count: number;
  is_own: boolean;
}

export interface CommunityComment {
  id: string;
  author_patient_id: string;
  author_name: string;
  author_photo: string | null;
  content: string;
  created_at: string;
  is_own: boolean;
}

function reactionsObject(raw: unknown): Partial<Record<ReactionType, number>> {
  if (raw && typeof raw === 'object') return raw as Partial<Record<ReactionType, number>>;
  return {};
}

export const communityService = {
  async getFeed(
    patientId: string,
    category: CommunityCategory | 'all',
    sort: FeedSort,
    limit = 20,
    offset = 0,
  ): Promise<CommunityPost[]> {
    const { data, error } = await supabase.rpc('community_get_feed', {
      p_patient_id: patientId,
      p_category: category,
      p_sort: sort,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) {
      console.error('Erro ao carregar feed da comunidade:', error);
      throw error;
    }
    return (data || []).map((row: any) => ({
      ...row,
      reactions: reactionsObject(row.reactions),
      my_reactions: (row.my_reactions || []) as ReactionType[],
    })) as CommunityPost[];
  },

  async createPost(
    patientId: string,
    content: string,
    imageUrl: string | null,
    category: CommunityCategory,
  ): Promise<string> {
    const { data, error } = await supabase.rpc('community_create_post', {
      p_patient_id: patientId,
      p_content: content,
      p_image_url: imageUrl,
      p_category: category,
    });
    if (error) throw error;
    return data as string;
  },

  async deletePost(patientId: string, postId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('community_delete_post', {
      p_patient_id: patientId,
      p_post_id: postId,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async getComments(patientId: string, postId: string): Promise<CommunityComment[]> {
    const { data, error } = await supabase.rpc('community_get_comments', {
      p_patient_id: patientId,
      p_post_id: postId,
    });
    if (error) throw error;
    return (data || []) as CommunityComment[];
  },

  async addComment(patientId: string, postId: string, content: string): Promise<string> {
    const { data, error } = await supabase.rpc('community_add_comment', {
      p_patient_id: patientId,
      p_post_id: postId,
      p_content: content,
    });
    if (error) throw error;
    return data as string;
  },

  async deleteComment(patientId: string, commentId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('community_delete_comment', {
      p_patient_id: patientId,
      p_comment_id: commentId,
    });
    if (error) throw error;
    return Boolean(data);
  },

  /** Alterna a reação. Retorna true se adicionou, false se removeu. */
  async toggleReaction(
    patientId: string,
    postId: string,
    reaction: ReactionType,
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('community_toggle_reaction', {
      p_patient_id: patientId,
      p_post_id: postId,
      p_reaction_type: reaction,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async report(
    patientId: string,
    targetType: 'post' | 'comment',
    targetId: string,
    reason: string | null,
  ): Promise<void> {
    const { error } = await supabase.rpc('community_report', {
      p_patient_id: patientId,
      p_target_type: targetType,
      p_target_id: targetId,
      p_reason: reason,
    });
    if (error) throw error;
  },

  /** Upload de imagem do post para o bucket publico patient-photos. */
  async uploadPostImage(patientId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `community/${patientId}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('patient-photos')
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage
      .from('patient-photos')
      .getPublicUrl(filePath);
    return publicUrl;
  },
};
