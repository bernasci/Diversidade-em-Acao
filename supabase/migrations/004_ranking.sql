-- ===========================================================================
-- 004_ranking.sql — a única porta aberta ao navegador.
--
-- É uma VIEW MATERIALIZADA, não uma view comum, e isso é uma decisão de custo:
-- com 5.602 pessoas, cada abertura do ranking seria um ORDER BY sobre a
-- tabela inteira na instância compartilhada do plano Free. Materializada, a
-- leitura é uma varredura de 100 linhas já ordenadas, e o custo do cálculo
-- acontece uma vez a cada cinco minutos — independente de quantas pessoas
-- estiverem olhando.
--
-- O preço: o ranking atrasa até cinco minutos. Para uma campanha de semanas,
-- é invisível; foi trocado de bom grado pelos 5 GB de egress do plano.
--
-- O QUE SAI DAQUI: apelido, área, pontos, posição. Só de quem marcou
-- `opt_in`. E-mail, nome completo e id não entram na view — não é uma
-- questão de ninguém pedir, é que não há como pedir.
-- ===========================================================================

drop materialized view if exists public.ranking_publico;

create materialized view public.ranking_publico as
select
  row_number() over (order by j.pts desc, j.criado_em asc) as posicao,
  nullif(btrim(j.apelido), '') as apelido,
  j.area,
  j.pts
from public.jogadores j
where j.opt_in = true
  and j.pts > 0                      -- quem ainda não pontuou não ocupa linha
order by j.pts desc, j.criado_em asc;

-- Índice único: sem ele o REFRESH CONCURRENTLY não é permitido, e sem
-- CONCURRENTLY o ranking fica bloqueado durante a atualização.
create unique index if not exists ranking_publico_pos_idx on public.ranking_publico (posicao);

-- Esta é a exceção do 003. É deliberada e está sozinha.
grant select on public.ranking_publico to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Atualização.
--
-- Opção A (preferida): pg_cron, disponível no plano Free.
--   Dashboard → Database → Extensions → ligar "pg_cron", depois rodar o bloco
--   abaixo. Cinco minutos é o intervalo; não vale a pena diminuir.
--
-- Opção B: se o pg_cron não estiver disponível, chame
--   `select public.atualizar_ranking();` manualmente, ou deixe a Edge
--   Function `jogar` chamar de vez em quando (ela já faz isso quando o
--   ranking está velho).
-- ---------------------------------------------------------------------------
-- ATENÇÃO ao CONCURRENTLY: ele NÃO funciona dentro de uma função. Toda função
-- PL/pgSQL roda dentro de uma transação, e o Postgres recusa
-- `REFRESH ... CONCURRENTLY` em bloco de transação. Por isso:
--
--   • esta função (chamada pelas Edge Functions) faz o refresh comum, que
--     bloqueia leituras por alguns milissegundos — irrelevante para 5 mil
--     linhas;
--   • o pg_cron, mais abaixo, chama o CONCURRENTLY direto, como comando de
--     primeiro nível, que é onde ele é permitido.
create or replace function public.atualizar_ranking()
returns void language plpgsql security definer set search_path = public as $$
begin
  refresh materialized view public.ranking_publico;
end $$;

revoke all on function public.atualizar_ranking() from public, anon, authenticated;
grant execute on function public.atualizar_ranking() to service_role;

-- Popula agora, para o índice único passar a valer.
select public.atualizar_ranking();

-- Agendamento — descomente depois de ligar a extensão pg_cron.
-- select cron.schedule(
--   'atualizar-ranking-diversidade',
--   '*/5 * * * *',
--   $$refresh materialized view concurrently public.ranking_publico$$
-- );

-- Para conferir o agendamento depois:  select * from cron.job;
-- Para remover:                        select cron.unschedule('atualizar-ranking-diversidade');
