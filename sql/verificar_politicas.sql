-- =====================================================
-- Script para VERIFICAR se as políticas RLS foram criadas
-- =====================================================
-- Execute este script no Supabase SQL Editor para verificar
-- se as políticas foram criadas corretamente
-- =====================================================

-- Verificar políticas da tabela patient_points
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'patient_points'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'patient_points';

-- Verificar todas as políticas relacionadas ao portal
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'patient_points',
  'patient_achievements',
  'patient_daily_challenges',
  'patient_points_history',
  'diet_daily_consumption',
  'diet_plans',
  'diet_meals',
  'diet_foods',
  'diet_guidelines'
)
ORDER BY tablename, policyname;

