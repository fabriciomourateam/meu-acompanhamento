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
    /** Rotação automática de temas semanais. Quando ligada, o tema da semana
     *  vem de `theme_schedule` (em vez do announcement manual). */
    theme_rotation_enabled?: boolean;
    /** Data (ISO yyyy-mm-dd) da segunda-feira em que a semana 1 começa. */
    theme_start_date?: string;
    /** Lista ordenada de temas; um por semana, rotaciona ao chegar no fim. */
    theme_schedule?: { emoji: string; text: string }[];
  };
  // Visibilidade de abas/subabas do portal do aluno (default: tudo visível).
  // Obs.: aba Metas usa `challenges.show_tab` e aba Comunidade usa
  // `community.show_tab` — aqui ficam as demais abas e as subabas da Dieta.
  visibility: {
    tab_diet: boolean;
    tab_workout: boolean; // Aba Treino (logging de séries Heavy-style)
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
  // Aba "Suporte" (chat interno com o treinador). Por padrão DESLIGADA — é um
  // recurso em rollout gradual. Pode ser liberada só para contas de teste
  // (`test_patient_ids`) e, quando madura, para todos os alunos (`show_tab`).
  support: {
    /** Libera a aba de Suporte para TODOS os alunos do treinador. */
    show_tab: boolean;
    /** Libera a aba apenas para estes pacientes (ids) — modo teste/rollout. */
    test_patient_ids?: string[];
    /** Libera a aba para alunos cujo `plano` está nesta lista (rollout por coorte). */
    enabled_plans?: string[];
    /** Libera a aba para uma fração da base (0–100) via hash determinístico do
     *  patientId — a mesma coorte em todo refresh. */
    rollout_percentage?: number;
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
    theme_rotation_enabled: false,
    theme_start_date: '',
    theme_schedule: [],
  },
  visibility: {
    tab_diet: true,
    tab_workout: true,
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
  support: {
    show_tab: false,
    test_patient_ids: [],
    enabled_plans: [],
    rollout_percentage: 0,
  },
};

/** Hash determinístico de uma string → inteiro 0–99 (djb2). Estável entre
 *  refreshes e sessões, então a mesma coorte de % rollout sempre cai do mesmo lado. */
function hashTo100(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  }
  return h % 100;
}

/**
 * Decide se a aba "Suporte" (chat) deve aparecer para um aluno, conforme o
 * rollout gradual configurado pelo treinador. Verdadeiro se QUALQUER condição bater:
 * - `show_tab` ligado (todos os alunos);
 * - id do aluno está em `test_patient_ids` (lista de teste);
 * - `plano` do aluno está em `enabled_plans` (coorte por plano);
 * - o aluno cai na fatia `rollout_percentage` (hash determinístico do id).
 */
export function shouldShowSupport(
  patientId: string | undefined | null,
  patient: { plano?: string | null } | undefined | null,
  config: PortalConfig | null | undefined,
): boolean {
  const support = config?.support;
  if (!support) return false;
  if (support.show_tab === true) return true;
  if (!patientId) return false;
  if ((support.test_patient_ids ?? []).includes(patientId)) return true;
  const plano = patient?.plano;
  if (plano && (support.enabled_plans ?? []).includes(plano)) return true;
  const pct = support.rollout_percentage ?? 0;
  if (pct > 0 && hashTo100(patientId) < pct) return true;
  return false;
}

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
          theme_rotation_enabled: value?.community?.theme_rotation_enabled ?? false,
          theme_start_date: value?.community?.theme_start_date ?? '',
          theme_schedule: Array.isArray(value?.community?.theme_schedule) ? value.community.theme_schedule : [],
        },
        visibility: {
          tab_diet: value?.visibility?.tab_diet ?? true,
          tab_workout: value?.visibility?.tab_workout ?? true,
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
        support: {
          show_tab: value?.support?.show_tab ?? false,
          test_patient_ids: Array.isArray(value?.support?.test_patient_ids)
            ? value.support.test_patient_ids
            : [],
          enabled_plans: Array.isArray(value?.support?.enabled_plans)
            ? value.support.enabled_plans
            : [],
          rollout_percentage:
            typeof value?.support?.rollout_percentage === 'number'
              ? value.support.rollout_percentage
              : 0,
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

  /** Marca do treinador (logo/cor/frase) exibida na tela de login dos alunos. */
  async getBrand(trainerUserId: string): Promise<{ logoUrl: string; primaryColor: string; tagline: string }> {
    const { data } = await supabase
      .from('profiles')
      .select('brand_logo_url, brand_primary_color, brand_tagline')
      .eq('id', trainerUserId)
      .maybeSingle();
    return {
      logoUrl: (data?.brand_logo_url as string) || '',
      primaryColor: (data?.brand_primary_color as string) || '',
      tagline: (data?.brand_tagline as string) || '',
    };
  },

  async saveBrand(
    trainerUserId: string,
    brand: { logoUrl: string; primaryColor: string; tagline: string },
  ): Promise<void> {
    const { error } = await supabase.rpc('update_trainer_brand', {
      p_trainer_id: trainerUserId,
      p_logo_url: brand.logoUrl,
      p_primary_color: brand.primaryColor,
      p_tagline: brand.tagline,
    });
    if (error) throw error;
  },
};
