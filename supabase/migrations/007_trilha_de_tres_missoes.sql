-- ===========================================================================
-- 007_trilha_de_tres_missoes.sql — zera o progresso da trilha antiga.
--
-- POR QUE APAGAR, e não deixar quieto. A trilha tinha cinco missões e passou
-- a ter três: `m4` e `m5` não existem mais, e as perguntas que sobraram foram
-- reescritas para tirar o conteúdo de legislação. Deixar o progresso velho no
-- lugar produz três problemas ao mesmo tempo:
--
--   • pontos de missões que a interface não mostra continuam somando no
--     ranking, e o ranking deixa de dizer a verdade sobre quem estudou o quê;
--   • a tarefa do mini-game mudou de nome (`jogo` virou `jogo:memoria`,
--     `jogo:ligar`…), então quem já jogou apareceria como quem não jogou —
--     mas com os pontos na conta;
--   • quem respondeu a `m1/quiz-1` respondeu a uma pergunta sobre a Lei de
--     Cotas. Essa pergunta virou outra, e a tela nunca mais a mostraria a ele.
--
-- O QUE ESTE ARQUIVO NÃO APAGA: `elegiveis`, `jogadores` e `sessoes`. Ninguém
-- perde o acesso nem precisa entrar de novo — perde-se o placar, que é o que
-- deixou de valer.
--
-- Rode junto com o 002 (que recarrega o gabarito novo), nesta ordem:
--   1) 002_gabarito.sql      — perguntas novas, some com as de m4 e m5
--   2) 007_...sql            — este arquivo
--
-- AVISE ANTES. Quem já concluiu a jornada tem um certificado baixado que
-- continua valendo como lembrança, mas o registro no banco vai a zero — e
-- essa é uma frase que o RH precisa dizer antes, não depois.
-- ===========================================================================

begin;

-- O trigger `tg_somar_no_placar` só dispara em INSERT: apagar linhas não
-- desfaz a soma. Por isso o `pts` é zerado à mão, na mesma transação.
delete from public.progresso;

update public.jogadores set pts = 0 where pts <> 0;

commit;

-- O ranking é view materializada: sem este refresh ele continua exibindo o
-- placar antigo até o próximo ciclo do pg_cron.
select public.atualizar_ranking();

-- Conferência (deve devolver 0 e 0):
--   select (select count(*) from public.progresso) as linhas,
--          (select coalesce(sum(pts), 0) from public.jogadores) as pontos;
