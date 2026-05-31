-- =============================================================================
-- RPCs *_by_token da Onda 2-4 do portal do aluno — criadas DIRETO no Supabase de
-- produção (qhzifnyjyxdushxorzrk) durante a implementação.
--
-- ⚠️ Já APLICADAS no banco remoto. Este arquivo existe pra VERSIONAR a mudança no
-- repo do back-office (controle-de-pacientes). Tudo é CREATE OR REPLACE / idempotente.
--
-- Complementa `migrations-onda2-4-portal-aluno.sql` (que tem get_today_workout
-- ajustado p/ DOW + finish_workout_session retornando duração).
--
-- Premissas (já existentes no banco antes desta sessão):
--   • Helper: _workout_patient_from_token(p_token) -> uuid  (resolve patient_id)
--   • RPCs base "sem token": get_cardio_totals, get_weekly_adherence,
--     get_plan_periodization, apply_phase_change, phase_change_has_visible_diff
--   • RPCs já versionadas: start/finish_workout_session_by_token,
--     log_workout_set_by_token, get_today/history/streak_by_token
--
-- Portal do aluno = anônimo + token. Todas as funções são SECURITY DEFINER e
-- resolvem/validam o patient_id pelo token internamente.
-- =============================================================================


-- ─── HUB (sessions do plano ativo, com exercícios) ───────────────────────────
CREATE OR REPLACE FUNCTION public.get_workout_hub_by_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid := _workout_patient_from_token(p_token);
  v_plan workout_plans;
  v_sessions jsonb;
begin
  select * into v_plan from workout_plans
  where patient_id = v_patient_id and status = 'active' and released_at is not null
  order by released_at desc nulls last, created_at desc limit 1;

  if v_plan.id is null then
    return jsonb_build_object('plan', null, 'sessions', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id, 'name', s.name, 'session_order', s.session_order,
      'day_of_week', s.day_of_week, 'focus', s.focus, 'notes', s.notes,
      'session_type', coalesce(s.session_type, 'workout'),
      'exercises', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', we.id, 'exercise_id', we.exercise_id, 'exercise_name', we.exercise_name,
          'exercise_order', we.exercise_order, 'sets', we.sets, 'reps', we.reps,
          'rest_seconds', we.rest_seconds, 'rest_seconds_max', we.rest_seconds_max,
          'load_kg', we.load_kg, 'load_kg_per_set', we.load_kg_per_set,
          'rpe', we.rpe, 'rpe_per_set', we.rpe_per_set, 'tempo', we.tempo,
          'superset_group', we.superset_group, 'notes', we.notes,
          'warmup_sets', we.warmup_sets, 'warmup_reps', we.warmup_reps, 'warmup_rpe', we.warmup_rpe,
          'video_url', ed.video_url, 'thumbnail_url', ed.thumbnail_url,
          'muscle_group', ed.muscle_group, 'instructions', ed.instructions, 'tips', ed.tips
        ) order by we.exercise_order), '[]'::jsonb)
        from workout_exercises we
        left join exercise_database ed on ed.id = we.exercise_id
        where we.session_id = s.id
      )
    ) order by s.session_order
  ), '[]'::jsonb) into v_sessions
  from workout_sessions s
  where s.workout_plan_id = v_plan.id;

  return jsonb_build_object('plan', to_jsonb(v_plan), 'sessions', v_sessions);
end;
$function$;


-- ─── CARDIO ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_cardio_by_token(p_token text, p_duration_min integer, p_modality text DEFAULT NULL::text, p_intensity text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_performed_at date DEFAULT NULL::date)
 RETURNS cardio_logs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid := _workout_patient_from_token(p_token);
  v_row cardio_logs;
