-- ===========================================================================
-- Comunidade (feed do aluno) — tabelas, RLS e RPCs SECURITY DEFINER
-- Modelo "meio-termo": escrita/leitura sempre via RPC que deriva o
-- trainer_user_id a partir do paciente (isolamento por treinador no servidor).
-- O cliente nunca escolhe em qual feed grava; o servidor deriva pelo paciente.
-- ===========================================================================

-- ---------- Tabelas ----------
create table if not exists public.community_posts (
  id                uuid primary key default gen_random_uuid(),
  trainer_user_id   uuid not null,
  author_patient_id uuid not null references public.patients(id) on delete cascade,
  content           text not null check (char_length(content) between 1 and 5000),
  image_url         text,
  category          text not null default 'geral',
  is_hidden         boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists idx_community_posts_trainer_created
  on public.community_posts (trainer_user_id, created_at desc);

create table if not exists public.community_comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.community_posts(id) on delete cascade,
  author_patient_id uuid not null references public.patients(id) on delete cascade,
  content           text not null check (char_length(content) between 1 and 2000),
  is_hidden         boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists idx_community_comments_post
  on public.community_comments (post_id, created_at);

create table if not exists public.community_reactions (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.community_posts(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  reaction_type text not null,
  created_at    timestamptz not null default now(),
  unique (post_id, patient_id, reaction_type)
);
create index if not exists idx_community_reactions_post
  on public.community_reactions (post_id);

create table if not exists public.community_reports (
  id                  uuid primary key default gen_random_uuid(),
  trainer_user_id     uuid not null,
  target_type         text not null check (target_type in ('post','comment')),
  target_id           uuid not null,
  reporter_patient_id uuid not null references public.patients(id) on delete cascade,
  reason              text,
  resolved            boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists idx_community_reports_trainer
  on public.community_reports (trainer_user_id, resolved);

-- ---------- RLS (bloqueado por padrao; acesso so via RPC SECURITY DEFINER / service_role) ----------
alter table public.community_posts    enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports  enable row level security;

-- ---------- Tipos de reacao permitidos ----------
create or replace function public._community_valid_reaction(p_type text)
returns boolean language sql immutable as $$
  select p_type in ('curtir','amei','forca','fogo','parabens','apoio');
$$;

-- ---------- Categorias permitidas (normaliza para 'geral' se invalida) ----------
create or replace function public._community_norm_category(p_cat text)
returns text language sql immutable as $$
  select case when p_cat in ('geral','treino','dieta','conquista','duvida') then p_cat else 'geral' end;
$$;

-- ---------- Criar post ----------
create or replace function public.community_create_post(
  p_patient_id uuid, p_content text, p_image_url text default null, p_category text default 'geral'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_trainer uuid; v_id uuid;
begin
  select pt.user_id into v_trainer from patients pt where pt.id = p_patient_id;
  if v_trainer is null then raise exception 'Paciente invalido'; end if;
  if p_content is null or btrim(p_content) = '' then raise exception 'Conteudo vazio'; end if;
  insert into community_posts (trainer_user_id, author_patient_id, content, image_url, category)
  values (v_trainer, p_patient_id, btrim(p_content), nullif(btrim(p_image_url),''), _community_norm_category(p_category))
  returning id into v_id;
  return v_id;
end; $$;

-- ---------- Excluir post (apenas autor) ----------
create or replace function public.community_delete_post(p_patient_id uuid, p_post_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  delete from community_posts where id = p_post_id and author_patient_id = p_patient_id;
  get diagnostics v_count = row_count;
  return v_count > 0;
end; $$;

-- ---------- Adicionar comentario ----------
create or replace function public.community_add_comment(
  p_patient_id uuid, p_post_id uuid, p_content text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_trainer uuid; v_post_trainer uuid; v_id uuid;
begin
  select pt.user_id into v_trainer from patients pt where pt.id = p_patient_id;
  if v_trainer is null then raise exception 'Paciente invalido'; end if;
  select p.trainer_user_id into v_post_trainer from community_posts p where p.id = p_post_id and not p.is_hidden;
  if v_post_trainer is null or v_post_trainer <> v_trainer then raise exception 'Post inacessivel'; end if;
  if p_content is null or btrim(p_content) = '' then raise exception 'Conteudo vazio'; end if;
  insert into community_comments (post_id, author_patient_id, content)
  values (p_post_id, p_patient_id, btrim(p_content))
  returning id into v_id;
  return v_id;
end; $$;

-- ---------- Excluir comentario (apenas autor) ----------
create or replace function public.community_delete_comment(p_patient_id uuid, p_comment_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  delete from community_comments where id = p_comment_id and author_patient_id = p_patient_id;
  get diagnostics v_count = row_count;
  return v_count > 0;
end; $$;

-- ---------- Alternar reacao (toggle). Retorna true se adicionou, false se removeu ----------
create or replace function public.community_toggle_reaction(
  p_patient_id uuid, p_post_id uuid, p_reaction_type text
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_trainer uuid; v_post_trainer uuid; v_count int;
begin
  if not _community_valid_reaction(p_reaction_type) then raise exception 'Reacao invalida'; end if;
  select pt.user_id into v_trainer from patients pt where pt.id = p_patient_id;
  if v_trainer is null then raise exception 'Paciente invalido'; end if;
  select p.trainer_user_id into v_post_trainer from community_posts p where p.id = p_post_id and not p.is_hidden;
  if v_post_trainer is null or v_post_trainer <> v_trainer then raise exception 'Post inacessivel'; end if;
  delete from community_reactions
   where post_id = p_post_id and patient_id = p_patient_id and reaction_type = p_reaction_type;
  get diagnostics v_count = row_count;
  if v_count > 0 then return false; end if;
  insert into community_reactions (post_id, patient_id, reaction_type)
  values (p_post_id, p_patient_id, p_reaction_type);
  return true;
end; $$;

-- ---------- Denunciar (post ou comentario) ----------
create or replace function public.community_report(
  p_patient_id uuid, p_target_type text, p_target_id uuid, p_reason text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_trainer uuid; v_target_trainer uuid; v_id uuid;
begin
  select pt.user_id into v_trainer from patients pt where pt.id = p_patient_id;
  if v_trainer is null then raise exception 'Paciente invalido'; end if;
  if p_target_type = 'post' then
    select p.trainer_user_id into v_target_trainer from community_posts p where p.id = p_target_id;
  elsif p_target_type = 'comment' then
    select p.trainer_user_id into v_target_trainer
      from community_comments c join community_posts p on p.id = c.post_id
      where c.id = p_target_id;
  else
    raise exception 'Tipo invalido';
  end if;
  if v_target_trainer is null or v_target_trainer <> v_trainer then raise exception 'Alvo inacessivel'; end if;
  insert into community_reports (trainer_user_id, target_type, target_id, reporter_patient_id, reason)
  values (v_trainer, p_target_type, p_target_id, p_patient_id, nullif(btrim(p_reason),''))
  returning id into v_id;
  return v_id;
end; $$;

-- ---------- Feed (isolado por treinador) ----------
create or replace function public.community_get_feed(
  p_patient_id uuid, p_category text default null, p_sort text default 'recent',
  p_limit int default 20, p_offset int default 0
) returns table (
  id uuid, author_patient_id uuid, author_name text, author_photo text,
  content text, image_url text, category text, created_at timestamptz,
  reactions jsonb, my_reactions text[], comment_count int, is_own boolean
)
language plpgsql security definer set search_path = public as $$
declare v_trainer uuid;
begin
  select pt.user_id into v_trainer from patients pt where pt.id = p_patient_id;
  if v_trainer is null then return; end if;
  return query
  select p.id, p.author_patient_id,
         coalesce(a.apelido, a.nome, 'Paciente') as author_name,
         a.foto_perfil as author_photo,
         p.content, p.image_url, p.category, p.created_at,
         coalesce((select jsonb_object_agg(t.reaction_type, t.cnt)
                   from (select reaction_type, count(*) cnt from community_reactions r
                         where r.post_id = p.id group by reaction_type) t), '{}'::jsonb) as reactions,
         coalesce((select array_agg(r2.reaction_type) from community_reactions r2
                   where r2.post_id = p.id and r2.patient_id = p_patient_id), '{}') as my_reactions,
         (select count(*)::int from community_comments c where c.post_id = p.id and not c.is_hidden) as comment_count,
         (p.author_patient_id = p_patient_id) as is_own
  from community_posts p
  join patients a on a.id = p.author_patient_id
  where p.trainer_user_id = v_trainer
    and not p.is_hidden
    and (p_category is null or p_category = 'all' or p.category = p_category)
  order by
    case when p_sort = 'popular' then
      ((select count(*) from community_reactions r where r.post_id = p.id)
       + (select count(*) from community_comments c where c.post_id = p.id and not c.is_hidden))
    else null end desc nulls last,
    p.created_at desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end; $$;

-- ---------- Comentarios de um post ----------
create or replace function public.community_get_comments(p_patient_id uuid, p_post_id uuid)
returns table (
  id uuid, author_patient_id uuid, author_name text, author_photo text,
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
  select c.id, c.author_patient_id,
         coalesce(a.apelido, a.nome, 'Paciente') as author_name,
         a.foto_perfil as author_photo,
         c.content, c.created_at,
         (c.author_patient_id = p_patient_id) as is_own
  from community_comments c
  join patients a on a.id = c.author_patient_id
  where c.post_id = p_post_id and not c.is_hidden
  order by c.created_at asc;
end; $$;

-- ---------- Grants (portal anonimo) ----------
grant execute on function public.community_create_post(uuid, text, text, text)   to anon, authenticated;
grant execute on function public.community_delete_post(uuid, uuid)               to anon, authenticated;
grant execute on function public.community_add_comment(uuid, uuid, text)         to anon, authenticated;
grant execute on function public.community_delete_comment(uuid, uuid)            to anon, authenticated;
grant execute on function public.community_toggle_reaction(uuid, uuid, text)     to anon, authenticated;
grant execute on function public.community_report(uuid, text, uuid, text)        to anon, authenticated;
grant execute on function public.community_get_feed(uuid, text, text, int, int)  to anon, authenticated;
grant execute on function public.community_get_comments(uuid, uuid)              to anon, authenticated;
