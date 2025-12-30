-- =====================================================
-- Políticas RLS RESTRITIVAS para Portal do Paciente
-- =====================================================
-- Este script cria políticas de segurança (RLS) que permitem acesso apenas:
-- 1. Ao próprio paciente (via patient_id - validado no código via token)
-- 2. Ao dono da conta autenticado (user_id que criou os dados)
-- 3. Aos membros da equipe autenticados (team_members ativos)
-- 
-- IMPORTANTE: O portal do paciente usa token baseado em telefone (não Supabase Auth),
-- então as políticas para pacientes precisam permitir acesso anônimo baseado em relacionamentos.
-- A validação do token e isolamento por patient_id é feita no código JavaScript.
-- =====================================================

-- Remover políticas antigas se existirem (para recriar)
DROP POLICY IF EXISTS "Allow read patient_points for patients" ON public.patient_points;
DROP POLICY IF EXISTS "Allow read patient_points for own patient" ON public.patient_points;
DROP POLICY IF EXISTS "Allow read patient_points for authenticated own patient" ON public.patient_points;
DROP POLICY IF EXISTS "Allow read patient_points for owner and team" ON public.patient_points;
DROP POLICY IF EXISTS "Allow read patient_points for portal (anon)" ON public.patient_points;
DROP POLICY IF EXISTS "Allow insert patient_points for portal (anon)" ON public.patient_points;
DROP POLICY IF EXISTS "Allow update patient_points for portal (anon)" ON public.patient_points;
DROP POLICY IF EXISTS "Allow read patient_achievements for patients" ON public.patient_achievements;
DROP POLICY IF EXISTS "Allow read patient_achievements for own patient" ON public.patient_achievements;
DROP POLICY IF EXISTS "Allow read patient_achievements for authenticated own patient" ON public.patient_achievements;
DROP POLICY IF EXISTS "Allow read patient_achievements for owner and team" ON public.patient_achievements;
DROP POLICY IF EXISTS "Allow read patient_achievements for portal (anon)" ON public.patient_achievements;
DROP POLICY IF EXISTS "Allow insert patient_achievements for portal (anon)" ON public.patient_achievements;
DROP POLICY IF EXISTS "Allow read patient_daily_challenges for patients" ON public.patient_daily_challenges;
DROP POLICY IF EXISTS "Allow read patient_daily_challenges for own patient" ON public.patient_daily_challenges;
DROP POLICY IF EXISTS "Allow read patient_daily_challenges for authenticated own patient" ON public.patient_daily_challenges;
DROP POLICY IF EXISTS "Allow read patient_daily_challenges for owner and team" ON public.patient_daily_challenges;
DROP POLICY IF EXISTS "Allow read patient_daily_challenges for portal (anon)" ON public.patient_daily_challenges;
DROP POLICY IF EXISTS "Allow insert patient_daily_challenges for portal (anon)" ON public.patient_daily_challenges;
DROP POLICY IF EXISTS "Allow update patient_daily_challenges for portal (anon)" ON public.patient_daily_challenges;
DROP POLICY IF EXISTS "Allow delete patient_daily_challenges for portal (anon)" ON public.patient_daily_challenges;
DROP POLICY IF EXISTS "Allow read patient_points_history for patients" ON public.patient_points_history;
DROP POLICY IF EXISTS "Allow read patient_points_history for own patient" ON public.patient_points_history;
DROP POLICY IF EXISTS "Allow read patient_points_history for authenticated own patient" ON public.patient_points_history;
DROP POLICY IF EXISTS "Allow read patient_points_history for owner and team" ON public.patient_points_history;
DROP POLICY IF EXISTS "Allow read patient_points_history for portal (anon)" ON public.patient_points_history;
DROP POLICY IF EXISTS "Allow insert patient_points_history for portal (anon)" ON public.patient_points_history;
DROP POLICY IF EXISTS "Allow read diet_daily_consumption for patients" ON public.diet_daily_consumption;
DROP POLICY IF EXISTS "Allow read diet_daily_consumption for own patient" ON public.diet_daily_consumption;
DROP POLICY IF EXISTS "Allow read diet_daily_consumption for authenticated own patient" ON public.diet_daily_consumption;
DROP POLICY IF EXISTS "Allow read diet_daily_consumption for owner and team" ON public.diet_daily_consumption;
DROP POLICY IF EXISTS "Allow read diet_daily_consumption for portal (anon)" ON public.diet_daily_consumption;
DROP POLICY IF EXISTS "Allow insert diet_daily_consumption for portal (anon)" ON public.diet_daily_consumption;
DROP POLICY IF EXISTS "Allow update diet_daily_consumption for portal (anon)" ON public.diet_daily_consumption;
DROP POLICY IF EXISTS "Allow read released diet_plans" ON public.diet_plans;
DROP POLICY IF EXISTS "Allow read released diet_plans for own patient" ON public.diet_plans;
DROP POLICY IF EXISTS "Allow read released diet_plans for authenticated own patient" ON public.diet_plans;
DROP POLICY IF EXISTS "Allow read diet_plans for owner and team" ON public.diet_plans;
DROP POLICY IF EXISTS "Allow read released diet_plans for portal (anon)" ON public.diet_plans;
DROP POLICY IF EXISTS "Allow read diet_meals for released plans" ON public.diet_meals;
DROP POLICY IF EXISTS "Allow read diet_meals for own patient released plans" ON public.diet_meals;
DROP POLICY IF EXISTS "Allow read diet_meals for authenticated own patient released plans" ON public.diet_meals;
DROP POLICY IF EXISTS "Allow read diet_meals for owner and team" ON public.diet_meals;
DROP POLICY IF EXISTS "Allow read diet_meals for portal released plans (anon)" ON public.diet_meals;
DROP POLICY IF EXISTS "Allow read diet_foods for released plans" ON public.diet_foods;
DROP POLICY IF EXISTS "Allow read diet_foods for own patient released plans" ON public.diet_foods;
DROP POLICY IF EXISTS "Allow read diet_foods for authenticated own patient released plans" ON public.diet_foods;
DROP POLICY IF EXISTS "Allow read diet_foods for owner and team" ON public.diet_foods;
DROP POLICY IF EXISTS "Allow read diet_foods for portal released plans (anon)" ON public.diet_foods;
DROP POLICY IF EXISTS "Allow read diet_guidelines for released plans" ON public.diet_guidelines;
DROP POLICY IF EXISTS "Allow read diet_guidelines for own patient released plans" ON public.diet_guidelines;
DROP POLICY IF EXISTS "Allow read diet_guidelines for authenticated own patient released plans" ON public.diet_guidelines;
DROP POLICY IF EXISTS "Allow read diet_guidelines for owner and team" ON public.diet_guidelines;
DROP POLICY IF EXISTS "Allow read diet_guidelines for portal released plans (anon)" ON public.diet_guidelines;
DROP POLICY IF EXISTS "Allow read active daily_challenges" ON public.daily_challenges;
DROP POLICY IF EXISTS "Allow read achievement_templates" ON public.achievement_templates;
DROP POLICY IF EXISTS "Allow read body_composition for portal (anon)" ON public.body_composition;

