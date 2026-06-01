-- =============================================================================
-- Senha-mestra do admin pro portal do aluno.
--
-- ⚠️ Já APLICADO no banco remoto (qhzifnyjyxdushxorzrk). Versionar no
-- controle-de-pacientes (o backend mora lá). Idempotente (CREATE OR REPLACE).
--
-- O QUE FAZ: digitando a data 04/04/1988 no campo "data de nascimento" do
-- PortalLogin, o acesso é liberado pra QUALQUER telefone de aluno, ignorando a
-- data real. Não muda nada no frontend nem no fluxo do aluno (data correta
-- continua funcionando), e NUNCA grava a senha como nascimento real.
--
-- A senha é central em _is_admin_master_dob(date). Pra trocar, muda só ela.
-- =============================================================================

CREATE OR REPLACE FUNCTION public._is_admin_master_dob(p_dob date)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT p_dob = DATE '1988-04-04';
$function$;


-- Login normal (aluno já tem data cadastrada): aceita senha-mestra OU data real.
CREATE OR REPLACE FUNCTION public.check_patient_login_with_dob_v2(phone_search text, dob_check date DEFAULT NULL::date, tenant_slug text DEFAULT NULL::text)
 RETURNS TABLE(telefone text, nome text, trainer_slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Senha-mestra do admin: libera direto, sem comparar com a data real.
  IF _is_admin_master_dob(dob_check) THEN
    RETURN QUERY SELECT v_telefone, v_nome, v_slug;
    RETURN;
  END IF;

  -- Sem DOB no banco (legacy): libera. Com DOB: aceita diferença <= 1 dia (timezone).
  IF v_dob IS NOT NULL AND (dob_check IS NULL OR ABS(v_dob - dob_check) > 1) THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT v_telefone, v_nome, v_slug;
END;
$function$;


-- Primeiro acesso (aluno sem data): se for senha-mestra, libera SEM gravar a data
-- (não corrompe o nascimento real do aluno que ainda não cadastrou).
CREATE OR REPLACE FUNCTION public.set_patient_dob_and_login_v2(phone_search text, new_dob date, tenant_slug text DEFAULT NULL::text)
 RETURNS TABLE(telefone text, nome text, trainer_slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_uid uuid;
  v_id uuid;
  v_telefone text;
  v_nome text;
  v_existing_dob date;
  v_slug text;
  v_age int;
BEGIN
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

  -- Senha-mestra do admin: libera o acesso SEM gravar nada como data real.
  IF _is_admin_master_dob(new_dob) THEN
    RETURN QUERY SELECT v_telefone, v_nome, v_slug;
    RETURN;
  END IF;

  -- Fluxo normal de primeiro acesso: valida idade plausível e grava.
  v_age := EXTRACT(YEAR FROM age(new_dob));
  IF v_age < 10 OR v_age > 100 THEN
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
$function$;