begin
  insert into cardio_logs (patient_id, duration_min, modality, intensity, notes, performed_at)
  values (v_patient_id, p_duration_min, p_modality, p_intensity, p_notes,
          coalesce(p_performed_at, current_date))
  returning * into v_row;
  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_cardio_by_token(p_token text, p_from date, p_to date)
 RETURNS SETOF cardio_logs
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  return query
  select * from cardio_logs
  where patient_id = v_patient_id
    and performed_at >= p_from and performed_at <= p_to
  order by performed_at desc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_cardio_by_token(p_token text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  delete from cardio_logs where id = p_id and patient_id = v_patient_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_cardio_totals_by_token(p_token text)
 RETURNS TABLE(today_min integer, week_min integer, month_min integer, total_min integer, last_log_at date)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  return query select * from get_cardio_totals(v_patient_id);
end;
$function$;


-- ─── CALENDÁRIO / GRÁFICOS (logs de sessão e de série) ───────────────────────
CREATE OR REPLACE FUNCTION public.list_session_logs_by_token(p_token text, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(id uuid, started_at timestamp with time zone, session_id uuid, notes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  return query
  select l.id, l.started_at, l.session_id, l.notes
  from workout_session_logs l
  where l.patient_id = v_patient_id
    and l.started_at >= p_from and l.started_at <= p_to
  order by l.started_at;
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_set_logs_by_token(p_token text, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(logged_at timestamp with time zone, weight_kg numeric, reps integer, rpe numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  return query
  select sl.logged_at, sl.weight_kg, sl.reps, sl.rpe
  from workout_set_logs sl
  where sl.patient_id = v_patient_id
    and sl.logged_at >= p_from and sl.logged_at <= p_to
    and coalesce(sl.is_warmup, false) = false;
end;
$function$;


-- ─── ADESÃO ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_weekly_adherence_by_token(p_token text, p_plan_id uuid, p_weeks_back integer DEFAULT 2)
 RETURNS TABLE(week_start date, sessions_done integer, sessions_planned integer, adherence_pct numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  -- garante que o plano é do paciente do token
  if not exists (select 1 from workout_plans wp where wp.id = p_plan_id and wp.patient_id = v_patient_id) then
    return;
  end if;
  return query select * from get_weekly_adherence(v_patient_id, p_plan_id, p_weeks_back);
end;
$function$;


-- ─── PERIODIZAÇÃO / TRANSIÇÃO DE FASE ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_plan_periodization_by_token(p_token text, p_plan_id uuid)
 RETURNS TABLE(template_id uuid, template_name text, current_phase_index integer, phase_started_at timestamp with time zone, phases jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  if not exists (select 1 from workout_plans wp where wp.id = p_plan_id and wp.patient_id = v_patient_id) then
    return;
  end if;
  return query select * from get_plan_periodization(p_plan_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.count_sessions_in_phase_by_token(p_token text, p_plan_id uuid, p_since timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid := _workout_patient_from_token(p_token);
  v_count integer;
begin
  if not exists (select 1 from workout_plans wp where wp.id = p_plan_id and wp.patient_id = v_patient_id) then
    return 0;
  end if;
  select count(*) into v_count
  from workout_session_logs
  where patient_id = v_patient_id and workout_plan_id = p_plan_id
    and started_at >= p_since;
  return coalesce(v_count, 0);
end;
$function$;

CREATE OR REPLACE FUNCTION public.phase_change_has_visible_diff_by_token(p_token text, p_plan_id uuid, p_target_phase_index integer)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  if not exists (select 1 from workout_plans wp where wp.id = p_plan_id and wp.patient_id = v_patient_id) then
    return false;
  end if;
  return phase_change_has_visible_diff(p_plan_id, p_target_phase_index);
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_phase_change_by_token(p_token text, p_plan_id uuid, p_target_phase_index integer, p_progress_increment_pct numeric DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_patient_id uuid := _workout_patient_from_token(p_token);
begin
  if not exists (select 1 from workout_plans wp where wp.id = p_plan_id and wp.patient_id = v_patient_id) then
    raise exception 'plano nao pertence ao paciente do token' using errcode = '42501';
  end if;
  return apply_phase_change(p_plan_id, p_target_phase_index, p_progress_increment_pct);
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_periodization_general_notes_by_token(p_token text, p_template_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid := _workout_patient_from_token(p_token);
  v_notes text;
begin
  -- só devolve notes de um template referenciado por algum plano do paciente
  if not exists (
    select 1 from workout_plans wp
    where wp.patient_id = v_patient_id and wp.periodization_template_id = p_template_id
  ) then
    return null;
  end if;
  select general_notes into v_notes from periodization_templates where id = p_template_id;
  return v_notes;
end;
$function$;


-- ─── SUBSTITUIR EXERCÍCIO NO DIA (variações por grupo muscular) ──────────────
CREATE OR REPLACE FUNCTION public.suggest_variations_by_token(p_token text, p_exercise_id uuid, p_limit integer DEFAULT 12)
 RETURNS TABLE(id uuid, name text, muscle_group text, thumbnail_url text, video_url text, priority integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid := _workout_patient_from_token(p_token);
  v_mg text;
begin
  perform 1 from patients where id = v_patient_id; -- valida token
  select ed.muscle_group into v_mg from exercise_database ed where ed.id = p_exercise_id;
  if v_mg is null then
    return;
  end if;
  return query
  select ed.id, ed.name, ed.muscle_group, ed.thumbnail_url, ed.video_url, ed.priority
  from exercise_database ed
  where ed.muscle_group = v_mg
    and ed.is_active = true
    and ed.id <> p_exercise_id
  order by ed.priority asc nulls last, ed.name
  limit p_limit;
end;
$function$;


-- ─── PERFIL DO TRAINER (pro card de compartilhar progresso) ──────────────────
CREATE OR REPLACE FUNCTION public.get_trainer_profile_by_token(p_token text)
 RETURNS TABLE(name text, avatar_url text, share_logo_url text, share_brand_name text, share_brand_color text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_patient_id uuid := _workout_patient_from_token(p_token);
  v_user_id uuid;
begin
  -- trainer = dono do plano ativo do paciente (fallback: dono via patients.user_id)
  select wp.user_id into v_user_id
  from workout_plans wp
  where wp.patient_id = v_patient_id and wp.status = 'active'
  order by wp.released_at desc nulls last, wp.created_at desc limit 1;

  if v_user_id is null then
    select user_id into v_user_id from patients where id = v_patient_id;
  end if;

  return query
  select up.name, up.avatar_url, up.share_logo_url, up.share_brand_name, up.share_brand_color
  from user_profiles up where up.id = v_user_id;
end;
$function$;
