-- =============================================================================
-- Fix aplicado em produção (qhzifnyjyxdushxorzrk) durante a integração dos
-- Pilares novos de treino no portal do aluno (meu-acompanhamento).
--
-- ⚠️ Já APLICADO no banco remoto. Versionar no controle-de-pacientes junto das
-- migrations 20260601_workout_pillars_*.sql (o backend mora lá).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- fix_compute_plan_volume_srf
--
-- BUG pego no smoke test: get_workout_volume_by_token (Pilar 3) crashava com
--   ERROR 0A000: set-returning functions must appear at top level of FROM
-- porque compute_plan_volume_by_group calculava avg_reps via
--   unnest(regexp_matches(reps, '\d+', 'g'))  -- 2 SRFs aninhadas em subquery escalar
-- O Postgres rejeita SRF aninhada nesse contexto. regexp_matches já é SRF e
-- retorna text[] por match -> basta colocá-la no FROM e usar m[1].
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_plan_volume_by_group(p_plan_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  WITH parsed_exercises AS (
    SELECT
      we.id,
      we.exercise_id,
      COALESCE(we.sets, 0) AS sets,
      (
        SELECT AVG((m[1])::numeric)
        FROM regexp_matches(COALESCE(we.reps, '0'), '\d+', 'g') AS m
      ) AS avg_reps
    FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE ws.workout_plan_id = p_plan_id
  ),
  volume_per_group AS (
    SELECT
      mg.name AS group_name,
      mg.category,
      SUM(pe.sets * COALESCE(pe.avg_reps, 0) * emg.activation) AS volume
    FROM parsed_exercises pe
    JOIN exercise_muscle_groups emg ON emg.exercise_id = pe.exercise_id
    JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
    GROUP BY mg.name, mg.category

    UNION ALL

    SELECT
      ed.muscle_group AS group_name,
      NULL::text AS category,
      SUM(pe.sets * COALESCE(pe.avg_reps, 0) * 1.0) AS volume
    FROM parsed_exercises pe
    JOIN exercise_database ed ON ed.id = pe.exercise_id
    LEFT JOIN exercise_muscle_groups emg ON emg.exercise_id = pe.exercise_id
    WHERE ed.muscle_group IS NOT NULL AND emg.id IS NULL
    GROUP BY ed.muscle_group
  ),
  totals AS (
    SELECT group_name, category, SUM(volume) AS total
    FROM volume_per_group
    GROUP BY group_name, category
  )
  SELECT jsonb_object_agg(group_name, jsonb_build_object('volume', ROUND(total, 1), 'category', category) ORDER BY total DESC)
  INTO v_result
  FROM totals;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;
