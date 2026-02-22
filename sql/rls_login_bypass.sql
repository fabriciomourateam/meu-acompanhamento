-- Função segura para buscar pacientes pelo telefone na tela de Login do Portal
-- 'SECURITY DEFINER' faz com que a função execute como o criador (bypassando o RLS anônimo)
CREATE OR REPLACE FUNCTION check_patient_login(phone_search text)
RETURNS TABLE(telefone text, nome text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT p.telefone, p.nome 
  FROM patients p 
  WHERE p.telefone ILIKE phone_search
  LIMIT 1;
END;
$$;

-- Garantir que anon (usuários deslogados) possam rodar essa função
GRANT EXECUTE ON FUNCTION check_patient_login(text) TO anon;
GRANT EXECUTE ON FUNCTION check_patient_login(text) TO authenticated;
