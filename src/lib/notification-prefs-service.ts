import { supabase } from '@/integrations/supabase/client';

// Opt-out por categoria das notificações do SININHO (in-app) do aluno.
// NÃO mexe no push do celular nem no chat (o chat não grava no sino).
// As categorias batem com a função SQL `notification_category(type)`.
export type NotificationCategory = 'recordes' | 'dieta' | 'treino' | 'incentivo' | 'periodizacao';

export interface NotificationCategoryInfo {
  key: NotificationCategory;
  label: string;
  description: string;
}

// Ordem e textos exibidos no painel. "Chat" não entra aqui de propósito:
// mensagens do Fabricio sempre chegam.
export const NOTIFICATION_CATEGORIES: NotificationCategoryInfo[] = [
  { key: 'recordes', label: 'Recordes (PR)', description: 'Quando você bate um novo recorde de carga.' },
  { key: 'dieta', label: 'Lembretes de dieta', description: 'Avisos sobre as refeições do dia.' },
  { key: 'treino', label: 'Avisos de treino', description: 'Lembretes do treino do dia.' },
  { key: 'incentivo', label: 'Mensagens de incentivo', description: 'Aquele empurrãozinho quando você some um tempo.' },
  { key: 'periodizacao', label: 'Mudanças de fase', description: 'Quando seu treino avança de fase.' },
];

export const notificationPrefsService = {
  /** Categorias atualmente silenciadas pelo aluno. */
  async getMuted(patientId: string): Promise<NotificationCategory[]> {
    const { data, error } = await supabase.rpc('notification_prefs_get', {
      p_patient_id: patientId,
    });
    if (error || !data) return [];
    return (data as string[]).filter(Boolean) as NotificationCategory[];
  },

  /** Silencia (muted=true) ou religa (muted=false) uma categoria. Devolve o novo estado. */
  async set(patientId: string, category: NotificationCategory, muted: boolean): Promise<NotificationCategory[]> {
    const { data, error } = await supabase.rpc('notification_prefs_set', {
      p_patient_id: patientId,
      p_category: category,
      p_muted: muted,
    });
    if (error || !data) return [];
    return (data as string[]).filter(Boolean) as NotificationCategory[];
  },
};
