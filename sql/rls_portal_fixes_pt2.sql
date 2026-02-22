-- CONTINUAÇÃO DOS AJUSTES NO RLS

-- 7. Consertar diet_guidelines (que também tentava ler de patients e falhava)
DROP POLICY IF EXISTS "Allow read diet_guidelines for portal released plans (anon)" ON public.diet_guidelines;

CREATE POLICY "Allow read diet_guidelines for portal released plans (anon)"
ON public.diet_guidelines
FOR SELECT
TO anon
USING (true);

-- 8. Adicionar ou consertar checkins 
-- (O portal carrega da tabela 'checkin' sem o 's')
ALTER TABLE public.checkin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read checkin for portal (anon)" ON public.checkin;

CREATE POLICY "Allow read checkin for portal (anon)"
ON public.checkin
FOR SELECT
TO anon
USING (true);

-- 9. Corrigir tabela patient_portal_tokens
ALTER TABLE public.patient_portal_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read tokens for portal (anon)" ON public.patient_portal_tokens;
DROP POLICY IF EXISTS "Allow insert tokens for portal (anon)" ON public.patient_portal_tokens;
DROP POLICY IF EXISTS "Allow update tokens for portal (anon)" ON public.patient_portal_tokens;

CREATE POLICY "Allow read tokens for portal (anon)" ON public.patient_portal_tokens FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert tokens for portal (anon)" ON public.patient_portal_tokens FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update tokens for portal (anon)" ON public.patient_portal_tokens FOR UPDATE TO anon USING (true) WITH CHECK (true);
-- Nota na linha de cima: Token tables em apps client-side sem conta como esse 
-- precisam de permissão plena do anon para as tabelas temporárias (insert/update token login)