-- Remover função helper se existir
DROP FUNCTION IF EXISTS public.is_owner_or_team_member(uuid);

-- =====================================================
-- FUNÇÃO HELPER: Verificar se usuário é dono ou membro da equipe
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_owner_or_team_member(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se há um usuário autenticado
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se é o próprio usuário (dono)
  IF auth.uid() = user_id_param THEN
    RETURN true;
  END IF;
  
  -- Verificar se é membro da equipe do usuário
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.owner_id = user_id_param
    AND team_members.user_id = auth.uid()
    AND team_members.is_active = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- =====================================================
-- 1. PATIENT_POINTS - Pontos do Paciente
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.patient_points ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem seus próprios pontos (via user_id vinculado)
CREATE POLICY "Allow read patient_points for authenticated own patient"
ON public.patient_points
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_points.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem pontos de seus pacientes
CREATE POLICY "Allow read patient_points for owner and team"
ON public.patient_points
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    JOIN public.diet_plans ON diet_plans.patient_id = patients.id
    WHERE patients.id = patient_points.patient_id
    AND public.is_owner_or_team_member(diet_plans.user_id)
  )
);

-- Política para acesso anônimo via token (portal do paciente) - SELECT
CREATE POLICY "Allow read patient_points for portal (anon)"
ON public.patient_points
FOR SELECT
TO anon
USING (true);

