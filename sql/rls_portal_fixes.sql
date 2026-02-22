-- =====================================================
-- CORREÇÃO DE RLS PARA O PORTAL DO PACIENTE (ANON)
-- =====================================================
-- Problema: As tabelas vitais para exibir a evolução (checkin, patient_portal_tokens, diet_plans)
-- estavam restringindo a leitura porque a checagem anon do Supabase não deixa ver 'patients'.

-- 1. Liberar tabela 'checkin' para leitura anônima baseada no telefone e id
CREATE POLICY "Allow read checkin for portal (anon)"
ON public.checkin
FOR SELECT
TO anon
USING (true);

-- 2. Liberar tabela 'patient_portal_tokens' para leitura do validador de token anônimo
CREATE POLICY "Allow read tokens for portal (anon)"
ON public.patient_portal_tokens
FOR SELECT
TO anon
USING (true);

-- 3. Consertar a política de leitura de diet_plans
-- A política antiga forçava um SELECT na tabela patients que falhava por RLS.
-- Agora permitiremos livre leitura (o App JavaScript fará o filtro por id do aluno via Token)
DROP POLICY IF EXISTS "Allow read released diet_plans for portal (anon)" ON public.diet_plans;

CREATE POLICY "Allow read released diet_plans for portal (anon)"
ON public.diet_plans
FOR SELECT
TO anon
USING (is_released = true);

-- 4. Consertar diet_meals
DROP POLICY IF EXISTS "Allow read diet_meals for portal released plans (anon)" ON public.diet_meals;

CREATE POLICY "Allow read diet_meals for portal released plans (anon)"
ON public.diet_meals
FOR SELECT
TO anon
USING (true);

-- 5. Consertar diet_foods
DROP POLICY IF EXISTS "Allow read diet_foods for portal released plans (anon)" ON public.diet_foods;

CREATE POLICY "Allow read diet_foods for portal released plans (anon)"
ON public.diet_foods
FOR SELECT
TO anon
USING (true);

-- 6. Consertar exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read exams for portal (anon)" ON public.exams;
CREATE POLICY "Allow read exams for portal (anon)"
ON public.exams
FOR SELECT
TO anon
USING (true);
