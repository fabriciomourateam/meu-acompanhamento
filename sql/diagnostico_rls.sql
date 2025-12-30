-- =====================================================
-- DIAGNÓSTICO RLS - Verificar se políticas foram criadas
-- =====================================================
-- Execute este script no Supabase SQL Editor para diagnosticar
-- =====================================================

-- 1. Verificar se RLS está habilitado na tabela patient_points
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'patient_points';

-- 2. Verificar TODAS as políticas da tabela patient_points
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'patient_points'
ORDER BY policyname;

-- 3. Verificar se a política anônima existe
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'patient_points'
AND 'anon' = ANY(roles);

-- 4. Testar se há dados na tabela
SELECT COUNT(*) as total_registros
FROM public.patient_points;

-- 5. Verificar se existe registro para o patient_id específico
SELECT COUNT(*) as registros_para_paciente
FROM public.patient_points
WHERE patient_id = '0fb9f5a7-1599-46e1-b3b4-7dfb13145657';

-- 6. Verificar se o paciente existe
SELECT id, nome, telefone, user_id
FROM public.patients
WHERE id = '0fb9f5a7-1599-46e1-b3b4-7dfb13145657';

