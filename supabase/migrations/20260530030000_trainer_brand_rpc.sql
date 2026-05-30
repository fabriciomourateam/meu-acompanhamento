-- Marca personalizada do treinador (logo / cor / frase) editável pelo /admin.
-- O /admin é PIN-based (sem sessão Supabase auth) e a tabela `profiles` não tem
-- policy de UPDATE para o cliente. Seguindo o mesmo modelo das RPCs de Comunidade
-- e Pontos, expomos uma função SECURITY DEFINER que recebe o uid do treinador e
-- grava os campos de marca em nome dele.

-- Leitura: já existe policy pública de SELECT em profiles, então a tela de login
-- (anon) consegue ler brand_logo_url/brand_primary_color/brand_tagline.

create or replace function public.update_trainer_brand(
  p_trainer_id uuid,
  p_logo_url text,
  p_primary_color text,
  p_tagline text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_trainer_id is null then
    raise exception 'trainer_id obrigatório';
  end if;

  update public.profiles
     set brand_logo_url      = nullif(trim(coalesce(p_logo_url, '')), ''),
         brand_primary_color = nullif(trim(coalesce(p_primary_color, '')), ''),
         brand_tagline       = nullif(trim(coalesce(p_tagline, '')), '')
   where id = p_trainer_id;

  if not found then
    raise exception 'treinador não encontrado';
  end if;
end;
$$;

-- O cliente (anon, como o resto do /admin) precisa poder chamar.
grant execute on function public.update_trainer_brand(uuid, text, text, text) to anon, authenticated;
