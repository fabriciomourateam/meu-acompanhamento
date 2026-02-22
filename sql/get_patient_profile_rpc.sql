-- Função segura para buscar o PERFIL COMPLETO do paciente no portal
-- 'SECURITY DEFINER' faz com que a função execute como o criador (bypassando o RLS anônimo)
CREATE OR REPLACE FUNCTION get_patient_profile(phone_number text)
RETURNS SETOF patients 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT * 
  FROM patients p 
  WHERE p.telefone = phone_number
  LIMIT 1;
END;
$$;

-- Garantir que anon (usuários do portal) possam rodar essa função
GRANT EXECUTE ON FUNCTION get_patient_profile(text) TO anon;
GRANT EXECUTE ON FUNCTION get_patient_profile(text) TO authenticated;
