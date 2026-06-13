-- Permite ao admin zerar os pontos de UM aluno especifico (em vez de todos os
-- alunos do trainer). Funcao dedicada (em vez de sobrecarregar
-- reset_trainer_patient_points) pra nao criar ambiguidade de assinatura no
-- PostgREST. Reaproveita a tabela points_reset_audit, ganhando uma coluna
-- patient_id (NULL = reset geral, como nas linhas existentes).

ALTER TABLE public.points_reset_audit
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.reset_one_patient_points(
  trainer_uid uuid,
  p_patient_id uuid,
  also_reset_level boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history_deleted int := 0;
  v_affected        int := 0;
  v_snapshot        jsonb;
  v_owns            boolean;
BEGIN
  IF trainer_uid IS NULL THEN
    RAISE EXCEPTION 'trainer_uid required' USING ERRCODE = '22023';
  END IF;
  IF p_patient_id IS NULL THEN
    RAISE EXCEPTION 'patient_id required' USING ERRCODE = '22023';
  END IF;

  -- Garante que o aluno pertence a este trainer (impede zerar aluno alheio).
  SELECT EXISTS(
    SELECT 1 FROM patients WHERE id = p_patient_id AND user_id = trainer_uid
  ) INTO v_owns;
  IF NOT v_owns THEN
    RAISE EXCEPTION 'patient not found for trainer' USING ERRCODE = '22023';
  END IF;

  -- Snapshot do aluno antes do reset (mesmo formato do top3 do historico, com
  -- 1 elemento) pra o log de "ultimos resets" mostrar quem foi zerado e com
  -- quantos pontos.
  SELECT coalesce(jsonb_agg(jsonb_build_object('nome', p.nome, 'points', pp.total_points)), '[]'::jsonb)
  INTO v_snapshot
  FROM patient_points pp
  JOIN patients p ON p.id = pp.patient_id
  WHERE pp.patient_id = p_patient_id AND p.user_id = trainer_uid;

  UPDATE patient_points pp
  SET total_points = 0,
      current_level = CASE WHEN also_reset_level THEN 1 ELSE pp.current_level END
  FROM patients p
  WHERE pp.patient_id = p.id
    AND pp.patient_id = p_patient_id
    AND p.user_id = trainer_uid;
  GET DIAGNOSTICS v_affected = ROW_COUNT;

  DELETE FROM patient_points_history pph
  USING patients p
  WHERE pph.patient_id = p.id
    AND pph.patient_id = p_patient_id
    AND p.user_id = trainer_uid;
  GET DIAGNOSTICS v_history_deleted = ROW_COUNT;

  INSERT INTO points_reset_audit (trainer_user_id, patients_affected, history_rows_deleted, top3, level_reset, patient_id)
  VALUES (trainer_uid, v_affected, v_history_deleted, v_snapshot, also_reset_level, p_patient_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_one_patient_points(uuid, uuid, boolean) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
