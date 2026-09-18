/* Migra o banco atual do Supabase para o Neon sem imprimir dados pessoais. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

function lerEnv(arquivo, destino) {
  try {
    for (const linha of readFileSync(resolve(process.cwd(), arquivo), 'utf8').split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !destino[m[1]]) destino[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* arquivo opcional */
  }
}

const env = { ...process.env }
lerEnv('.env', env)
lerEnv('.env.local', env)

const origem = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const chaveOrigem = env.SUPABASE_SERVICE_ROLE_KEY
const urlDireta = env.DATABASE_URL_UNPOOLED
if (!origem || !chaveOrigem || !urlDireta) {
  throw new Error('Faltam as credenciais do Supabase ou DATABASE_URL_UNPOOLED do Neon.')
}

const cliente = new pg.Client({ connectionString: urlDireta })
await cliente.connect()
const sql = {
  async query(texto, valores = []) {
    return (await cliente.query(texto, valores)).rows
  },
}
const headers = { apikey: chaveOrigem, authorization: `Bearer ${chaveOrigem}` }

async function buscar(tabela, ordem) {
  const todas = []
  for (let inicio = 0; ; inicio += 1000) {
    const url = new URL(`${origem}/rest/v1/${tabela}`)
    url.searchParams.set('select', '*')
    if (ordem) url.searchParams.set('order', `${ordem}.asc`)
    const resposta = await fetch(url, {
      headers: { ...headers, Range: `${inicio}-${inicio + 999}` },
    })
    if (!resposta.ok) throw new Error(`Falha ao ler ${tabela}: ${resposta.status}`)
    const lote = await resposta.json()
    todas.push(...lote)
    if (lote.length < 1000) return todas
  }
}

async function inserir(query, linhas) {
  if (linhas.length) await sql.query(query, [JSON.stringify(linhas)])
}

const tabelas = {
  elegiveis: await buscar('elegiveis', 'email'),
  empresas: await buscar('empresas', 'dominio'),
  jogadores: await buscar('jogadores', 'criado_em'),
  progresso: await buscar('progresso', 'id'),
  sessoes: await buscar('sessoes', 'criado_em'),
  quiz_gabarito: await buscar('quiz_gabarito', 'missao'),
}

const esquema = readFileSync(resolve(process.cwd(), 'neon/schema.sql'), 'utf8')
await sql.query(esquema)

await inserir(`
  insert into public.elegiveis (email,nome,area,matricula,criado_em,empresa)
  select email,nome,area,matricula,criado_em,empresa
  from jsonb_to_recordset($1::jsonb) as x(email text,nome text,area text,matricula text,criado_em timestamptz,empresa text)
  on conflict (email) do update set nome=excluded.nome,area=excluded.area,matricula=excluded.matricula,criado_em=excluded.criado_em,empresa=excluded.empresa
`, tabelas.elegiveis)

await inserir(`
  insert into public.empresas (dominio,nome)
  select dominio,nome from jsonb_to_recordset($1::jsonb) as x(dominio text,nome text)
  on conflict (dominio) do update set nome=excluded.nome
`, tabelas.empresas)

await inserir(`
  insert into public.jogadores (id,email,nome,apelido,area,emoji,cor,pts,opt_in,criado_em,ultimo_acesso,empresa,moldura)
  select id,email,nome,coalesce(apelido,''),area,emoji,cor,pts,opt_in,criado_em,ultimo_acesso,empresa,coalesce(moldura,'nenhuma')
  from jsonb_to_recordset($1::jsonb) as x(id uuid,email text,nome text,apelido text,area text,emoji text,cor text,pts integer,opt_in boolean,criado_em timestamptz,ultimo_acesso timestamptz,empresa text,moldura text)
  on conflict (id) do update set email=excluded.email,nome=excluded.nome,apelido=excluded.apelido,area=excluded.area,emoji=excluded.emoji,cor=excluded.cor,pts=excluded.pts,opt_in=excluded.opt_in,criado_em=excluded.criado_em,ultimo_acesso=excluded.ultimo_acesso,empresa=excluded.empresa,moldura=excluded.moldura
`, tabelas.jogadores)

await sql.query('drop trigger if exists tg_somar_no_placar on public.progresso')
try {
  await inserir(`
    insert into public.progresso (id,jogador,missao,tarefa,pontos,detalhe,criado_em) overriding system value
    select id,jogador,missao,tarefa,pontos,detalhe,criado_em
    from jsonb_to_recordset($1::jsonb) as x(id bigint,jogador uuid,missao text,tarefa text,pontos integer,detalhe jsonb,criado_em timestamptz)
    on conflict (jogador,missao,tarefa) do update set pontos=excluded.pontos,detalhe=excluded.detalhe,criado_em=excluded.criado_em
  `, tabelas.progresso)
} finally {
  await sql.query(`create trigger tg_somar_no_placar after insert on public.progresso for each row execute function public.somar_no_placar()`)
}

await inserir(`
  insert into public.sessoes (token_hash,jogador,criado_em,expira_em)
  select token_hash,jogador,criado_em,expira_em
  from jsonb_to_recordset($1::jsonb) as x(token_hash text,jogador uuid,criado_em timestamptz,expira_em timestamptz)
  on conflict (token_hash) do update set jogador=excluded.jogador,criado_em=excluded.criado_em,expira_em=excluded.expira_em
`, tabelas.sessoes)

await inserir(`
  insert into public.quiz_gabarito (missao,pergunta,resposta,explicacao)
  select missao,pergunta,resposta,explicacao
  from jsonb_to_recordset($1::jsonb) as x(missao text,pergunta integer,resposta integer,explicacao text)
  on conflict (missao,pergunta) do update set resposta=excluded.resposta,explicacao=excluded.explicacao
`, tabelas.quiz_gabarito)

await sql.query(`select setval(pg_get_serial_sequence('public.progresso','id'), greatest(coalesce((select max(id) from public.progresso),1),1), true)`)

const conferencia = await sql.query(`
  select
    (select count(*)::integer from public.elegiveis) as elegiveis,
    (select count(*)::integer from public.jogadores) as jogadores,
    (select count(*)::integer from public.sessoes) as sessoes,
    (select count(*)::integer from public.progresso) as progresso,
    (select count(*)::integer from public.quiz_gabarito) as quiz_gabarito,
    (select count(*)::integer from public.jogadores j where j.pts <> coalesce((select sum(p.pontos) from public.progresso p where p.jogador=j.id),0)) as placares_divergentes
`)

console.log('Origem:', Object.fromEntries(Object.entries(tabelas).map(([k, v]) => [k, v.length])))
console.log('Neon:', conferencia[0])
await cliente.end()
