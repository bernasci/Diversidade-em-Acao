-- ===========================================================================
-- consultas.sql — o painel do RH, em SQL.
--
-- Não é para rodar de uma vez. Abra o SQL Editor do Supabase, copie o bloco
-- que interessa e execute só ele.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. O NÚMERO QUE TODO MUNDO PERGUNTA: adesão.
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.elegiveis)                        as convidados,
  (select count(*) from public.jogadores)                        as entraram,
  round(100.0 * (select count(*) from public.jogadores)
              / nullif((select count(*) from public.elegiveis), 0), 1) as pct_entraram,
  (select count(*) from public.jogadores where pts > 0)           as comecaram_a_jogar;


-- ---------------------------------------------------------------------------
-- 2. Quantas pessoas concluíram a jornada inteira (5 missões).
--    Uma missão está concluída quando tem o mini-game e as 5 perguntas.
-- ---------------------------------------------------------------------------
with por_missao as (
  select jogador, missao,
         bool_or(tarefa = 'jogo')                        as fez_jogo,
         count(*) filter (where tarefa like 'quiz-%')    as perguntas
    from public.progresso
   where missao <> 'geral'
   group by jogador, missao
),
completas as (
  select jogador, count(*) as missoes_ok
    from por_missao
   where fez_jogo and perguntas >= 5
   group by jogador
)
select
  count(*) filter (where missoes_ok = 5) as concluiram_tudo,
  count(*) filter (where missoes_ok = 4) as em_4,
  count(*) filter (where missoes_ok = 3) as em_3,
  count(*) filter (where missoes_ok = 2) as em_2,
  count(*) filter (where missoes_ok = 1) as em_1
from completas;


-- ---------------------------------------------------------------------------
-- 3. Onde as pessoas estão parando. Se uma missão despenca em relação à
--    anterior, o problema costuma ser dela — conteúdo longo, jogo confuso.
-- ---------------------------------------------------------------------------
select missao,
       count(distinct jogador) filter (where tarefa = 'jogo')      as fizeram_o_jogo,
       count(distinct jogador) filter (where tarefa like 'quiz-%') as comecaram_o_quiz,
       count(*)  filter (where tarefa like 'quiz-%' and pontos > 0) as acertos,
       count(*)  filter (where tarefa like 'quiz-%')                as respostas
  from public.progresso
 where missao <> 'geral'
 group by missao
 order by missao;


-- ---------------------------------------------------------------------------
-- 4. As perguntas mais erradas. Serve de pauta para a comunicação interna:
--    o que a empresa inteira ainda não sabe sobre inclusão de PcD.
-- ---------------------------------------------------------------------------
select p.missao,
       p.tarefa,
       count(*)                              as respostas,
       count(*) filter (where p.pontos = 0)  as erros,
       round(100.0 * count(*) filter (where p.pontos = 0) / count(*), 1) as pct_erro
  from public.progresso p
 where p.tarefa like 'quiz-%'
 group by p.missao, p.tarefa
 order by pct_erro desc, respostas desc;


-- ---------------------------------------------------------------------------
-- 5. Adesão por área — para o lançamento escalonado e para cobrar gestor.
-- ---------------------------------------------------------------------------
select coalesce(e.area, 'sem área') as area,
       count(*)                                        as convidados,
       count(j.id)                                     as entraram,
       round(100.0 * count(j.id) / count(*), 1)        as pct
  from public.elegiveis e
  left join public.jogadores j on j.email = e.email
 group by 1
 order by pct desc;


-- ---------------------------------------------------------------------------
-- 6. Quem concluiu tudo — a lista para emitir reconhecimento.
--    Traz nome e e-mail: use só internamente.
-- ---------------------------------------------------------------------------
with por_missao as (
  select jogador, missao,
         bool_or(tarefa = 'jogo')                     as fez_jogo,
         count(*) filter (where tarefa like 'quiz-%') as perguntas
    from public.progresso where missao <> 'geral' group by jogador, missao
)
select j.nome, j.email, j.area, j.pts,
       (select count(*) from public.progresso x
         where x.jogador = j.id and x.tarefa like 'quiz-%' and x.pontos > 0) as acertos
  from public.jogadores j
  join (select jogador from por_missao where fez_jogo and perguntas >= 5
         group by jogador having count(*) = 5) c on c.jogador = j.id
 order by j.pts desc, j.nome;


-- ---------------------------------------------------------------------------
-- 7. Manutenção.
-- ---------------------------------------------------------------------------
-- Atualizar o ranking agora (normalmente o pg_cron faz a cada 5 min):
--   select public.atualizar_ranking();

-- Apagar sessões vencidas:
--   select public.limpar_sessoes();

-- Recalcular o placar a partir do livro-caixa. Só é necessário se alguma
-- linha de `progresso` for corrigida na unha — o trigger só soma no INSERT:
--   update public.jogadores j
--      set pts = coalesce((select sum(p.pontos) from public.progresso p
--                           where p.jogador = j.id), 0);
--   select public.atualizar_ranking();

-- Tamanho ocupado (para acompanhar os 500 MB do plano Free):
--   select relname as tabela, pg_size_pretty(pg_total_relation_size(c.oid)) as tamanho
--     from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind in ('r','m')
--    order by pg_total_relation_size(c.oid) desc;
