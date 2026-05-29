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
  };
  branding: {
    /** @handle do Instagram do treinador (sem o @). Usado nos compartilhamentos. */
    instagram: string;
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
  },
  branding: {
    instagram: '',
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
        },
        branding: {
          instagram: value?.branding?.instagram ?? '',
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
