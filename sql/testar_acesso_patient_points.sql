-- =====================================================
-- TESTAR ACESSO À TABELA patient_points
-- =====================================================
-- Este script testa se há dados e se as políticas permitem acesso
-- =====================================================

-- 1. Verificar se há registro de pontos para este paciente
SELECT *
FROM public.patient_points
WHERE patient_id = '0fb9f5a7-1599-46e1-b3b4-7dfb13145657';

-- 2. Se não houver registro, criar um para teste
-- (Execute apenas se o SELECT acima não retornar nada)
INSERT INTO public.patient_points (
  patient_id,
  total_points,
  points_diet,
  points_consistency,
  points_achievements,
  current_level,
  total_days_tracked,
  current_streak,
  longest_streak
)
VALUES (
  '0fb9f5a7-1599-46e1-b3b4-7dfb13145657',
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0
)
ON CONFLICT (patient_id) DO NOTHING;

-- 3. Verificar novamente após criar
SELECT *
FROM public.patient_points
WHERE patient_id = '0fb9f5a7-1599-46e1-b3b4-7dfb13145657';

-- 4. Verificar políticas ativas
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'patient_points'
ORDER BY policyname;

