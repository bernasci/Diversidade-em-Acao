begin;

create extension if not exists pgcrypto;

create table if not exists public.elegiveis (
  email text primary key,
  nome text,
  area text,
  matricula text,
  criado_em timestamptz not null default now(),
  empresa text
);

create table if not exists public.empresas (
  dominio text primary key,
  nome text not null
);

create table if not exists public.jogadores (
  id uuid primary key default gen_random_uuid(),
  email text not null unique references public.elegiveis(email) on delete cascade,
  nome text not null default '',
  apelido text not null default '',
  area text,
  emoji text not null default '😀',
  cor text not null default '#004AA1',
  pts integer not null default 0,
  opt_in boolean not null default false,
  criado_em timestamptz not null default now(),
  ultimo_acesso timestamptz not null default now(),
  empresa text,
  moldura text not null default 'nenhuma'
);

create table if not exists public.sessoes (
  token_hash text primary key,
  jogador uuid not null references public.jogadores(id) on delete cascade,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '30 days'
);

create table if not exists public.progresso (
  id bigint generated always as identity primary key,
  jogador uuid not null references public.jogadores(id) on delete cascade,
  missao text not null,
  tarefa text not null,
  pontos integer not null default 0,
  detalhe jsonb,
  criado_em timestamptz not null default now(),
  constraint progresso_unico unique (jogador, missao, tarefa)
);

create table if not exists public.quiz_gabarito (
  missao text not null,
  pergunta integer not null,
  resposta integer not null,
  explicacao text not null,
  primary key (missao, pergunta)
);

create index if not exists jogadores_pts_idx on public.jogadores (pts desc);
create index if not exists sessoes_jogador_idx on public.sessoes (jogador);
create index if not exists sessoes_expira_idx on public.sessoes (expira_em);
create index if not exists progresso_jogador_idx on public.progresso (jogador);

create or replace function public.normalizar_email_elegivel()
returns trigger language plpgsql as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end $$;

drop trigger if exists tg_normalizar_elegivel on public.elegiveis;
create trigger tg_normalizar_elegivel before insert or update on public.elegiveis
for each row execute function public.normalizar_email_elegivel();

create or replace function public.nome_do_email(p_email text)
returns text language sql immutable as $$
  with partes as (
    select p, n
    from unnest(regexp_split_to_array(regexp_replace(lower(split_part(coalesce(p_email, ''), '@', 1)), '\+.*$', ''), '[._\-]+'))
      with ordinality as t(p, n)
    where p ~ '^[a-zà-ÿ]{2,}$'
  )
  select nullif(btrim(string_agg(
    case when p in ('da', 'de', 'do', 'das', 'dos', 'e') then p else upper(left(p, 1)) || substr(p, 2) end,
    ' ' order by n
  )), '') from partes
$$;

create or replace function public.empresa_do_email(p_email text)
returns text language sql stable as $$
  select coalesce(
    (select e.nome from public.empresas e where e.dominio = lower(split_part(coalesce(p_email, ''), '@', 2))),
    nullif(initcap(split_part(lower(split_part(coalesce(p_email, ''), '@', 2)), '.', 1)), '')
  )
$$;

create or replace function public.completar_jogador()
returns trigger language plpgsql as $$
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
create trigger tg_completar_jogador before insert or update on public.jogadores
for each row execute function public.completar_jogador();

create or replace function public.somar_no_placar()
returns trigger language plpgsql as $$
begin
  update public.jogadores set pts = pts + new.pontos where id = new.jogador;
  return new;
end $$;

drop trigger if exists tg_somar_no_placar on public.progresso;
create trigger tg_somar_no_placar after insert on public.progresso
for each row execute function public.somar_no_placar();

create or replace function public.nome_curto(p_nome text)
returns text language sql immutable as $$
  select case
    when btrim(coalesce(p_nome, '')) = '' then ''
    when array_length(regexp_split_to_array(btrim(p_nome), '\s+'), 1) = 1 then btrim(p_nome)
    else (regexp_split_to_array(btrim(p_nome), '\s+'))[1] || ' ' ||
      (regexp_split_to_array(btrim(p_nome), '\s+'))[array_length(regexp_split_to_array(btrim(p_nome), '\s+'), 1)]
  end
$$;

create or replace function public.iniciais_do_nome(p_nome text)
returns text language sql immutable as $$
  with partes as (
    select p, n from unnest(regexp_split_to_array(btrim(coalesce(p_nome, '')), '\s+'))
      with ordinality as t(p, n) where p <> ''
  )
  select coalesce(nullif(upper(
    coalesce((select left(p, 1) from partes order by n limit 1), '') ||
    case when (select count(*) from partes) > 1
      then coalesce((select left(p, 1) from partes order by n desc limit 1), '') else '' end
  ), ''), '?')
