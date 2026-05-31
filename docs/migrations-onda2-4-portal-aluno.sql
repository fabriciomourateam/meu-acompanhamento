-- =============================================================================
-- Migrations aplicadas DIRETO no Supabase de produção (qhzifnyjyxdushxorzrk)
-- durante a implementação das Ondas 2-4 do portal do aluno (meu-acompanhamento).
--
-- ⚠️ IMPORTANTE: o backend mora no repo `controle-de-pacientes`. Estas funções já
-- estão APLICADAS no banco remoto — este arquivo existe só pra VERSIONAR a mudança
-- no repo do back-office. Rodar de novo é idempotente (CREATE OR REPLACE / DROP IF).
--
-- Contexto: o portal do aluno é anônimo + token. Toda leitura/escrita passa por
-- RPCs SECURITY DEFINER `*_by_token`, que resolvem o patient_id via
-- _workout_patient_from_token(p_token).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Migration 1 — align_today_workout_dow
--
-- Alinha get_today_workout_by_token com a convenção do resto do app.
-- workout_sessions.day_of_week é armazenado como DOW do Postgres (0=Dom..6=Sáb),
-- igual ao JS getDay() usado no frontend (badge do treino) e no calendário.
-- Antes a RPC usava ISODOW (1=Seg..7=Dom), divergindo aos DOMINGOS (0 nunca
-- batia com 7). Trocado EXTRACT(ISODOW) -> EXTRACT(DOW).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_today_workout_by_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_patient_id uuid := _workout_patient_from_token(p_token);
  v_plan workout_plans; v_session workout_sessions;
  v_today_dow int := EXTRACT(DOW FROM now() AT TIME ZONE 'America/Sao_Paulo')::int;
  v_exercises jsonb;
BEGIN
  SELECT * INTO v_plan FROM workout_plans
  WHERE patient_id = v_patient_id AND status = 'active' AND released_at IS NOT NULL
  ORDER BY released_at DESC NULLS LAST, created_at DESC LIMIT 1;
  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('plan', null, 'session', null, 'exercises', '[]'::jsonb);
  END IF;
  SELECT * INTO v_session FROM workout_sessions
  WHERE workout_plan_id = v_plan.id AND day_of_week = v_today_dow
  ORDER BY session_order ASC LIMIT 1;
  IF v_session.id IS NULL THEN
    SELECT * INTO v_session FROM workout_sessions WHERE workout_plan_id = v_plan.id
    ORDER BY session_order ASC LIMIT 1;
  END IF;
  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('plan', to_jsonb(v_plan), 'session', null, 'exercises', '[]'::jsonb);
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', we.id, 'exercise_id', we.exercise_id, 'exercise_name', we.exercise_name,
    'exercise_order', we.exercise_order, 'sets', we.sets, 'reps', we.reps,
    'rest_seconds', we.rest_seconds, 'load_kg', we.load_kg, 'tempo', we.tempo,
    'rpe', we.rpe, 'superset_group', we.superset_group, 'notes', we.notes,
    'video_url', ed.video_url, 'thumbnail_url', ed.thumbnail_url,
    'muscle_group', ed.muscle_group, 'instructions', ed.instructions, 'tips', ed.tips
  ) ORDER BY we.exercise_order), '[]'::jsonb) INTO v_exercises
  FROM workout_exercises we LEFT JOIN exercise_database ed ON ed.id = we.exercise_id
  WHERE we.session_id = v_session.id;
  RETURN jsonb_build_object('plan', to_jsonb(v_plan), 'session', to_jsonb(v_session), 'exercises', v_exercises);
END;$function$;


-- -----------------------------------------------------------------------------
-- Migration 2 — finish_workout_returns_duration
--
-- finish_workout_session_by_token agora RETORNA a duração da sessão em minutos
-- (started_at -> ended_at), pro portal decidir se marca a meta "Atividade física"
-- do dia (>=30min) em patient_daily_challenges (challenge_key='atividade_fisica').
--
-- Mudança de tipo de retorno (void -> integer) exige DROP antes do CREATE.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.finish_workout_session_by_token(text, uuid, text, integer);

CREATE FUNCTION public.finish_workout_session_by_token(p_token text, p_session_log_id uuid, p_notes text DEFAULT NULL::text, p_rating integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_patient_id uuid := _workout_patient_from_token(p_token);
  v_duration_min integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workout_session_logs WHERE id = p_session_log_id AND patient_id = v_patient_id) THEN
    RAISE EXCEPTION 'session_log nao pertence ao paciente' USING ERRCODE = '42501';
  END IF;
  UPDATE workout_session_logs sl SET
    ended_at = COALESCE(sl.ended_at, now()),
    total_sets = (SELECT COUNT(*) FROM workout_set_logs
      WHERE session_log_id = sl.id AND completed = true AND is_warmup = false),
    total_volume_kg = (SELECT COALESCE(SUM(reps * weight_kg), 0) FROM workout_set_logs
      WHERE session_log_id = sl.id AND completed = true AND is_warmup = false),
    notes = COALESCE(p_notes, sl.notes), rating = COALESCE(p_rating, sl.rating)
  WHERE sl.id = p_session_log_id;

  SELECT GREATEST(0, ROUND(EXTRACT(EPOCH FROM (sl.ended_at - sl.started_at)) / 60.0))::int
  INTO v_duration_min
  FROM workout_session_logs sl WHERE sl.id = p_session_log_id;

  RETURN COALESCE(v_duration_min, 0);
END;$function$;
