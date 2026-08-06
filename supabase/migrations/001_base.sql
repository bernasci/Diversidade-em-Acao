-- ===========================================================================
-- 001_base.sql — tabelas do jogo.
--
-- Rode este arquivo no SQL Editor do Supabase (Dashboard → SQL Editor → New
-- query → colar → Run). Depois rode o 002, o 003 e o 004, nesta ordem.
--
-- Escrito para ser LIDO: quem opera isto é o RH, no navegador, não um
-- desenvolvedor no terminal.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- ELEGIVEIS — a lista do RH. É ela que define quem entra.
--
-- Ninguém joga sem estar aqui. A carga é feita por
-- `ferramentas/importar-elegiveis.mjs`, que aceita rodar de novo quantas
-- vezes for preciso: e-mail repetido atualiza a linha em vez de duplicar.
--
-- `matricula` já nasce criada mesmo sem uso hoje. Se um dia a premiação
-- deixar de ser simbólica e for preciso um segundo fator no login, o ajuste
-- é uma checagem na Edge Function `entrar` — sem migração, sem recarga da
-- lista de 5.602 pessoas.
-- ---------------------------------------------------------------------------
create table if not exists public.elegiveis (
  email      text primary key,
  nome       text,
  area       text,
  matricula  text,
  criado_em  timestamptz not null default now()
);

-- O e-mail é a chave primária, então precisa chegar sempre normalizado.
-- A trava aqui é a última linha de defesa: o importador também normaliza.
create or replace function public.normalizar_email_elegivel()
returns trigger language plpgsql as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end $$;

drop trigger if exists tg_normalizar_elegivel on public.elegiveis;
create trigger tg_normalizar_elegivel
  before insert or update on public.elegiveis
  for each row execute function public.normalizar_email_elegivel();

-- ---------------------------------------------------------------------------
-- JOGADORES — criado no primeiro acesso, a partir da linha de `elegiveis`.
--
-- `pts` nunca é escrito pelo app: quem soma é o trigger do `progresso`.
-- `opt_in` nasce FALSO — ninguém aparece num ranking público sem ter pedido.
-- ---------------------------------------------------------------------------
create table if not exists public.jogadores (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique references public.elegiveis(email) on delete cascade,
  nome          text not null default '',
  apelido       text not null default '',
  area          text,
  emoji         text not null default '😀',
  cor           text not null default '#004AA1',
  pts           integer not null default 0,
  opt_in        boolean not null default false,
  criado_em     timestamptz not null default now(),
  ultimo_acesso timestamptz not null default now()
);

create index if not exists jogadores_pts_idx on public.jogadores (pts desc);

-- ---------------------------------------------------------------------------
-- SESSOES — o token de acesso, guardado como HASH.
--
-- O app recebe o token em claro uma única vez e o guarda no localStorage. O
-- banco só conhece o SHA-256: vazar esta tabela não dá acesso a conta nenhuma.
-- ---------------------------------------------------------------------------
create table if not exists public.sessoes (
  token_hash text primary key,
  jogador    uuid not null references public.jogadores(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  expira_em  timestamptz not null default now() + interval '30 days'
);

create index if not exists sessoes_jogador_idx on public.sessoes (jogador);
create index if not exists sessoes_expira_idx  on public.sessoes (expira_em);

-- ---------------------------------------------------------------------------
-- PROGRESSO — o livro-caixa. Uma linha por tarefa concluída.
--
-- A constraint UNIQUE abaixo *é* o mecanismo de idempotência do jogo inteiro.
-- Quando a Edge Function tenta creditar de novo, o Postgres devolve 23505 e
-- isso significa "já fez" — não é erro, é a resposta certa. Sem ela, dois
-- toques no botão do celular com 4G lento creditariam duas vezes.
-- ---------------------------------------------------------------------------
create table if not exists public.progresso (
  id        bigint generated always as identity primary key,
  jogador   uuid not null references public.jogadores(id) on delete cascade,
  missao    text not null,          -- 'm1'..'m5' ou 'geral' (bônus)
  tarefa    text not null,          -- 'jogo' | 'quiz-0'..'quiz-4' | 'bonus'
  pontos    integer not null default 0,
  detalhe   jsonb,
  criado_em timestamptz not null default now(),
  constraint progresso_unico unique (jogador, missao, tarefa)
);

create index if not exists progresso_jogador_idx on public.progresso (jogador);

-- ---------------------------------------------------------------------------
-- O placar é derivado do livro-caixa, nunca escrito à mão.
--
-- Só INSERT dispara: `progresso` não tem update nem delete no fluxo normal.
-- Se um dia uma linha for corrigida na unha, o placar precisa ser recalculado
-- junto — a consulta para isso está em `supabase/consultas.sql`.
-- ---------------------------------------------------------------------------
create or replace function public.somar_no_placar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.jogadores
     set pts = pts + new.pontos
   where id = new.jogador;
  return new;
end $$;

drop trigger if exists tg_somar_no_placar on public.progresso;
create trigger tg_somar_no_placar
  after insert on public.progresso
  for each row execute function public.somar_no_placar();