$$;

create or replace function public.app_jogador_json(p_j public.jogadores)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'id', p_j.id, 'email', p_j.email, 'nome', p_j.nome, 'area', p_j.area,
    'empresa', p_j.empresa, 'emoji', p_j.emoji, 'cor', p_j.cor,
    'moldura', p_j.moldura, 'pts', p_j.pts, 'opt_in', p_j.opt_in
  )
$$;

create or replace function public.app_progresso_json(p_jogador uuid)
returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'missao', p.missao, 'tarefa', p.tarefa, 'pontos', p.pontos, 'detalhe', p.detalhe
  ) order by p.id), '[]'::jsonb)
  from public.progresso p where p.jogador = p_jogador
$$;

create or replace function public.app_jogador_da_sessao(p_hash text)
returns setof public.jogadores language sql stable as $$
  select j.* from public.sessoes s
  join public.jogadores j on j.id = s.jogador
  where s.token_hash = p_hash and s.expira_em > now()
  limit 1
$$;

create or replace function public.app_creditar(
  p_jogador uuid, p_missao text, p_tarefa text, p_pontos integer, p_detalhe jsonb default null
)
returns jsonb language plpgsql as $$
declare
  v_inseridas integer;
  v_total integer;
begin
  insert into public.progresso (jogador, missao, tarefa, pontos, detalhe)
  values (p_jogador, p_missao, p_tarefa, p_pontos, p_detalhe)
  on conflict (jogador, missao, tarefa) do nothing;
  get diagnostics v_inseridas = row_count;
  select pts into v_total from public.jogadores where id = p_jogador;
  return jsonb_build_object(
    'ja', v_inseridas = 0,
    'pontos', case when v_inseridas = 0 then 0 else p_pontos end,
    'total', coalesce(v_total, 0)
  );
end $$;

create or replace function public.app_entrar(p_email text, p_token_hash text, p_expira timestamptz)
returns jsonb language plpgsql as $$
declare
  v_email text := lower(btrim(p_email));
  v_e public.elegiveis;
  v_j public.jogadores;
  v_tentativas integer;
begin
  select * into v_e from public.elegiveis where email = v_email;
  if not found then return jsonb_build_object('erro', 'nao-elegivel'); end if;

  insert into public.jogadores (email, nome, area, empresa)
  values (v_email, coalesce(v_e.nome, ''), v_e.area, v_e.empresa)
  on conflict (email) do update set
    ultimo_acesso = now(),
    nome = coalesce(nullif(btrim(excluded.nome), ''), public.jogadores.nome),
    area = coalesce(excluded.area, public.jogadores.area),
    empresa = coalesce(excluded.empresa, public.jogadores.empresa)
  returning * into v_j;

  delete from public.sessoes where jogador = v_j.id and expira_em < now();
  select count(*) into v_tentativas from public.sessoes
    where jogador = v_j.id and criado_em >= now() - interval '1 hour';
  if v_tentativas >= 10 then return jsonb_build_object('erro', 'muitas-tentativas'); end if;

  insert into public.sessoes (token_hash, jogador, expira_em)
  values (p_token_hash, v_j.id, p_expira);

  return jsonb_build_object(
    'jogador', public.app_jogador_json(v_j),
    'progresso', public.app_progresso_json(v_j.id)
  );
end $$;

create or replace function public.app_estado(p_hash text)
returns jsonb language plpgsql as $$
declare v_j public.jogadores;
begin
  select * into v_j from public.app_jogador_da_sessao(p_hash);
  if v_j.id is null then return jsonb_build_object('erro', 'sessao-invalida'); end if;
  return jsonb_build_object('jogador', public.app_jogador_json(v_j), 'progresso', public.app_progresso_json(v_j.id));
end $$;

create or replace function public.app_responder(p_hash text, p_missao text, p_pergunta integer, p_escolha integer)
returns jsonb language plpgsql as $$
declare
  v_j public.jogadores;
  v_g public.quiz_gabarito;
  v_certo boolean;
  v_credito jsonb;
