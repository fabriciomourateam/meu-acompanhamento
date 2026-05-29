-- ===========================================================================
-- Comunidade fase 2: comentarios aninhados (1 nivel) + moderacao pelo treinador
-- ===========================================================================

alter table public.community_comments
  add column if not exists parent_comment_id uuid references public.community_comments(id) on delete cascade;
create index if not exists idx_community_comments_parent
  on public.community_comments (parent_comment_id);

-- add_comment passa a aceitar parent_comment_id (resposta a um comentario raiz)
drop function if exists public.community_add_comment(uuid, uuid, text);
create or replace function public.community_add_comment(
  p_patient_id uuid, p_post_id uuid, p_content text, p_parent_comment_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_trainer uuid; v_post_trainer uuid; v_parent_post uuid; v_parent_parent uuid; v_id uuid;
begin
  select pt.user_id into v_trainer from patients pt where pt.id = p_patient_id;
  if v_trainer is null then raise exception 'Paciente invalido'; end if;
  select p.trainer_user_id into v_post_trainer from community_posts p where p.id = p_post_id and not p.is_hidden;
  if v_post_trainer is null or v_post_trainer <> v_trainer then raise exception 'Post inacessivel'; end if;
  if p_content is null or btrim(p_content) = '' then raise exception 'Conteudo vazio'; end if;
  if p_parent_comment_id is not null then
    -- pai deve pertencer ao mesmo post e ser um comentario raiz (limita a 1 nivel)
    select c.post_id, c.parent_comment_id into v_parent_post, v_parent_parent
      from community_comments c where c.id = p_parent_comment_id and not c.is_hidden;
    if v_parent_post is null or v_parent_post <> p_post_id then raise exception 'Comentario pai invalido'; end if;
    if v_parent_parent is not null then raise exception 'Respostas aninhadas alem de 1 nivel nao sao permitidas'; end if;
  end if;
  insert into community_comments (post_id, author_patient_id, content, parent_comment_id)
  values (p_post_id, p_patient_id, btrim(p_content), p_parent_comment_id)
  returning id into v_id;
  return v_id;
end; $$;

-- get_comments passa a retornar parent_comment_id
drop function if exists public.community_get_comments(uuid, uuid);
create or replace function public.community_get_comments(p_patient_id uuid, p_post_id uuid)
returns table (
  id uuid, parent_comment_id uuid, author_patient_id uuid, author_name text, author_photo text,
  content text, created_at timestamptz, is_own boolean
)
language plpgsql security definer set search_path = public as $$
declare v_trainer uuid; v_post_trainer uuid;
begin
  select pt.user_id into v_trainer from patients pt where pt.id = p_patient_id;
  if v_trainer is null then return; end if;
  select p.trainer_user_id into v_post_trainer from community_posts p where p.id = p_post_id and not p.is_hidden;
  if v_post_trainer is null or v_post_trainer <> v_trainer then return; end if;
  return query
  select c.id, c.parent_comment_id, c.author_patient_id,
         coalesce(a.apelido, a.nome, 'Paciente') as author_name,
         a.foto_perfil as author_photo,
         c.content, c.created_at,
         (c.author_patient_id = p_patient_id) as is_own
  from community_comments c
  join patients a on a.id = c.author_patient_id
  where c.post_id = p_post_id and not c.is_hidden
  order by c.created_at asc;
end; $$;

-- ---------- Moderacao (treinador via /admin) ----------
-- Mesmo modelo de confianca do /admin (anon + PIN client-side); escopado por treinador.
create or replace function public.community_list_reports(p_trainer_user_id uuid, p_only_open boolean default true)
returns table (
  report_id uuid, target_type text, target_id uuid, reason text, resolved boolean,
  reporter_name text, created_at timestamptz, target_content text, target_is_hidden boolean,
  target_author_name text
)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select r.id, r.target_type, r.target_id, r.reason, r.resolved,
         coalesce(rep.apelido, rep.nome, 'Paciente') as reporter_name,
         r.created_at,
         case when r.target_type = 'post'
              then (select p.content from community_posts p where p.id = r.target_id)
              else (select c.content from community_comments c where c.id = r.target_id) end as target_content,
         case when r.target_type = 'post'
              then (select p.is_hidden from community_posts p where p.id = r.target_id)
              else (select c.is_hidden from community_comments c where c.id = r.target_id) end as target_is_hidden,
         case when r.target_type = 'post'
              then (select coalesce(pa.apelido, pa.nome, 'Paciente') from community_posts p join patients pa on pa.id = p.author_patient_id where p.id = r.target_id)
              else (select coalesce(ca.apelido, ca.nome, 'Paciente') from community_comments c join patients ca on ca.id = c.author_patient_id where c.id = r.target_id) end as target_author_name
  from community_reports r
  join patients rep on rep.id = r.reporter_patient_id
  where r.trainer_user_id = p_trainer_user_id
    and (not p_only_open or not r.resolved)
  order by r.created_at desc;
end; $$;

-- Ocultar/reexibir post ou comentario (escopado ao treinador)
create or replace function public.community_moderate_set_hidden(
  p_trainer_user_id uuid, p_target_type text, p_target_id uuid, p_hidden boolean
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if p_target_type = 'post' then
    update community_posts set is_hidden = p_hidden
     where id = p_target_id and trainer_user_id = p_trainer_user_id;
  elsif p_target_type = 'comment' then
    update community_comments c set is_hidden = p_hidden
     from community_posts p
     where c.id = p_target_id and p.id = c.post_id and p.trainer_user_id = p_trainer_user_id;
  else
    raise exception 'Tipo invalido';
  end if;
  get diagnostics v_count = row_count;
  return v_count > 0;
end; $$;

-- Marcar denuncia como resolvida
create or replace function public.community_resolve_report(p_trainer_user_id uuid, p_report_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  update community_reports set resolved = true
   where id = p_report_id and trainer_user_id = p_trainer_user_id;
  get diagnostics v_count = row_count;
  return v_count > 0;
end; $$;

-- ---------- Grants ----------
grant execute on function public.community_add_comment(uuid, uuid, text, uuid)            to anon, authenticated;
grant execute on function public.community_get_comments(uuid, uuid)                        to anon, authenticated;
grant execute on function public.community_list_reports(uuid, boolean)                     to anon, authenticated;
grant execute on function public.community_moderate_set_hidden(uuid, text, uuid, boolean)  to anon, authenticated;
grant execute on function public.community_resolve_report(uuid, uuid)                      to anon, authenticated;
