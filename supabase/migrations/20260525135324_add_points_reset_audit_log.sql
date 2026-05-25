-- Tabela de auditoria pros resets de pontuação (padrão do
-- patient_dob_first_set_audit). A versão da função aqui ainda usa auth.uid()
-- — foi corrigida em 20260525142945 (modelo PIN-based do admin).

CREATE TABLE IF NOT EXISTS public.points_reset_audit (
  id bigserial PRIMARY KEY,
  trainer_user_id uuid NOT NULL,
  reset_at timestamptz NOT NULL DEFAULT now(),
  patients_affected int NOT NULL DEFAULT 0,
  history_rows_deleted int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS points_reset_audit_trainer_idx
  ON public.points_reset_audit (trainer_user_id, reset_at DESC);

ALTER TABLE public.points_reset_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS points_reset_audit_select_own ON public.points_reset_audit;
CREATE POLICY points_reset_audit_select_own
  ON public.points_reset_audit
  FOR SELECT
  TO authenticated
  USING (trainer_user_id = auth.uid());

GRANT SELECT ON public.points_reset_audit TO authenticated;

CREATE OR REPLACE FUNCTION public.reset_trainer_patient_points(trainer_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patients_affected int := 0;
  v_history_deleted int := 0;
BEGIN
  IF trainer_uid IS NULL OR trainer_uid <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE patient_points pp
  SET total_points = 0
  FROM patients p
  WHERE pp.patient_id = p.id AND p.user_id = trainer_uid;
  GET DIAGNOSTICS v_patients_affected = ROW_COUNT;

  DELETE FROM patient_points_history pph
  USING patients p
  WHERE pph.patient_id = p.id AND p.user_id = trainer_uid;
  GET DIAGNOSTICS v_history_deleted = ROW_COUNT;

  INSERT INTO points_reset_audit (trainer_user_id, patients_affected, history_rows_deleted)
  VALUES (trainer_uid, v_patients_affected, v_history_deleted);
END;
$$;

REVOKE ALL ON FUNCTION public.reset_trainer_patient_points(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_trainer_patient_points(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
