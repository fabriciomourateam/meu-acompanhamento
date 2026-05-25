-- Recria reset_trainer_patient_points como (uuid) com grant explícito.
-- Versão antiga era (text) e ficava invisível pro PostgREST (sem GRANT pra
-- authenticated → 404). Esta migration foi superseded pela
-- 20260525142945_align_reset_points_with_pin_based_admin (alinha com modelo
-- PIN — auth.uid() não funciona no admin). Mantida no histórico por
-- completude.

DROP FUNCTION IF EXISTS public.reset_trainer_patient_points(text);

CREATE OR REPLACE FUNCTION public.reset_trainer_patient_points(trainer_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF trainer_uid IS NULL OR trainer_uid <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE patient_points pp
  SET total_points = 0
  FROM patients p
  WHERE pp.patient_id = p.id AND p.user_id = trainer_uid;

  DELETE FROM patient_points_history pph
  USING patients p
  WHERE pph.patient_id = p.id AND p.user_id = trainer_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_trainer_patient_points(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_trainer_patient_points(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
