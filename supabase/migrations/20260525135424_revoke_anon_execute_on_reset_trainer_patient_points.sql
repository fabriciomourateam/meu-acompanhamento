-- Supabase default concede EXECUTE pra anon em funções public; revogamos
-- porque a função é SECURITY DEFINER. Posteriormente reconcedido em
-- 20260525142945 ao alinharmos com o modelo PIN-based do admin (que opera
-- como anon).

REVOKE EXECUTE ON FUNCTION public.reset_trainer_patient_points(uuid) FROM anon;
NOTIFY pgrst, 'reload schema';
