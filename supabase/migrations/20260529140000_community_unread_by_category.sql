-- Conta posts novos por categoria desde p_since (exclui os do proprio aluno e ocultos).
-- Usado para exibir contadores de "novos desde a ultima visita" nos chips de categoria.
create or replace function public.community_unread_by_category(p_patient_id uuid, p_since timestamptz)
returns table (category text, cnt bigint)
language plpgsql security definer set search_path = public as $$
declare v_trainer uuid;
begin
  select pt.user_id into v_trainer from patients pt where pt.id = p_patient_id;
  if v_trainer is null then return; end if;
  return query
  select p.category, count(*)::bigint
  from community_posts p
  where p.trainer_user_id = v_trainer
    and not p.is_hidden
    and p.author_patient_id <> p_patient_id
    and p.created_at > p_since
  group by p.category;
end; $$;

grant execute on function public.community_unread_by_category(uuid, timestamptz) to anon, authenticated;
