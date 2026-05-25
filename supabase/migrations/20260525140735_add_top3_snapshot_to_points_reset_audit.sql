-- Snapshot do pódio no momento do reset: [{nome, points}, ...] até 3 entradas.
-- A função captura o top 3 ANTES do UPDATE total_points=0, ignorando quem
-- já tinha 0 pontos.

ALTER TABLE public.points_reset_audit
  ADD COLUMN IF NOT EXISTS top3 jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.reset_trainer_patient_points(trainer_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patients_affected int := 0;
  v_history_deleted   int := 0;
  v_top3              jsonb;
BEGIN
  IF trainer_uid IS NULL OR trainer_uid <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
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
  SET total_points = 0
  FROM patients p
  WHERE pp.patient_id = p.id AND p.user_id = trainer_uid;
  GET DIAGNOSTICS v_patients_affected = ROW_COUNT;

  DELETE FROM patient_points_history pph
  USING patients p
  WHERE pph.patient_id = p.id AND p.user_id = trainer_uid;
  GET DIAGNOSTICS v_history_deleted = ROW_COUNT;

  INSERT INTO points_reset_audit (trainer_user_id, patients_affected, history_rows_deleted, top3)
  VALUES (trainer_uid, v_patients_affected, v_history_deleted, v_top3);
END;
$$;

REVOKE ALL  ON FUNCTION public.reset_trainer_patient_points(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_trainer_patient_points(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.reset_trainer_patient_points(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
