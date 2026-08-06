-- ===========================================================================
-- 003_seguranca.sql — o modelo de acesso, em uma frase:
--
--   O navegador não fala com o banco. Ponto.
--
-- Todas as tabelas ficam com RLS LIGADO e NENHUMA POLICY. Sem policy, RLS
-- nega tudo: `anon` e `authenticated` não leem nem escrevem uma linha. Quem
-- acessa é a service_role, que só existe dentro das Edge Functions.
--
-- A única exceção é a view `ranking_publico`, criada no 004 com um GRANT
-- explícito para `anon` — e ela expõe apelido, área e pontos de quem pediu
-- para aparecer. Nunca e-mail, nunca nome completo, nunca id.
--
-- POR QUE ASSIM, e não com policies bem escritas: policy boa é ótima quando
-- o cliente tem um `auth.uid()` de verdade. Aqui não temos — o login é uma
-- lista de e-mails, não o GoTrue. Meia-RLS, com um `using (true)` aqui e um
-- `opt_in = true` ali, é como o app irmão (DOME GAMES) acabou com a tabela de
-- jogadores legível por `anon`, e-mail incluso, por três fases do projeto.
-- Fechar tudo e passar por função é mais simples de auditar: ou a chamada
-- passou pela Edge Function, ou não aconteceu.
-- ===========================================================================

alter table public.elegiveis     enable row level security;
alter table public.jogadores     enable row level security;
alter table public.sessoes       enable row level security;
alter table public.progresso     enable row level security;
alter table public.quiz_gabarito enable row level security;

-- Cinto e suspensório: mesmo sem policy, revogamos os privilégios de tabela.
-- Se alguém criar uma policy por engano no futuro, o GRANT ainda falta.
revoke all on public.elegiveis     from anon, authenticated;
revoke all on public.jogadores     from anon, authenticated;
revoke all on public.sessoes       from anon, authenticated;
revoke all on public.progresso     from anon, authenticated;
revoke all on public.quiz_gabarito from anon, authenticated;

-- Nada de novo nasce aberto por acidente.
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Faxina de sessões vencidas.
--
-- Sem isto, `sessoes` cresce para sempre — 5.602 pessoas trocando de celular
-- ao longo do ano viram dezenas de milhares de linhas mortas. A Edge Function
-- `entrar` chama esta função de vez em quando; se o pg_cron estiver
-- disponível, o agendamento no fim do 004 cuida disso sozinho.
-- ---------------------------------------------------------------------------
create or replace function public.limpar_sessoes()
returns integer language plpgsql security definer set search_path = public as $$
declare apagadas integer;
begin
  delete from public.sessoes where expira_em < now();
  get diagnostics apagadas = row_count;
  return apagadas;
end $$;

-- Tirar de PUBLIC tira de todo mundo, service_role inclusive — por isso o
-- grant explícito logo abaixo. Sem ele, a Edge Function toma "permission
-- denied" ao chamar a RPC.
revoke all on function public.limpar_sessoes() from public, anon, authenticated;
grant execute on function public.limpar_sessoes() to service_role;
