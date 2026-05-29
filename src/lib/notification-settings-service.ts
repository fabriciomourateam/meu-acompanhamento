import { supabase } from '@/integrations/supabase/client';

export interface ReminderItem {
  time: string; // 'HH:MM' em múltiplos de 15min
  title: string;
  body: string;
}

export interface NotificationSettings {
  trainer_user_id: string;
  diet_enabled: boolean;
  community_enabled: boolean;
  reminders_enabled: boolean;
  reminders: ReminderItem[];
  inactive_enabled: boolean;
  inactive_days: number;
  inactive_patient_title: string;
  inactive_patient_body: string;
  notify_trainer_on_inactive: boolean;
  timezone: string;
  updated_at: string;
}

export const notificationSettingsService = {
  async get(trainerId: string): Promise<NotificationSettings | null> {
    const { data, error } = await supabase.rpc('notification_settings_get', {
      p_trainer_id: trainerId,
    });
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as NotificationSettings;
    return { ...row, reminders: (row.reminders as unknown as ReminderItem[]) ?? [] };
  },

  async update(trainerId: string, patch: Partial<NotificationSettings>): Promise<NotificationSettings | null> {
    const { data, error } = await supabase.rpc('notification_settings_update', {
      p_trainer_id: trainerId,
      p_patch: patch as Record<string, unknown>,
    });
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as NotificationSettings;
    return { ...row, reminders: (row.reminders as unknown as ReminderItem[]) ?? [] };
  },
};
