/* Teste ponta a ponta da API Vercel + Neon. Cria dois QAs e limpa no fim. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const env = { ...process.env }
for (const arquivo of ['.env', '.env.local']) {
  try {
    for (const linha of readFileSync(resolve(process.cwd(), arquivo), 'utf8').split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* opcional */ }
}

const indiceUrl = process.argv.indexOf('--url')
const BASE = String(indiceUrl >= 0 ? process.argv[indiceUrl + 1] : env.TESTE_URL || '').replace(/\/$/, '')
if (!BASE || !env.DATABASE_URL_UNPOOLED) throw new Error('Informe --url e configure DATABASE_URL_UNPOOLED.')

const EMAIL = 'qa.descartavel@teste.local'
const EMAIL_DEDUZIDO = 'daniel.alves.qa@teste.local'
const db = new pg.Client({ connectionString: env.DATABASE_URL_UNPOOLED })
await db.connect()

let falhas = 0
const ok = (cond, nome, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ` :: ${extra}` : ''}`)
  if (!cond) falhas++
}

async function fn(nome, corpo, token) {
  const r = await fetch(`${BASE}/api/${nome}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { 'x-sessao': token } : {}) },
    body: JSON.stringify(corpo),
  })
  let d = null
  try { d = await r.json() } catch { /* corpo vazio */ }
  return { status: r.status, d }
}

async function limpar() {
  await db.query('delete from public.jogadores where email = any($1::text[])', [[EMAIL, EMAIL_DEDUZIDO]])
  await db.query('delete from public.elegiveis where email = any($1::text[])', [[EMAIL, EMAIL_DEDUZIDO]])
}

console.log('\n--- preparo ---')
await limpar()
await db.query(`
  insert into public.elegiveis (email,nome,area,empresa,matricula) values
    ($1,'Ana Descartavel de Testes','Testes','QA Ltda','9999'),
    ($2,null,'Testes',null,null)
`, [EMAIL, EMAIL_DEDUZIDO])

