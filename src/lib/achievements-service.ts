import { supabase } from '@/integrations/supabase/client';

export interface AchievementTemplate {
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  points_earned: number | null;
  icon_name: string | null;
  emoji: string | null;
  color: string | null;
  category: string | null;
  rule_type: string | null;
  rule_params: Record<string, number> | null;
  scope: 'all' | 'weekly' | 'monthly';
  is_secret: boolean | null;
  active: boolean | null;
  display_order: number | null;
  trainer_user_id: string | null;
  updated_at?: string;
}

export interface UnlockedAchievement {
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  emoji: string | null;
  icon_name: string | null;
  color: string;
  points_earned: number;
  unlocked_at: string;
  is_new: boolean;
}

export interface AchievementWithStatus {
  template: AchievementTemplate;
  unlocked: boolean;
  unlocked_at: string | null;
  /** Progresso atual (mesma unidade do threshold). null quando não-mensurável no client. */
  progress: number | null;
  /** Threshold pra desbloquear. */
  threshold: number | null;
}

export const achievementsService = {
  /**
   * Roda a engine: avalia todas as regras ativas, desbloqueia novas, retorna
   * lista completa do paciente (desbloqueadas).
   */
  async evaluateByToken(token: string): Promise<UnlockedAchievement[]> {
    const { data, error } = await supabase.rpc('evaluate_achievements_by_token', {
      p_token: token,
    });
    if (error) {
      console.error('Erro ao avaliar conquistas:', error);
      return [];
    }
    return (data as UnlockedAchievement[]) || [];
  },

  /** Lista todo o catálogo público (ativo). Usado pra mostrar conquistas "a desbloquear". */
  async getCatalog(): Promise<AchievementTemplate[]> {
    const { data, error } = await supabase
      .from('achievement_templates')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    if (error) {
      console.error('Erro ao buscar catálogo:', error);
      return [];
    }
    return (data as AchievementTemplate[]) || [];
  },

  /** Conquistas já desbloqueadas pelo paciente (sem avaliar). */
  async getUnlocked(patientId: string): Promise<UnlockedAchievement[]> {
    const { data, error } = await supabase
      .from('patient_achievements')
      .select(`
        achievement_type, achievement_name, achievement_description,
        points_earned, unlocked_at
      `)
      .eq('patient_id', patientId)
      .order('unlocked_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar conquistas:', error);
      return [];
    }
    // Mescla com templates pra trazer emoji/color
    const cat = await this.getCatalog();
    const byType = new Map(cat.map((t) => [t.achievement_type, t]));
    return (data || []).map((a) => {
      const t = byType.get(a.achievement_type);
      return {
        achievement_type: a.achievement_type,
        achievement_name: a.achievement_name,
        achievement_description: a.achievement_description,
        emoji: t?.emoji || null,
        icon_name: t?.icon_name || null,
        color: t?.color || 'from-amber-500 to-yellow-500',
        points_earned: a.points_earned || 0,
        unlocked_at: a.unlocked_at,
        is_new: false,
      };
    });
  },

  // ---------- ADMIN ----------

  async listAllForAdmin(): Promise<AchievementTemplate[]> {
    const { data, error } = await supabase
      .from('achievement_templates')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data as AchievementTemplate[]) || [];
  },

  async upsertTemplate(t: Partial<AchievementTemplate>): Promise<void> {
    const { error } = await supabase
      .from('achievement_templates')
      .upsert(t, { onConflict: 'achievement_type' });
    if (error) throw error;
  },

  async deleteTemplate(achievementType: string): Promise<void> {
    const { error } = await supabase
      .from('achievement_templates')
      .delete()
      .eq('achievement_type', achievementType);
    if (error) throw error;
  },

  async toggleActive(achievementType: string, active: boolean): Promise<void> {
    const { error } = await supabase
      .from('achievement_templates')
      .update({ active })
      .eq('achievement_type', achievementType);
    if (error) throw error;
  },
};

export const RULE_TYPES: { value: string; label: string; param_label?: string }[] = [
  { value: 'workouts_total', label: 'Total de treinos', param_label: 'Nº de treinos' },
  { value: 'cardios_total', label: 'Total de cardios', param_label: 'Nº de cardios' },
  { value: 'checkins_total', label: 'Total de check-ins', param_label: 'Nº de check-ins' },
  { value: 'streak_days', label: 'Sequência (dias seguidos)', param_label: 'Dias' },
  { value: 'weight_loss_kg', label: 'Peso perdido (kg)', param_label: 'kg perdidos' },
  { value: 'body_fat_loss_pct', label: 'Gordura perdida (%)', param_label: '% gordura' },
  { value: 'community_post_count', label: 'Posts na comunidade', param_label: 'Nº de posts' },
  { value: 'pr_count', label: 'Recordes pessoais (PRs)', param_label: 'Nº de PRs' },
  { value: 'time_in_app_days', label: 'Dias com o app', param_label: 'Dias' },
];

export const CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: 'treino', label: 'Treino', emoji: '🏋️' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃' },
  { value: 'dieta', label: 'Dieta', emoji: '🥗' },
  { value: 'consistencia', label: 'Consistência', emoji: '⭐' },
  { value: 'comunidade', label: 'Comunidade', emoji: '💬' },
  { value: 'evolucao', label: 'Evolução', emoji: '📊' },
  { value: 'milestone', label: 'Marcos', emoji: '🎉' },
];

export const COLOR_PRESETS: { value: string; label: string }[] = [
  { value: 'from-blue-500 to-cyan-500', label: 'Azul → Ciano' },
  { value: 'from-emerald-500 to-teal-500', label: 'Verde → Teal' },
  { value: 'from-orange-500 to-red-500', label: 'Laranja → Vermelho' },
  { value: 'from-purple-500 to-pink-500', label: 'Roxo → Rosa' },
  { value: 'from-yellow-500 to-amber-500', label: 'Amarelo → Âmbar' },
  { value: 'from-indigo-500 to-purple-500', label: 'Índigo → Roxo' },
  { value: 'from-red-500 to-pink-500', label: 'Vermelho → Rosa' },
  { value: 'from-teal-500 to-cyan-500', label: 'Teal → Ciano' },
  { value: 'from-rose-500 to-red-500', label: 'Rosa → Vermelho' },
  { value: 'from-amber-500 to-yellow-500', label: 'Âmbar → Amarelo' },
];