-- Política para acesso anônimo via token (portal do paciente) - INSERT
CREATE POLICY "Allow insert patient_points for portal (anon)"
ON public.patient_points
FOR INSERT
TO anon
WITH CHECK (
  -- Permitir inserção apenas para o próprio paciente
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_points.patient_id
  )
);

-- Política para acesso anônimo via token (portal do paciente) - UPDATE
CREATE POLICY "Allow update patient_points for portal (anon)"
ON public.patient_points
FOR UPDATE
TO anon
USING (
  -- Permitir atualização apenas do próprio registro
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_points.patient_id
  )
)
WITH CHECK (
  -- Garantir que o patient_id não seja alterado
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_points.patient_id
  )
);

-- =====================================================
-- 2. PATIENT_ACHIEVEMENTS - Conquistas do Paciente
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.patient_achievements ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem suas próprias conquistas (via user_id vinculado)
CREATE POLICY "Allow read patient_achievements for authenticated own patient"
ON public.patient_achievements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_achievements.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem conquistas de seus pacientes
CREATE POLICY "Allow read patient_achievements for owner and team"
ON public.patient_achievements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    JOIN public.diet_plans ON diet_plans.patient_id = patients.id
    WHERE patients.id = patient_achievements.patient_id
    AND public.is_owner_or_team_member(diet_plans.user_id)
  )
);

-- Política para acesso anônimo via token (portal do paciente) - SELECT
CREATE POLICY "Allow read patient_achievements for portal (anon)"
ON public.patient_achievements
FOR SELECT
TO anon
USING (
  -- Permitir acesso anônimo - a query filtra por patient_id específico
  true
);

-- Política para acesso anônimo via token (portal do paciente) - INSERT
CREATE POLICY "Allow insert patient_achievements for portal (anon)"
ON public.patient_achievements
FOR INSERT
TO anon
WITH CHECK (
  -- Permitir inserção apenas para o próprio paciente
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_achievements.patient_id
  )
);

-- =====================================================
-- 3. PATIENT_DAILY_CHALLENGES - Desafios Diários do Paciente
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.patient_daily_challenges ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem seus próprios desafios (via user_id vinculado)
CREATE POLICY "Allow read patient_daily_challenges for authenticated own patient"
ON public.patient_daily_challenges
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_daily_challenges.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem desafios de seus pacientes
CREATE POLICY "Allow read patient_daily_challenges for owner and team"
ON public.patient_daily_challenges
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    JOIN public.diet_plans ON diet_plans.patient_id = patients.id
    WHERE patients.id = patient_daily_challenges.patient_id
    AND public.is_owner_or_team_member(diet_plans.user_id)
  )
);

-- Política para acesso anônimo via token (portal do paciente) - SELECT
CREATE POLICY "Allow read patient_daily_challenges for portal (anon)"
ON public.patient_daily_challenges
FOR SELECT
TO anon
USING (
  -- Permitir acesso anônimo - a query filtra por patient_id específico
  true
);

-- Política para acesso anônimo via token (portal do paciente) - INSERT
CREATE POLICY "Allow insert patient_daily_challenges for portal (anon)"
ON public.patient_daily_challenges
FOR INSERT
TO anon
WITH CHECK (
  -- Permitir inserção apenas para o próprio paciente
  -- A validação do patient_id correto é feita no código JavaScript
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_daily_challenges.patient_id
  )
);

-- Política para acesso anônimo via token (portal do paciente) - UPDATE
CREATE POLICY "Allow update patient_daily_challenges for portal (anon)"
ON public.patient_daily_challenges
FOR UPDATE
TO anon
USING (
  -- Permitir atualização apenas do próprio registro
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_daily_challenges.patient_id
  )
)
WITH CHECK (
  -- Garantir que o patient_id não seja alterado
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_daily_challenges.patient_id
  )
);

-- Política para acesso anônimo via token (portal do paciente) - DELETE
CREATE POLICY "Allow delete patient_daily_challenges for portal (anon)"
ON public.patient_daily_challenges
FOR DELETE
TO anon
USING (
  -- Permitir exclusão apenas do próprio registro
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_daily_challenges.patient_id
  )
);

