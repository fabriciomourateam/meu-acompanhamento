// Tipos espelhando o que as RPCs *_by_token retornam do back-end de treinos.
// Spec: controle-de-pacientes/docs/WORKOUTS_APP_SPEC.md

export interface WorkoutPlan {
  id: string;
  patient_id: string;
  name: string;
  status: string;
  goal: string | null;
  frequency_per_week: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  released_at: string | null;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  workout_plan_id: string;
  name: string;
  session_order: number;
  day_of_week: number | null;
  focus: string | null;
  notes: string | null;
}

export type SessionType = 'workout' | 'cardio' | 'guidelines';

// Sessão retornada pelo hub (get_workout_hub_by_token): inclui session_type e os
// exercícios já embutidos (com campos de execução por série).
export interface HubExercise extends WorkoutExerciseFull {
  rest_seconds_max: number | null;
  load_kg_per_set: string | null;
  rpe_per_set: string | null;
  warmup_sets: number | null;
  warmup_reps: string | null;
  warmup_rpe: number | null;
}

export interface HubSession {
  id: string;
  name: string;
  session_order: number;
  day_of_week: number | null;
  focus: string | null;
  notes: string | null;
  session_type: SessionType;
  exercises: HubExercise[];
}

export interface WorkoutPlanFull extends WorkoutPlan {
  session_naming_style: 'numeric' | 'letter' | null;
  current_phase_index: number | null;
  current_phase_label: string | null;
  phase_started_at: string | null;
  periodization_template_id: string | null;
}

export interface WorkoutHub {
  plan: WorkoutPlanFull | null;
  sessions: HubSession[];
}

export interface WorkoutExerciseFull {
  id: string;
  exercise_id: string | null;
  exercise_name: string;
  exercise_order: number;
  sets: number;
  reps: string | null;
  rest_seconds: number | null;
  load_kg: number | null;
  tempo: string | null;
  rpe: number | null;
  superset_group: string | null;
  notes: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  muscle_group: string | null;
  instructions: string | null;
  tips: string | null;
}

export interface TodayWorkout {
  plan: WorkoutPlan | null;
  session: WorkoutSession | null;
  exercises: WorkoutExerciseFull[];
}

export interface WorkoutHistoryRow {
  id: string;
  workout_plan_id: string | null;
  session_id: string | null;
  session_name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  total_sets: number | null;
  rating: number | null;
  notes: string | null;
}
