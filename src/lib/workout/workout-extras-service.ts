// Extras do portal de treino (Ondas 2-4): cardio, calendário/adesão, periodização,
// variações e perfil do trainer.
//
// IMPORTANTE — modelo de auth: o portal do aluno é anon + token (não há
// `auth.uid()`). Por isso TODA leitura/escrita passa pelas RPCs SECURITY DEFINER
// `*_by_token`, que resolvem o patient_id internamente a partir do token. Nunca
// acesse `cardio_logs`/`workout_set_logs`/etc direto por `patient_id` no cliente:
// a RLS (keyed em auth.uid()) bloqueia o anon.

import { supabase } from '@/integrations/supabase/client';

export interface CardioLog {
  id: string;
  patient_id: string;
  performed_at: string;
  duration_min: number;
  modality: string | null;
  intensity: string | null;
  notes: string | null;
  created_at: string;
}

export interface CardioTotals {
  today_min: number;
  week_min: number;
  month_min: number;
  total_min: number;
  last_log_at: string | null;
}

export interface AdherenceWeek {
  week_start: string;
  sessions_done: number;
  sessions_planned: number;
  adherence_pct: number;
}

export interface PeriodizationPhase {
  id: string;
  order_index: number;
  label: string;
  preset: string | null;
  duration_sessions: number | null;
  duration_weeks: number | null;
  sets_override: number | null;
  reps_override: string | null;
  load_pct_change: number | null;
  rpe_per_set_override: string | null;
  color: string | null;
}

export interface Periodization {
  template_id: string;
  template_name: string;
  current_phase_index: number;
  phase_started_at: string | null;
  phases: PeriodizationPhase[];
}

export interface LastLoad {
  planned_exercise_id: string;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  logged_at: string;
}

export interface ExerciseVariation {
  id: string;
  name: string;
  muscle_group: string;
  thumbnail_url: string | null;
  video_url: string | null;
  priority: number | null;
}

export interface TrainerProfile {
  name: string | null;
  avatar_url: string | null;
  share_logo_url: string | null;
  share_brand_name: string | null;
  share_brand_color: string | null;
}

// Cardio prescrito na ficha (workout_plan_cardio, 1:1 com o plano).
export interface PrescribedCardio {
  modalidade: string | null;
  frequencia: 'semanal' | 'diario' | string;
  unidade: 'min' | 'h' | string;
  dias_semana: number[];               // DOW 0=dom..6=sáb
  modo: 'mesmo' | 'individual' | string;
  tempo_padrao: number | null;          // minutos quando modo='mesmo'
  tempo_por_dia: Record<string, number>; // quando modo='individual'
  intensidade: string | null;
  observacoes: string | null;
}

// Volume por grupamento muscular: { "Peitoral": { volume, category }, ... }
export type VolumeByGroup = Record<string, { volume: number; category: string | null }>;

// Notificação do aluno (auto-avanço de periodização etc.).
export interface PatientNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  meta: Record<string, any> | null;
  created_at: string;
  read_at: string | null;
}