try {
  console.log('\n--- entrada e sessão ---')
  ok((await fn('entrar', { email: 'ninguem.mesmo@teste.local' })).status === 403, 'e-mail fora da lista recusado')
  const e = await fn('entrar', { email: EMAIL })
  ok(e.status === 200, 'entrada responde 200', String(e.status))
  ok(typeof e.d?.token === 'string' && e.d.token.length > 30, 'token opaco devolvido')
  ok(e.d?.jogador?.pts === 0 && e.d?.jogador?.opt_in === false, 'perfil começa sem pontos e fora do ranking')
  ok(e.d?.jogador?.nome === 'Ana Descartavel de Testes' && e.d?.jogador?.empresa === 'QA Ltda', 'cadastro vem da lista')
  ok(Array.isArray(e.d?.progresso) && e.d.progresso.length === 0, 'progresso começa vazio')
  const T = e.d.token

  const deduzido = await fn('entrar', { email: EMAIL_DEDUZIDO })
  ok(deduzido.d?.jogador?.nome === 'Daniel Alves Qa', 'nome deduzido do e-mail', deduzido.d?.jogador?.nome)
  ok(deduzido.d?.jogador?.empresa === 'Teste', 'empresa deduzida do domínio', deduzido.d?.jogador?.empresa)

  const tokens = await db.query('select token_hash from public.sessoes where jogador=(select id from public.jogadores where email=$1)', [EMAIL])
  ok(!tokens.rows.some((s) => s.token_hash === T), 'banco não guarda token em claro')
  ok((await fn('jogar', { acao: 'estado' }, `${T.slice(0, -3)}xxx`)).status === 401, 'token adulterado recusado')
  ok((await fn('jogar', { acao: 'estado' })).status === 401, 'requisição sem token recusada')

  console.log('\n--- quiz e pontuação ---')
  const c1 = await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 0, escolha: 1 }, T)
  ok(c1.d?.certo === true && c1.d?.pontos === 2 && c1.d?.total === 2, 'acerto credita 2 pontos')
  ok(typeof c1.d?.explicacao === 'string' && c1.d.explicacao.length > 40, 'explicação vem do servidor')
  const repetida = await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 0, escolha: 1 }, T)
  ok(repetida.d?.ja === true && repetida.d?.pontos === 0 && repetida.d?.total === 2, 'repetição não pontua')
  const errada = await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 1, escolha: 0 }, T)
  ok(errada.d?.certo === false && errada.d?.pontos === 0 && errada.d?.resposta === 2, 'erro é registrado e revela resposta')
  ok((await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 99, escolha: 0 }, T)).status === 400, 'pergunta inválida recusada')

  console.log('\n--- mini-game e bônus ---')
  const jogo = await fn('jogar', { acao: 'jogo-concluir', missao: 'm1', jogo: 'memoria', resultado: { acertos: 6, total: 6, segundos: 42 } }, T)
  ok(jogo.d?.pontos === 10 && jogo.d?.total === 12, 'mini-game credita 10 pontos')
  const jogo2 = await fn('jogar', { acao: 'jogo-concluir', missao: 'm1', jogo: 'memoria', resultado: { acertos: 6, total: 6, segundos: 9 } }, T)
  ok(jogo2.d?.ja === true && jogo2.d?.pontos === 0, 'mini-game repetido não pontua')
  ok((await fn('jogar', { acao: 'jogo-concluir', missao: 'm2', jogo: 'mito', resultado: { acertos: 3, total: 3 } }, T)).status === 400, 'resultado impossível recusado')
  const bonus = await fn('jogar', { acao: 'bonus' }, T)
  ok(bonus.d?.ja === false && bonus.d?.pontos === 0 && bonus.d?.total === 12, 'bônus negado antes da conclusão')

  console.log('\n--- perfil e ranking ---')
  const perfil = await fn('jogar', { acao: 'perfil', emoji: '@ini', cor: '#00BBDC', moldura: 'anel', opt_in: true }, T)
  ok(perfil.d?.jogador?.emoji === '@ini' && perfil.d?.jogador?.moldura === 'anel', 'avatar completo salvo')
  const protegido = await fn('jogar', { acao: 'perfil', pts: 9999, nome: 'Impostor', area: 'Diretoria', empresa: 'Outra' }, T)
  ok(protegido.d?.jogador?.pts === 12 && protegido.d?.jogador?.nome === 'Ana Descartavel de Testes', 'campos protegidos ignorados')

  const rankingResposta = await fetch(`${BASE}/api/ranking?limit=100`)
  const ranking = await rankingResposta.json()
  const linha = ranking.find((l) => l.nome === 'Ana Testes')
  ok(rankingResposta.status === 200 && !!linha, 'participante opt-in aparece no ranking')
  ok(linha?.emoji === 'AT' && linha?.moldura === 'anel' && linha?.pts === 12, 'ranking resolve avatar e pontos')
  ok(linha && !('email' in linha) && !('id' in linha) && !('matricula' in linha), 'ranking não expõe dados privados')

  console.log('\n--- retomada ---')
  const estado = await fn('jogar', { acao: 'estado' }, T)
  ok(estado.d?.progresso?.length === 3 && estado.d?.jogador?.pts === 12, 'sessão retoma progresso e placar')
  ok(estado.d.progresso.reduce((n, l) => n + l.pontos, 0) === 12, 'placar bate com livro-caixa')
} finally {
  console.log('\n--- faxina ---')
  await limpar()
  const sobrou = await db.query('select count(*)::integer as n from public.elegiveis where email = any($1::text[])', [[EMAIL, EMAIL_DEDUZIDO]])
  ok(sobrou.rows[0].n === 0, 'QAs descartáveis removidos')
  await db.end()
}

console.log(`\n${falhas === 0 ? 'TUDO PASSOU' : `${falhas} FALHA(S)`}\n`)
process.exit(falhas === 0 ? 0 : 1)
