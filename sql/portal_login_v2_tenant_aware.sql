-- Smart routing pelo telefone + isolamento por tenant nas RPCs de login do portal.
-- v2: aceita tenant_slug opcional e retorna trainer_slug do paciente.
-- Aplicada em produção via Supabase MCP em 2026-05-25.
-- As funções antigas (v1) seguem ativas até o deploy do frontend novo.

CREATE OR REPLACE FUNCTION public.check_patient_exists_v2(
  phone_search text,
  tenant_slug text DEFAULT NULL
)
RETURNS TABLE(
  found boolean,
  requires_dob boolean,
  trainer_slug text,
  trainer_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_uid uuid;
  v_trainer_count int;
  v_dob date;
  v_slug text;
BEGIN
  IF tenant_slug IS NOT NULL THEN
    SELECT id INTO v_tenant_uid FROM public.profiles WHERE checkin_slug = tenant_slug LIMIT 1;
    IF v_tenant_uid IS NULL THEN
      RETURN QUERY SELECT false, false, NULL::text, 0;
      RETURN;
    END IF;
  END IF;

  -- Conta trainers distintos com esse telefone — só relevante no fluxo sem tenant
  IF tenant_slug IS NULL THEN
    SELECT COUNT(DISTINCT user_id)::int INTO v_trainer_count
    FROM public.patients
    WHERE telefone LIKE phone_search AND user_id IS NOT NULL;
  ELSE
    v_trainer_count := 1;
  END IF;

  SELECT p.data_nascimento, pr.checkin_slug
    INTO v_dob, v_slug
  FROM public.patients p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.telefone LIKE phone_search
    AND (v_tenant_uid IS NULL OR p.user_id = v_tenant_uid)
  ORDER BY p.created_at DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, NULL::text, COALESCE(v_trainer_count, 0);
    RETURN;
  END IF;

  RETURN QUERY SELECT true, (v_dob IS NOT NULL), v_slug, COALESCE(v_trainer_count, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_patient_login_with_dob_v2(
  phone_search text,
  dob_check date DEFAULT NULL,
  tenant_slug text DEFAULT NULL
)
RETURNS TABLE(telefone text, nome text, trainer_slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_uid uuid;
  v_telefone text;
  v_nome text;
  v_dob date;
  v_slug text;
BEGIN
  IF tenant_slug IS NOT NULL THEN
    SELECT id INTO v_tenant_uid FROM public.profiles WHERE checkin_slug = tenant_slug LIMIT 1;
    IF v_tenant_uid IS NULL THEN
      RETURN;
    END IF;
  END IF;

  SELECT p.telefone, p.nome, p.data_nascimento, pr.checkin_slug
    INTO v_telefone, v_nome, v_dob, v_slug
  FROM public.patients p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.telefone LIKE phone_search
    AND (v_tenant_uid IS NULL OR p.user_id = v_tenant_uid)
  ORDER BY p.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_telefone IS NULL THEN
    RETURN;
  END IF;

  -- Sem DOB no banco (legacy): libera. Com DOB: aceita diferença <= 1 dia (timezone).
  IF v_dob IS NOT NULL AND (dob_check IS NULL OR ABS(v_dob - dob_check) > 1) THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT v_telefone, v_nome, v_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_patient_dob_and_login_v2(
  phone_search text,
  new_dob date,
  tenant_slug text DEFAULT NULL
)
RETURNS TABLE(telefone text, nome text, trainer_slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_tenant_uid uuid;
  v_id uuid;
  v_telefone text;
  v_nome text;
  v_existing_dob date;
  v_slug text;
  v_age int;
BEGIN
  v_age := EXTRACT(YEAR FROM age(new_dob));
  IF v_age < 10 OR v_age > 100 THEN
    RETURN;
  END IF;

  IF tenant_slug IS NOT NULL THEN
    SELECT id INTO v_tenant_uid FROM public.profiles WHERE checkin_slug = tenant_slug LIMIT 1;
    IF v_tenant_uid IS NULL THEN
      RETURN;
    END IF;
  END IF;

  SELECT p.id, p.telefone, p.nome, p.data_nascimento, pr.checkin_slug
    INTO v_id, v_telefone, v_nome, v_existing_dob, v_slug
  FROM public.patients p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.telefone LIKE phone_search
    AND (v_tenant_uid IS NULL OR p.user_id = v_tenant_uid)
  ORDER BY p.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN;
  END IF;

  IF v_existing_dob IS NOT NULL THEN
    RETURN;
  END IF;

  UPDATE public.patients SET data_nascimento = new_dob WHERE id = v_id;

  INSERT INTO public.patient_dob_first_set_audit (patient_id, telefone, dob_set)
  VALUES (v_id, v_telefone, new_dob);

  RETURN QUERY SELECT v_telefone, v_nome, v_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_patient_exists_v2(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_patient_login_with_dob_v2(text, date, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_patient_dob_and_login_v2(text, date, text) TO anon, authenticated, service_role;