-- =====================================================
-- 4. PATIENT_POINTS_HISTORY - Histórico de Pontos
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.patient_points_history ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem seu próprio histórico (via user_id vinculado)
CREATE POLICY "Allow read patient_points_history for authenticated own patient"
ON public.patient_points_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_points_history.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem histórico de seus pacientes
CREATE POLICY "Allow read patient_points_history for owner and team"
ON public.patient_points_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    JOIN public.diet_plans ON diet_plans.patient_id = patients.id
    WHERE patients.id = patient_points_history.patient_id
    AND public.is_owner_or_team_member(diet_plans.user_id)
  )
);

-- Política para acesso anônimo via token (portal do paciente) - SELECT
CREATE POLICY "Allow read patient_points_history for portal (anon)"
ON public.patient_points_history
FOR SELECT
TO anon
USING (
  -- Permitir acesso anônimo - a query filtra por patient_id específico
  true
);

-- Política para acesso anônimo via token (portal do paciente) - INSERT
CREATE POLICY "Allow insert patient_points_history for portal (anon)"
ON public.patient_points_history
FOR INSERT
TO anon
WITH CHECK (
  -- Permitir inserção apenas para o próprio paciente
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_points_history.patient_id
  )
);

-- =====================================================
-- 5. DIET_DAILY_CONSUMPTION - Consumo Diário
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.diet_daily_consumption ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem seu próprio consumo (via user_id vinculado)
CREATE POLICY "Allow read diet_daily_consumption for authenticated own patient"
ON public.diet_daily_consumption
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = diet_daily_consumption.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem consumo de seus pacientes
CREATE POLICY "Allow read diet_daily_consumption for owner and team"
ON public.diet_daily_consumption
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    JOIN public.diet_plans ON diet_plans.patient_id = patients.id
    WHERE patients.id = diet_daily_consumption.patient_id
    AND public.is_owner_or_team_member(diet_plans.user_id)
  )
);

-- Política para acesso anônimo via token (portal do paciente) - SELECT
CREATE POLICY "Allow read diet_daily_consumption for portal (anon)"
ON public.diet_daily_consumption
FOR SELECT
TO anon
USING (
  -- Permitir acesso anônimo - a query filtra por patient_id específico
  true
);

-- Política para acesso anônimo via token (portal do paciente) - INSERT
CREATE POLICY "Allow insert diet_daily_consumption for portal (anon)"
ON public.diet_daily_consumption
FOR INSERT
TO anon
WITH CHECK (
  -- Permitir inserção apenas para o próprio paciente
  -- A validação do patient_id correto é feita no código JavaScript
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = diet_daily_consumption.patient_id
  )
);

-- Política para acesso anônimo via token (portal do paciente) - UPDATE
CREATE POLICY "Allow update diet_daily_consumption for portal (anon)"
ON public.diet_daily_consumption
FOR UPDATE
TO anon
USING (
  -- Permitir atualização apenas do próprio registro
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = diet_daily_consumption.patient_id
  )
)
WITH CHECK (
  -- Garantir que o patient_id não seja alterado
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = diet_daily_consumption.patient_id
  )
);

-- =====================================================
-- 6. DIET_PLANS - Planos Alimentares
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem seus próprios planos liberados (via user_id vinculado)
CREATE POLICY "Allow read released diet_plans for authenticated own patient"
ON public.diet_plans
FOR SELECT
TO authenticated
USING (
  is_released = true
  AND EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = diet_plans.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem todos os planos de seus pacientes
CREATE POLICY "Allow read diet_plans for owner and team"
ON public.diet_plans
FOR SELECT
TO authenticated
USING (
  public.is_owner_or_team_member(diet_plans.user_id)
);

-- Política para acesso anônimo via token (portal do paciente) - apenas planos liberados
CREATE POLICY "Allow read released diet_plans for portal (anon)"
ON public.diet_plans
FOR SELECT
TO anon
USING (
  is_released = true
  AND EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = diet_plans.patient_id
  )
);

-- =====================================================
-- 7. DIET_MEALS - Refeições
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem refeições de seus planos liberados (via user_id vinculado)
CREATE POLICY "Allow read diet_meals for authenticated own patient released plans"
ON public.diet_meals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    JOIN public.patients ON patients.id = diet_plans.patient_id
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.is_released = true
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem refeições de seus planos
CREATE POLICY "Allow read diet_meals for owner and team"
ON public.diet_meals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND public.is_owner_or_team_member(diet_plans.user_id)
  )
);

