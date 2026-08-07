-- ===========================================================================
-- 005_nome_e_empresa.sql
--
-- O evento deixou de ser só da DOME: participam pessoas de outras empresas.
-- Duas mudanças vêm daí.
--
-- 1. `empresa` passa a existir, na lista de elegíveis e no jogador.
-- 2. O ranking deixa de mostrar APELIDO e passa a mostrar NOME REAL, com
--    setor e empresa embaixo.
--
-- A segunda é uma mudança de privacidade, não de layout. Antes uma pessoa no
-- ranking era "Fulano QA"; agora é "Maria Oliveira · Operações · Prumo". O
-- que segura isso é o `opt_in`, que continua nascendo FALSO — ninguém aparece
-- sem ter escolhido. O texto do Perfil foi reescrito para dizer exatamente o
-- que vai aparecer, em vez de "seu apelido".
--
-- Rode depois das migrations 001 a 004.
-- ===========================================================================

alter table public.elegiveis add column if not exists empresa text;
alter table public.jogadores add column if not exists empresa text;

-- ---------------------------------------------------------------------------
-- PRIMEIRO NOME + ÚLTIMO SOBRENOME.
--
-- A lista do RH traz o nome completo — "Maria da Silva Santos Oliveira". No
-- ranking isso ocupa duas linhas e não ajuda ninguém a reconhecer a pessoa.
-- Primeiro e último resolvem: "Maria Oliveira".
--
-- O encurtamento acontece AQUI, dentro da view, e não no navegador. Se fosse
-- no cliente, o nome completo de 5.602 pessoas trafegaria para qualquer um
-- com a anon key — a view só deve expor o que a tela mostra.
-- ---------------------------------------------------------------------------
create or replace function public.nome_curto(nome text)
returns text language sql immutable as $$
  select case
    when btrim(coalesce(nome, '')) = '' then ''
    when array_length(regexp_split_to_array(btrim(nome), '\s+'), 1) = 1 then btrim(nome)
    else (regexp_split_to_array(btrim(nome), '\s+'))[1] || ' ' ||
         (regexp_split_to_array(btrim(nome), '\s+'))[
           array_length(regexp_split_to_array(btrim(nome), '\s+'), 1)
         ]
  end
$$;

-- ---------------------------------------------------------------------------
-- O ranking, refeito.
--
-- Sai `apelido`, entram `nome` (já encurtado), `empresa` e o avatar que a
-- pessoa escolheu. Continua de fora: e-mail, nome completo, id, matrícula.
-- ---------------------------------------------------------------------------
drop materialized view if exists public.ranking_publico;

create materialized view public.ranking_publico as
select
  row_number() over (order by j.pts desc, j.criado_em asc) as posicao,
  public.nome_curto(j.nome) as nome,
  j.area,
  j.empresa,
  j.emoji,
  j.cor,
  j.pts
from public.jogadores j
where j.opt_in = true
  and j.pts > 0
order by j.pts desc, j.criado_em asc;

create unique index if not exists ranking_publico_pos_idx on public.ranking_publico (posicao);
grant select on public.ranking_publico to anon, authenticated;

select public.atualizar_ranking();

-- ---------------------------------------------------------------------------
-- `jogadores.apelido` FICA, sem uso.
--
-- Não é esquecimento: derrubar coluna é irreversível, e a única coisa que se
-- ganharia é limpeza. Ela já não é lida por nada — nem pela view, nem pelas
-- Edge Functions, nem pelo app. Quando a campanha terminar e não houver mais
-- dúvida, uma linha resolve:
--
--   alter table public.jogadores drop column apelido;
-- ---------------------------------------------------------------------------
