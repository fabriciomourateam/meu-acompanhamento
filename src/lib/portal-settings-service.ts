import { supabase } from '@/integrations/supabase/client';

export type RankingPeriod = 'weekly' | 'monthly' | 'yearly' | 'all_time';

export interface PortalConfig {
  ranking: {
    show_leaderboard: boolean;
    show_gamification: boolean;
    show_adherence: boolean;
    periods: RankingPeriod[];
  };
  challenges: {
    show_tab: boolean;
  };
}

const DEFAULT_CONFIG: PortalConfig = {
  ranking: {
    show_leaderboard: true,
    show_gamification: true,
    show_adherence: true,
    periods: ['monthly', 'all_time'],
  },
  challenges: {
    show_tab: true,
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
          show_adherence: value?.ranking?.show_adherence ?? true,
          periods: value?.ranking?.periods ?? ['monthly', 'all_time'],
        },
        challenges: {
          show_tab: value?.challenges?.show_tab ?? true,
        },
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  },
};
