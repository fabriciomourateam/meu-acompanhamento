// Wrapper das RPCs *_by_token do back-end de treinos.
// Portal do aluno é anon + token (validateToken) — toda escrita/leitura passa
// pelas RPCs SECURITY DEFINER que resolvem o patient_id internamente.

import { supabase } from '@/integrations/supabase/client';
import type { TodayWorkout, WorkoutHistoryRow } from './types';

export const workoutService = {
  async getTodayWorkout(token: string): Promise<TodayWorkout> {
    const { data, error } = await supabase.rpc('get_today_workout_by_token' as any, { p_token: token });
    if (error) throw error;
    const parsed = (data as any) || { plan: null, session: null, exercises: [] };
    return {
      plan: parsed.plan ?? null,
      session: parsed.session ?? null,
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
    };
  },

  async getHistory(token: string, limit = 30, offset = 0): Promise<WorkoutHistoryRow[]> {
    const { data, error } = await supabase.rpc('get_workout_history_by_token' as any, {
      p_token: token,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    return (data as WorkoutHistoryRow[]) || [];
  },

  async getStreak(token: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_workout_streak_by_token' as any, { p_token: token });
    if (error) throw error;
    return (data as number) ?? 0;
  },

  async startSession(token: string, sessionId: string): Promise<string> {
    const { data, error } = await supabase.rpc('start_workout_session_by_token' as any, {
      p_token: token,
      p_session_id: sessionId,
    });
    if (error) throw error;
    return data as string;
  },

  async logSet(token: string, params: {
    sessionLogId: string;
    plannedExerciseId: string;
    setIndex: number;
    reps: number | null;
    weightKg: number | null;
    rpe: number | null;
    isWarmup?: boolean;
    notes?: string | null;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('log_workout_set_by_token' as any, {
      p_token: token,
      p_session_log_id: params.sessionLogId,
      p_planned_exercise_id: params.plannedExerciseId,
      p_set_index: params.setIndex,
      p_reps: params.reps,
      p_weight_kg: params.weightKg,
      p_rpe: params.rpe,
      p_is_warmup: params.isWarmup ?? false,
      p_notes: params.notes ?? null,
    });
    if (error) throw error;
    return data as string;
  },

  async finishSession(token: string, sessionLogId: string, notes?: string | null, rating?: number | null): Promise<void> {
    const { error } = await supabase.rpc('finish_workout_session_by_token' as any, {
      p_token: token,
      p_session_log_id: sessionLogId,
      p_notes: notes ?? null,
      p_rating: rating ?? null,
    });
    if (error) throw error;
  },
};
