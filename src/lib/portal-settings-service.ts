import { supabase } from '@/integrations/supabase/client';

export type RankingPeriod = 'weekly' | 'monthly' | 'yearly' | 'all_time';

export interface PortalConfig {
  ranking: {
    show_leaderboard: boolean;
    show_gamification: boolean;
    show_weekly_progress: boolean;
    show_adherence: boolean;
    periods: RankingPeriod[];
  };
  challenges: {
    show_tab: boolean;
  };
  community: {
    show_tab: boolean;
    /** Aviso/tema fixado exibido no topo do feed da comunidade. */
    announcement?: string;
    announcement_emoji?: string;
    announcement_enabled?: boolean;
  };
  // Visibilidade de abas/subabas do portal do aluno (default: tudo visível).
  // Obs.: aba Metas usa `challenges.show_tab` e aba Comunidade usa
  // `community.show_tab` — aqui ficam as demais abas e as subabas da Dieta.
  visibility: {
    tab_diet: boolean;
    tab_ranking: boolean;
    tab_results: boolean; // Evolução
    diet_meals: boolean; // subaba Plano Alimentar
    diet_supplements: boolean; // subaba Suplementos
    diet_substitutions: boolean; // subaba Substituições
  };
  branding: {
    /** @handle do Instagram do treinador (sem o @). Usado nos compartilhamentos. */
    instagram: string;
    /** Frase exibida nos cards compartilhados (acima do @). Aceita quebras de linha. */
    share_caption: string;
  };
}

const DEFAULT_CONFIG: PortalConfig = {
  ranking: {
    show_leaderboard: true,
    show_gamification: true,
    show_weekly_progress: false,
    show_adherence: false,
    periods: ['monthly', 'all_time'],
  },
  challenges: {
    show_tab: true,
  },
  community: {
    show_tab: true,
    announcement: '',
    announcement_emoji: '📌',
    announcement_enabled: false,
  },
  visibility: {
    tab_diet: true,
    tab_ranking: true,
    tab_results: true,
    diet_meals: true,
    diet_supplements: true,
    diet_substitutions: true,
  },
  branding: {
    instagram: '',
    share_caption: '',
  },
};

export const portalSettingsService = {
  async getConfig(trainerUserId: string): Promise<PortalConfig> {
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .select('setting_key, setting_value')
        .eq('user_id', trainerUserId)
        .eq('setting_key', 'portal_config')
        .maybeSingle();

      if (error || !data) return DEFAULT_CONFIG;

      const value = (data.setting_value as any) || {};
      return {
        ranking: {
          show_leaderboard: value?.ranking?.show_leaderboard ?? true,
          show_gamification: value?.ranking?.show_gamification ?? true,
          show_weekly_progress: value?.ranking?.show_weekly_progress ?? false,
          show_adherence: value?.ranking?.show_adherence ?? false,
          periods: value?.ranking?.periods ?? ['monthly', 'all_time'],
        },
        challenges: {
          show_tab: value?.challenges?.show_tab ?? true,
        },
        community: {
          show_tab: value?.community?.show_tab ?? true,
          announcement: value?.community?.announcement ?? '',
          announcement_emoji: value?.community?.announcement_emoji ?? '📌',
          announcement_enabled: value?.community?.announcement_enabled ?? false,
        },
        visibility: {
          tab_diet: value?.visibility?.tab_diet ?? true,
          tab_ranking: value?.visibility?.tab_ranking ?? true,
          tab_results: value?.visibility?.tab_results ?? true,
          diet_meals: value?.visibility?.diet_meals ?? true,
          diet_supplements: value?.visibility?.diet_supplements ?? true,
          diet_substitutions: value?.visibility?.diet_substitutions ?? true,
        },
        branding: {
          instagram: value?.branding?.instagram ?? '',
          share_caption: value?.branding?.share_caption ?? '',
        },
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  async saveConfig(trainerUserId: string, config: PortalConfig): Promise<void> {
    const { error } = await supabase
      .from('portal_settings')
      .upsert(
        {
          user_id: trainerUserId,
          setting_key: 'portal_config',
          setting_value: config as unknown as Record<string, unknown>,
        },
        { onConflict: 'user_id,setting_key' },
      );
    if (error) throw error;
  },
};