export const workoutExtrasService = {
  // ─── CARDIO ────────────────────────────────────────────
  async listCardio(token: string, from: string, to: string): Promise<CardioLog[]> {
    const { data, error } = await supabase.rpc('list_cardio_by_token' as any, {
      p_token: token, p_from: from, p_to: to,
    });
    if (error) throw error;
    return (data as CardioLog[]) ?? [];
  },

  async logCardio(token: string, payload: {
    duration_min: number; modality?: string; intensity?: string; notes?: string; performed_at?: string;
  }): Promise<CardioLog> {
    const { data, error } = await supabase.rpc('log_cardio_by_token' as any, {
      p_token: token,
      p_duration_min: payload.duration_min,
      p_modality: payload.modality ?? null,
      p_intensity: payload.intensity ?? null,
      p_notes: payload.notes ?? null,
      p_performed_at: payload.performed_at ?? null,
    });
    if (error) throw error;
    return data as CardioLog;
  },

  async deleteCardio(token: string, id: string): Promise<void> {
    const { error } = await supabase.rpc('delete_cardio_by_token' as any, { p_token: token, p_id: id });
    if (error) throw error;
  },

  async getCardioTotals(token: string): Promise<CardioTotals> {
    const { data, error } = await supabase.rpc('get_cardio_totals_by_token' as any, { p_token: token });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as CardioTotals) ?? { today_min: 0, week_min: 0, month_min: 0, total_min: 0, last_log_at: null };
  },

  // ─── CALENDÁRIO / ADESÃO / SET LOGS ────────────────────
  async listSessionLogs(token: string, from: string, to: string) {
    const { data, error } = await supabase.rpc('list_session_logs_by_token' as any, {
      p_token: token, p_from: from, p_to: to,
    });
    if (error) throw error;
    return (data as Array<{ id: string; started_at: string; session_id: string; notes: string | null }>) ?? [];
  },

  async listSetLogs(token: string, from: string, to: string) {
    const { data, error } = await supabase.rpc('list_set_logs_by_token' as any, {
      p_token: token, p_from: from, p_to: to,
    });
    if (error) throw error;
    return (data as Array<{ logged_at: string; weight_kg: number | null; reps: number | null; rpe: number | null }>) ?? [];
  },

  // Última carga registrada por exercício planejado — pra sugerir o peso na execução.
  async getLastLoads(token: string, planId: string): Promise<LastLoad[]> {
    const { data, error } = await supabase.rpc('get_last_loads_by_token' as any, {
      p_token: token, p_plan_id: planId,
    });
    if (error) throw error;
    return (data as LastLoad[]) ?? [];
  },

  async getWeeklyAdherence(token: string, planId: string, weeksBack = 2): Promise<AdherenceWeek[]> {
    const { data, error } = await supabase.rpc('get_weekly_adherence_by_token' as any, {
      p_token: token, p_plan_id: planId, p_weeks_back: weeksBack,
    });
    if (error) throw error;
    return (data as AdherenceWeek[]) ?? [];
  },

  // ─── PERIODIZAÇÃO / FASE ───────────────────────────────
  async getPlanPeriodization(token: string, planId: string): Promise<Periodization | null> {
    const { data, error } = await supabase.rpc('get_plan_periodization_by_token' as any, {
      p_token: token, p_plan_id: planId,
    });
    if (error) throw error;
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    return (Array.isArray(data) ? data[0] : data) as Periodization;
  },

  async countSessionsInPhase(token: string, planId: string, since: string): Promise<number> {
    const { data, error } = await supabase.rpc('count_sessions_in_phase_by_token' as any, {
      p_token: token, p_plan_id: planId, p_since: since,
    });
    if (error) throw error;
    return (data as number) ?? 0;
  },

  async phaseChangeHasVisibleDiff(token: string, planId: string, targetPhaseIndex: number): Promise<boolean> {
    const { data, error } = await supabase.rpc('phase_change_has_visible_diff_by_token' as any, {
      p_token: token, p_plan_id: planId, p_target_phase_index: targetPhaseIndex,
    });
    if (error) throw error;
    return data === true;
  },

  async applyPhaseChange(token: string, planId: string, targetPhaseIndex: number, progressIncrementPct = 5) {
    const { data, error } = await supabase.rpc('apply_phase_change_by_token' as any, {
      p_token: token, p_plan_id: planId, p_target_phase_index: targetPhaseIndex,
      p_progress_increment_pct: progressIncrementPct,
    });
    if (error) throw error;
    return data;
  },

  async getPeriodizationGeneralNotes(token: string, templateId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_periodization_general_notes_by_token' as any, {
      p_token: token, p_template_id: templateId,
    });
    if (error) throw error;
    return (data as string | null) ?? null;
  },

  // ─── VARIAÇÕES (substituir no dia) ─────────────────────
  async suggestVariations(token: string, exerciseId: string, limit = 12): Promise<ExerciseVariation[]> {
    const { data, error } = await supabase.rpc('suggest_variations_by_token' as any, {
      p_token: token, p_exercise_id: exerciseId, p_limit: limit,
    });
    if (error) throw error;
    return (data as ExerciseVariation[]) ?? [];
  },

  // ─── PERFIL DO TRAINER ─────────────────────────────────
  async getTrainerProfile(token: string): Promise<TrainerProfile | null> {
    const { data, error } = await supabase.rpc('get_trainer_profile_by_token' as any, { p_token: token });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as TrainerProfile) ?? null;
  },

  // ─── CARDIO PRESCRITO (workout_plan_cardio) ────────────
  async getPrescribedCardio(token: string): Promise<PrescribedCardio | null> {
    const { data, error } = await supabase.rpc('get_workout_plan_cardio_by_token' as any, { p_token: token });
    if (error) throw error;
    const cardio = (data as { cardio: PrescribedCardio | null } | null)?.cardio ?? null;
    return cardio;
  },

  // ─── VOLUME POR GRUPAMENTO MUSCULAR ────────────────────
  async getVolumeByGroup(token: string): Promise<VolumeByGroup> {
    const { data, error } = await supabase.rpc('get_workout_volume_by_token' as any, { p_token: token });
    if (error) throw error;
    return (data as VolumeByGroup) ?? {};
  },

  // ─── NOTIFICAÇÕES (auto-avanço de periodização etc.) ───
  async listNotifications(token: string, limit = 20): Promise<PatientNotification[]> {
    const { data, error } = await supabase.rpc('list_patient_notifications_by_token' as any, {
      p_token: token, p_limit: limit,
    });
    if (error) throw error;
    return (data as PatientNotification[]) ?? [];
  },

  async markNotificationRead(token: string, notificationId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_notification_read_by_token' as any, {
      p_token: token, p_notification_id: notificationId,
    });
    if (error) throw error;
  },
};
