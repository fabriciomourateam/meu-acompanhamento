import { supabase } from '@/integrations/supabase/client';

export type RankingPeriod = 'weekly' | 'monthly' | 'yearly' | 'all_time';

export interface RankingConfig {
  periods: RankingPeriod[];
  show_leaderboard: boolean;
  show_adherence: boolean;
  show_gamification: boolean;
}

export interface ChallengesConfig {
  show_tab: boolean;
}

export interface PortalConfig {
  ranking: RankingConfig;
  challenges: ChallengesConfig;
}

const DEFAULT_CONFIG: PortalConfig = {
  ranking: {
    periods: ['monthly', 'all_time'],
    show_leaderboard: true,
    show_adherence: true,
    show_gamification: true,
  },
  challenges: {
    show_tab: true,
  },
};

export const portalSettingsService = {
  async getConfig(userId: string): Promise<PortalConfig> {
    if (!userId) return DEFAULT_CONFIG;

    const { data, error } = await supabase
      .from('portal_settings')
      .select('setting_value')
      .eq('user_id', userId)
      .eq('setting_key', 'portal_config')
      .maybeSingle();

    if (error || !data) return DEFAULT_CONFIG;

    const saved = data.setting_value as Partial<PortalConfig>;
    return {
      ranking: { ...DEFAULT_CONFIG.ranking, ...(saved?.ranking || {}) },
      challenges: { ...DEFAULT_CONFIG.challenges, ...(saved?.challenges || {}) },
    };
  },

  async saveConfig(userId: string, config: PortalConfig): Promise<void> {
    const { error } = await supabase
      .from('portal_settings')
      .upsert(
        {
          user_id: userId,
          setting_key: 'portal_config',
          setting_value: config as any,
        },
        { onConflict: 'user_id,setting_key' }
      );

    if (error) throw error;
  },
};
