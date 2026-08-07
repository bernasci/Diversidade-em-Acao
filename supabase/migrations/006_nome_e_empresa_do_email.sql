-- ===========================================================================
-- 006_nome_e_empresa_do_email.sql
--
-- O banco passa a deduzir nome e empresa a partir do e-mail:
--
--     daniel.alves@dome.services  →  Daniel Alves   ·  DOME
--     ana.paula.souza@prumo.com.br →  Ana Paula Souza · Prumo
--
-- Assim a lista do RH pode ser uma coluna só — a de e-mails — e ainda assim o
-- ranking mostra gente com nome e empresa.
--
-- A DEDUÇÃO É FALLBACK, NÃO REGRA. Se a lista trouxer nome ou empresa, eles
-- ganham. Não é preciosismo: e-mail não carrega acento, e é assim que
-- "joao.goncalves@" viraria "Joao Goncalves" para sempre, na tela e no
-- certificado. Quando o RH mandar a planilha com os nomes de verdade, uma
-- reimportação corrige todo mundo no acesso seguinte.
--
-- Rode depois da 005.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- NOME A PARTIR DA PARTE LOCAL DO E-MAIL.
--
-- "daniel.alves"        → Daniel Alves
-- "maria.da.silva"      → Maria da Silva      (partículas ficam minúsculas)
-- "ana_paula-souza"     → Ana Paula Souza     (., _ e - separam igual)
-- "daniel.alves+teste"  → Daniel Alves        (sufixo +tag descartado)
-- "rh2024"              → NULL                (só dígito/lixo: melhor nada)
--
-- `with ordinality` não é enfeite: sem ele a ordem das partes depende do
-- planejador, e "Daniel Alves" pode sair "Alves Daniel".
-- ---------------------------------------------------------------------------
create or replace function public.nome_do_email(email text)
returns text
language sql
immutable
as $$
  with partes as (
    select p, n
    from unnest(
      regexp_split_to_array(
        regexp_replace(lower(split_part(coalesce(email, ''), '@', 1)), '\+.*$', ''),
        '[._\-]+'
      )
    ) with ordinality as t(p, n)
    where p ~ '^[a-zà-ÿ]{2,}$'
  )
  select nullif(
    btrim(
      string_agg(
        case
          when p in ('da', 'de', 'do', 'das', 'dos', 'e') then p
          else upper(left(p, 1)) || substr(p, 2)
        end,
        ' ' order by n
      )
    ),
    ''
  )
  from partes
$$;

-- ---------------------------------------------------------------------------
-- EMPRESA A PARTIR DO DOMÍNIO.
--
-- O domínio sozinho daria "dome", em minúsculas — e "prumologistica" numa
-- palavra só. Por isso existe a tabela de tradução abaixo: ela é a diferença
-- entre um ranking que diz "DOME · Prumo Logística" e um que diz
-- "dome · prumologistica".
--
-- Domínio que não estiver na tabela cai no `initcap` do primeiro rótulo, que
-- acerta a maioria dos casos sem ninguém precisar cadastrar nada.
-- ---------------------------------------------------------------------------
create table if not exists public.empresas (
  dominio text primary key,
  nome    text not null
);

insert into public.empresas (dominio, nome) values
  ('dome.services', 'DOME')
on conflict (dominio) do update set nome = excluded.nome;

alter table public.empresas enable row level security;
revoke all on public.empresas from anon, authenticated;

create or replace function public.empresa_do_email(email text)
returns text
language sql
stable
as $$
  select coalesce(
    (select e.nome
       from public.empresas e
      where e.dominio = lower(split_part(coalesce(email, ''), '@', 2))),
    nullif(initcap(split_part(lower(split_part(coalesce(email, ''), '@', 2)), '.', 1)), '')
  )
$$;

-- ---------------------------------------------------------------------------
-- O gatilho: preenche só o que estiver vazio.
--
-- Fica no BANCO e não na Edge Function de propósito. Assim vale para todos os
-- caminhos de escrita — o login, uma correção manual do RH no Table Editor, um
-- backfill futuro — e não só para o caminho que alguém lembrou de cobrir.
-- ---------------------------------------------------------------------------
create or replace function public.completar_jogador()
returns trigger
language plpgsql
as $$
begin
  if coalesce(btrim(new.nome), '') = '' then
    new.nome := coalesce(public.nome_do_email(new.email), split_part(new.email, '@', 1));
  end if;
  if coalesce(btrim(new.empresa), '') = '' then
    new.empresa := public.empresa_do_email(new.email);
  end if;
  return new;
end $$;

drop trigger if exists tg_completar_jogador on public.jogadores;
create trigger tg_completar_jogador
  before insert or update on public.jogadores
  for each row execute function public.completar_jogador();

-- ---------------------------------------------------------------------------
-- Quem já entrou antes desta migration.
-- ---------------------------------------------------------------------------
update public.jogadores
   set nome = coalesce(public.nome_do_email(email), split_part(email, '@', 1))
 where coalesce(btrim(nome), '') = '';

update public.jogadores
   set empresa = public.empresa_do_email(email)
 where coalesce(btrim(empresa), '') = '';

select public.atualizar_ranking();

-- ---------------------------------------------------------------------------
-- CONFERIR O RESULTADO, antes de confiar nele:
--
--   select email, nome, empresa from public.jogadores order by criado_em;
--
-- E para testar a dedução sem gravar nada:
--
--   select public.nome_do_email('daniel.alves@dome.services');      -- Daniel Alves
--   select public.nome_do_email('maria.da.silva@dome.services');    -- Maria da Silva
--   select public.empresa_do_email('ana@prumo.com.br');             -- Prumo
--
-- Para acrescentar uma empresa parceira com o nome bonito:
--
--   insert into public.empresas (dominio, nome)
--   values ('prumologistica.com.br', 'Prumo Logística')
--   on conflict (dominio) do update set nome = excluded.nome;
--   update public.jogadores set empresa = public.empresa_do_email(email);
--   select public.atualizar_ranking();
-- ---------------------------------------------------------------------------