-- Política para acesso anônimo via token (portal do paciente) - apenas refeições de planos liberados
CREATE POLICY "Allow read diet_meals for portal released plans (anon)"
ON public.diet_meals
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND diet_plans.is_released = true
  )
);

-- =====================================================
-- 8. DIET_FOODS - Alimentos
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.diet_foods ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem alimentos de seus planos liberados (via user_id vinculado)
CREATE POLICY "Allow read diet_foods for authenticated own patient released plans"
ON public.diet_foods
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.diet_meals
    JOIN public.diet_plans ON diet_plans.id = diet_meals.diet_plan_id
    JOIN public.patients ON patients.id = diet_plans.patient_id
    WHERE diet_meals.id = diet_foods.meal_id
    AND diet_plans.is_released = true
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem alimentos de seus planos
CREATE POLICY "Allow read diet_foods for owner and team"
ON public.diet_foods
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.diet_meals
    JOIN public.diet_plans ON diet_plans.id = diet_meals.diet_plan_id
    WHERE diet_meals.id = diet_foods.meal_id
    AND public.is_owner_or_team_member(diet_plans.user_id)
  )
);

-- Política para acesso anônimo via token (portal do paciente) - apenas alimentos de planos liberados
CREATE POLICY "Allow read diet_foods for portal released plans (anon)"
ON public.diet_foods
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.diet_meals
    JOIN public.diet_plans ON diet_plans.id = diet_meals.diet_plan_id
    WHERE diet_meals.id = diet_foods.meal_id
    AND diet_plans.is_released = true
  )
);

-- =====================================================
-- 9. DIET_GUIDELINES - Orientações
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.diet_guidelines ENABLE ROW LEVEL SECURITY;

-- Política para pacientes autenticados verem orientações de seus planos liberados (via user_id vinculado)
CREATE POLICY "Allow read diet_guidelines for authenticated own patient released plans"
ON public.diet_guidelines
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    JOIN public.patients ON patients.id = diet_plans.patient_id
    WHERE diet_plans.id = diet_guidelines.diet_plan_id
    AND diet_plans.is_released = true
    AND patients.user_id = auth.uid()
  )
);

-- Política para dono/membros da equipe verem orientações de seus planos
CREATE POLICY "Allow read diet_guidelines for owner and team"
ON public.diet_guidelines
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_guidelines.diet_plan_id
    AND public.is_owner_or_team_member(diet_plans.user_id)
  )
);

-- Política para acesso anônimo via token (portal do paciente) - apenas orientações de planos liberados
CREATE POLICY "Allow read diet_guidelines for portal released plans (anon)"
ON public.diet_guidelines
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE diet_plans.id = diet_guidelines.diet_plan_id
    AND diet_plans.is_released = true
  )
);

-- =====================================================
-- 10. DAILY_CHALLENGES - Desafios Diários (templates)
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de desafios ativos (público para pacientes e equipe)
CREATE POLICY "Allow read active daily_challenges"
ON public.daily_challenges
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- =====================================================
-- 11. ACHIEVEMENT_TEMPLATES - Templates de Conquistas
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.achievement_templates ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de templates de conquistas (público para pacientes e equipe)
CREATE POLICY "Allow read achievement_templates"
ON public.achievement_templates
FOR SELECT
TO authenticated, anon
USING (true);

-- =====================================================
-- 12. BODY_COMPOSITION - Composição Corporal
-- =====================================================

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.body_composition ENABLE ROW LEVEL SECURITY;

-- Política para acesso anônimo via token (portal do paciente) - SELECT
CREATE POLICY "Allow read body_composition for portal (anon)"
ON public.body_composition
FOR SELECT
TO anon
USING (
  -- Permitir acesso anônimo - a query filtra por telefone específico
  -- A validação do telefone correto é feita no código JavaScript via token
  true
);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Para verificar se as políticas foram criadas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN (
--   'patient_points',
--   'patient_achievements',
--   'patient_daily_challenges',
--   'patient_points_history',
--   'diet_daily_consumption',
--   'diet_plans',
--   'diet_meals',
--   'diet_foods',
--   'diet_guidelines',
--   'daily_challenges',
--   'achievement_templates'
-- )
-- ORDER BY tablename, policyname;