begin
  select * into v_j from public.app_jogador_da_sessao(p_hash);
  if v_j.id is null then return jsonb_build_object('erro', 'sessao-invalida'); end if;
  if p_missao not in ('m1','m2','m3') or p_pergunta < 0 or p_pergunta >= 5 or p_escolha < 0 or p_escolha > 3 then
    return jsonb_build_object('erro', 'dados-invalidos');
  end if;
  select * into v_g from public.quiz_gabarito where missao = p_missao and pergunta = p_pergunta;
  if not found then return jsonb_build_object('erro', 'dados-invalidos'); end if;
  v_certo := p_escolha = v_g.resposta;
  v_credito := public.app_creditar(v_j.id, p_missao, 'quiz-' || p_pergunta, case when v_certo then 2 else 0 end,
    jsonb_build_object('escolha', p_escolha, 'certo', v_certo));
  return v_credito || jsonb_build_object('certo', v_certo, 'resposta', v_g.resposta, 'explicacao', v_g.explicacao);
end $$;

create or replace function public.app_jogo_concluir(
  p_hash text, p_missao text, p_jogo text, p_acertos integer, p_total integer, p_segundos integer
)
returns jsonb language plpgsql as $$
declare
  v_j public.jogadores;
  v_esperado integer;
begin
  select * into v_j from public.app_jogador_da_sessao(p_hash);
  if v_j.id is null then return jsonb_build_object('erro', 'sessao-invalida'); end if;
  v_esperado := case
    when p_missao = 'm1' and p_jogo = 'memoria' then 6
    when p_missao = 'm2' and p_jogo = 'mito' then 8
    when p_missao = 'm3' and p_jogo = 'cenario' then 4
    else null end;
  if v_esperado is null or p_total is distinct from v_esperado then
    return jsonb_build_object('erro', 'dados-invalidos', 'mensagem', 'Resultado do jogo não confere.');
  end if;
  return public.app_creditar(v_j.id, p_missao, 'jogo:' || p_jogo, 10,
    jsonb_build_object('acertos', greatest(0, p_acertos), 'total', v_esperado, 'segundos', greatest(0, p_segundos)));
end $$;

create or replace function public.app_bonus(p_hash text)
returns jsonb language plpgsql as $$
declare
  v_j public.jogadores;
  v_completou boolean;
begin
  select * into v_j from public.app_jogador_da_sessao(p_hash);
  if v_j.id is null then return jsonb_build_object('erro', 'sessao-invalida'); end if;
  select not exists (
    select 1 from (
      values
        ('m1','jogo:memoria'),('m1','quiz-0'),('m1','quiz-1'),('m1','quiz-2'),('m1','quiz-3'),('m1','quiz-4'),
        ('m2','jogo:mito'),('m2','quiz-0'),('m2','quiz-1'),('m2','quiz-2'),('m2','quiz-3'),('m2','quiz-4'),
        ('m3','jogo:cenario'),('m3','quiz-0'),('m3','quiz-1'),('m3','quiz-2'),('m3','quiz-3'),('m3','quiz-4')
    ) as obrigatoria(missao, tarefa)
    where not exists (
      select 1 from public.progresso p
      where p.jogador = v_j.id and p.missao = obrigatoria.missao and p.tarefa = obrigatoria.tarefa
    )
  ) into v_completou;
  if not v_completou then
    return jsonb_build_object('ja', false, 'pontos', 0, 'total', v_j.pts);
  end if;
  return public.app_creditar(v_j.id, 'geral', 'bonus', 20, null);
end $$;

create or replace function public.app_perfil(
  p_hash text, p_emoji text, p_cor text, p_moldura text, p_opt_in boolean
)
returns jsonb language plpgsql as $$
declare v_j public.jogadores;
begin
  select * into v_j from public.app_jogador_da_sessao(p_hash);
  if v_j.id is null then return jsonb_build_object('erro', 'sessao-invalida'); end if;
  update public.jogadores set
    emoji = coalesce(left(p_emoji, 8), emoji),
    cor = case when p_cor ~ '^#[0-9a-fA-F]{6}$' then p_cor else cor end,
    moldura = case when p_moldura in ('nenhuma','anel','duplo','solido','brilho','quadrado') then p_moldura else moldura end,
    opt_in = coalesce(p_opt_in, opt_in)
  where id = v_j.id returning * into v_j;
  return jsonb_build_object('jogador', public.app_jogador_json(v_j));
end $$;

create or replace function public.app_ranking(p_limite integer default 100)
returns jsonb language sql stable as $$
  with ordenado as (
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
    where j.opt_in = true and j.pts > 0
  ), limitado as (
    select * from ordenado order by posicao limit least(greatest(p_limite, 1), 100)
  )
  select coalesce(jsonb_agg(to_jsonb(limitado) order by posicao), '[]'::jsonb) from limitado
$$;

commit;
