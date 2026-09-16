-- ===========================================================================
-- 008_avatar.sql — moldura do avatar e iniciais que não envelhecem.
--
-- Duas coisas, e a segunda é mais sutil do que parece.
--
-- 1. `jogadores.moldura` — a decoração em volta do círculo. Coluna nova, com
--    default, então nenhuma linha existente precisa ser tocada.
--
-- 2. O SENTINELA `@ini` na coluna `emoji`. Quando a pessoa escolhe "usar
--    minhas iniciais", o app grava `@ini` — não as letras. Quem as calcula é
--    a view, na hora da leitura.
--
--    POR QUE NÃO GRAVAR "AR" DIRETO, que seria mais simples: `nome` vem da
--    lista do RH e é reespelhado a cada acesso. No dia em que o RH corrigir
--    um cadastro — e vai corrigir, é o motivo de o reespelhamento existir —
--    as iniciais gravadas apontariam para um nome que não existe mais, e
--    ninguém perceberia, porque um avatar errado não dá erro. Com o
--    sentinela, elas se corrigem no mesmo acesso em que o nome se corrige.
--
-- Rode depois da 007. Depois republique `entrar` e `jogar`: as duas passam a
-- ler e escrever a coluna nova.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. A coluna.
--
-- `not null default 'nenhuma'` e não `null`: assim toda linha tem um valor
-- válido desde o primeiro instante, e nenhum lugar do código precisa tratar
-- "moldura ausente" como caso separado de "sem moldura". São a mesma coisa, e
-- representá-las igual é o que evita o `?? 'nenhuma'` espalhado por três
-- arquivos.
-- ---------------------------------------------------------------------------
alter table public.jogadores
  add column if not exists moldura text not null default 'nenhuma';

-- ---------------------------------------------------------------------------
-- 2. As iniciais, no banco.
--
-- Mesma regra do `nome_curto` (migration 005) e do `iniciaisDe` do app:
-- primeira letra do primeiro nome, primeira letra do último. Nome de uma
-- palavra devolve uma letra só; nome vazio devolve "?" para o círculo nunca
-- aparecer em branco.
--
-- `immutable` porque depende só do argumento — é o que permite usá-la dentro
-- da view materializada sem impedir o refresh.
-- ---------------------------------------------------------------------------
create or replace function public.iniciais_do_nome(nome text)
returns text
language sql
immutable
as $$
  with partes as (
    select p, n
    from unnest(regexp_split_to_array(btrim(coalesce(nome, '')), '\s+'))
      with ordinality as t(p, n)
    where p <> ''
  )
  select coalesce(
    nullif(
      upper(
        coalesce((select left(p, 1) from partes order by n asc limit 1), '') ||
        case
          when (select count(*) from partes) > 1
            then coalesce((select left(p, 1) from partes order by n desc limit 1), '')
          else ''
        end
      ),
      ''
    ),
    '?'
  )
$$;

-- ---------------------------------------------------------------------------
-- 3. O ranking, refeito.
--
-- Sai igual ao da 005, mais a `moldura`, e com o `emoji` resolvido: quem
-- guardou o sentinela recebe as letras já calculadas. O app do outro lado só
-- desenha o que vier — não precisa saber que `@ini` existe para renderizar a
-- lista dos outros.
--
-- Continua de fora: e-mail, nome completo, id, matrícula.
-- ---------------------------------------------------------------------------
drop materialized view if exists public.ranking_publico;

create materialized view public.ranking_publico as
select
  row_number() over (order by j.pts desc, j.criado_em asc) as posicao,
  public.nome_curto(j.nome) as nome,
  j.area,
  j.empresa,
  case when j.emoji = '@ini' then public.iniciais_do_nome(j.nome) else j.emoji end as emoji,
  j.cor,
  j.moldura,
  j.pts
from public.jogadores j
where j.opt_in = true
  and j.pts > 0                      -- quem ainda não pontuou não ocupa linha
order by j.pts desc, j.criado_em asc;

-- Índice único: sem ele o REFRESH CONCURRENTLY não é permitido, e sem
-- CONCURRENTLY o ranking fica bloqueado durante a atualização.
create unique index if not exists ranking_publico_pos_idx on public.ranking_publico (posicao);

-- A exceção deliberada do 003, e continua sozinha.
grant select on public.ranking_publico to anon, authenticated;

select public.atualizar_ranking();

-- Conferência:
--   select nome, emoji, cor, moldura, pts from public.ranking_publico limit 10;
--   select public.iniciais_do_nome('Ana Paula Ribeiro');  -- AR
--   select public.iniciais_do_nome('Ana');                -- A
--   select public.iniciais_do_nome('');                   -- ?
