-- Adiciona opção de zerar também o nível do paciente (current_level → 1).
-- A audit table ganha uma coluna level_reset pra registrar se o nível foi
-- zerado em cada reset. A função vira (uuid, boolean DEFAULT false) — drop
-- da versão (uuid) anterior pra evitar ambiguidade no PostgREST.

ALTER TABLE public.points_reset_audit
  ADD COLUMN IF NOT EXISTS level_reset boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.reset_trainer_patient_points(uuid);

CREATE OR REPLACE FUNCTION public.reset_trainer_patient_points(
  trainer_uid uuid,
  also_reset_level boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patients_affected int := 0;
  v_history_deleted   int := 0;
  v_top3              jsonb;
  v_trainer_exists    boolean;
BEGIN
  IF trainer_uid IS NULL THEN
    RAISE EXCEPTION 'trainer_uid required' USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = trainer_uid) INTO v_trainer_exists;
  IF NOT v_trainer_exists THEN
    RAISE EXCEPTION 'trainer not found' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('nome', t.nome, 'points', t.points)), '[]'::jsonb)
  INTO v_top3
  FROM (
    SELECT p.nome, pp.total_points AS points
    FROM patient_points pp
    JOIN patients p ON p.id = pp.patient_id
    WHERE p.user_id = trainer_uid
      AND pp.total_points > 0
    ORDER BY pp.total_points DESC, p.nome ASC
    LIMIT 3
  ) t;

  UPDATE patient_points pp
  SET total_points = 0,
      current_level = CASE WHEN also_reset_level THEN 1 ELSE pp.current_level END
  FROM patients p
  WHERE pp.patient_id = p.id AND p.user_id = trainer_uid;
  GET DIAGNOSTICS v_patients_affected = ROW_COUNT;

  DELETE FROM patient_points_history pph
  USING patients p
  WHERE pph.patient_id = p.id AND p.user_id = trainer_uid;
  GET DIAGNOSTICS v_history_deleted = ROW_COUNT;

  INSERT INTO points_reset_audit (trainer_user_id, patients_affected, history_rows_deleted, top3, level_reset)
  VALUES (trainer_uid, v_patients_affected, v_history_deleted, v_top3, also_reset_level);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_trainer_patient_points(uuid, boolean) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
