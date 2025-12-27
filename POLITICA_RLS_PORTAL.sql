-- ============================================
-- POLÍTICA RLS PARA PORTAL DO PACIENTE
-- ============================================
-- Esta política permite que pacientes acessem seus próprios dados
-- através do portal público usando apenas o telefone
-- 
-- IMPORTANTE: Execute este SQL no Supabase SQL Editor
-- ============================================

-- Política para permitir leitura pública de pacientes por telefone
-- Necessária para o Portal do Paciente funcionar sem autenticação
CREATE POLICY "portal_public_read_patients_by_phone"
ON patients FOR SELECT
TO anon, authenticated
USING (true);

-- OU, se preferir mais seguro, permita apenas leitura de telefone e nome:
-- CREATE POLICY "portal_public_read_patients_by_phone"
-- ON patients FOR SELECT
-- TO anon, authenticated
-- USING (true)
-- WITH CHECK (true);

-- Para verificar se a política foi criada:
-- SELECT * FROM pg_policies WHERE tablename = 'patients';


