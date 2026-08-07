/* ==========================================================================
   fumaca.mjs — teste de fumaça ponta a ponta, contra o projeto REAL.

   Uso:  npm run fumaca

   Cria um elegível de QA descartável, joga por cima dele, confere 40
   afirmações sobre regra de negócio e segurança, e apaga tudo no fim. Não
   toca em nenhuma conta de verdade.

   Rode depois de qualquer mudança nas Edge Functions, nas migrations ou nas
   regras de pontuação. O que ele protege é justamente o que não dá para ver
   olhando a tela: idempotência, gabarito fora do cliente, campos que o
   jogador não pode escrever e o que a view do ranking expõe.

   Precisa de VITE_SUPABASE_URL, VITE_SUPABASE_ANON e
   SUPABASE_SERVICE_ROLE_KEY no .env.
   ========================================================================== */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const env = {}
try {
  for (const l of readFileSync(resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* sem .env */
}

const U = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON
const SR = env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = 'qa.descartavel@teste.local'

if (!U || !ANON || !SR) {
  console.error('Faltam VITE_SUPABASE_URL, VITE_SUPABASE_ANON ou SUPABASE_SERVICE_ROLE_KEY no .env.')
  process.exit(1)
}

let falhas = 0
const ok = (cond, nome, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' :: ' + extra : ''}`)
  if (!cond) falhas++
}

const rest = (caminho, opts = {}) =>
  fetch(`${U}/rest/v1/${caminho}`, {
    ...opts,
    headers: {
      apikey: SR,
      authorization: `Bearer ${SR}`,
      'content-type': 'application/json',
      ...(opts.headers || {}),
    },
  })

const comoAnon = (caminho) =>
  fetch(`${U}/rest/v1/${caminho}`, { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } })

async function fn(nome, corpo, token) {
  const r = await fetch(`${U}/functions/v1/${nome}`, {
    method: 'POST',
    headers: {
      apikey: ANON,
      authorization: `Bearer ${ANON}`,
      'content-type': 'application/json',
      ...(token ? { 'x-sessao': token } : {}),
    },
    body: JSON.stringify(corpo),
  })
  let d = null
  try {
    d = await r.json()
  } catch {
    /* corpo vazio */
  }
  return { status: r.status, d }
}

async function limpar() {
  await rest(`jogadores?email=eq.${EMAIL}`, { method: 'DELETE' })
  await rest(`elegiveis?email=eq.${EMAIL}`, { method: 'DELETE' })
}

/* ------------------------------------------------------ portas fechadas -- */
console.log('\n--- o que o navegador NÃO alcança ---')
for (const t of ['jogadores', 'elegiveis', 'quiz_gabarito', 'progresso', 'sessoes']) {
  const r = await comoAnon(`${t}?select=*&limit=1`)
  ok(r.status === 401 || r.status === 403, `${t} bloqueado para anon`, String(r.status))
}
ok((await comoAnon('ranking_publico?select=*&limit=1')).status === 200, 'ranking_publico aberto (exceção deliberada)')

/* -------------------------------------------------------------- preparo -- */
console.log('\n--- preparo ---')
await limpar() // resíduo de uma execução interrompida
await rest('elegiveis', {
  method: 'POST',
  headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify([
    { email: EMAIL, nome: 'Ana Descartavel de Testes', area: 'Testes', empresa: 'QA Ltda', matricula: '9999' },
  ]),
})
console.log('  elegível de QA criado')

try {
  /* --------------------------------------------------------------- entrar -- */
  console.log('\n--- entrar ---')
  const fora = await fn('entrar', { email: 'ninguem.mesmo@teste.local' })
  ok(fora.status === 403, 'e-mail fora da lista é recusado', String(fora.status))

  const e = await fn('entrar', { email: EMAIL })
  ok(e.status === 200, 'entrar responde 200', String(e.status))
  ok(typeof e.d?.token === 'string' && e.d.token.length > 30, 'devolve token opaco')
  ok(e.d?.jogador?.pts === 0, 'placar começa em zero', String(e.d?.jogador?.pts))
  ok(e.d?.jogador?.opt_in === false, 'opt_in do ranking nasce FALSO')
  ok(e.d?.jogador?.nome === 'Ana Descartavel de Testes', 'nome completo veio da lista do RH')
  ok(e.d?.jogador?.apelido === undefined, 'apelido NÃO chega mais ao app')
  ok(e.d?.jogador?.area === 'Testes', 'área veio da lista do RH')
  ok(e.d?.jogador?.empresa === 'QA Ltda', 'empresa veio da lista do RH')
  ok(Array.isArray(e.d?.progresso) && e.d.progresso.length === 0, 'progresso começa vazio')
  const T = e.d.token

  console.log('\n--- sessão ---')
  const sess = await (await rest('sessoes?select=token_hash&limit=50')).json()
  ok(!sess.some((s) => s.token_hash === T), 'o banco NÃO guarda o token em claro')
  ok((await fn('jogar', { acao: 'estado' }, T.slice(0, -3) + 'xxx')).status === 401, 'token adulterado é recusado')
  ok((await fn('jogar', { acao: 'estado' })).status === 401, 'sem token é recusado')

  /* ----------------------------------------------------------------- quiz -- */
  console.log('\n--- quiz (o gabarito mora no servidor) ---')
  const c1 = await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 0, escolha: 1 }, T)
  ok(c1.d?.certo === true, 'acerto reconhecido')
  ok(c1.d?.pontos === 2, 'acerto vale 2 pontos', String(c1.d?.pontos))
  ok(c1.d?.total === 2, 'total autoritativo = 2', String(c1.d?.total))
  ok(typeof c1.d?.explicacao === 'string' && c1.d.explicacao.length > 40, 'explicação veio junto')

  const c1r = await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 0, escolha: 1 }, T)
  ok(c1r.d?.ja === true && c1r.d?.pontos === 0, 'responder de novo não credita')
  ok(c1r.d?.total === 2, 'total continua 2', String(c1r.d?.total))

  const c2 = await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 1, escolha: 0 }, T)
  ok(c2.d?.certo === false && c2.d?.pontos === 0, 'erro reconhecido e não pontua')
  ok(c2.d?.resposta === 2, 'revela a certa DEPOIS de responder', String(c2.d?.resposta))

  const c3 = await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 1, escolha: 2 }, T)
  ok(c3.d?.ja === true && c3.d?.total === 2, 'não dá para tentar de novo até acertar')

  ok((await fn('jogar', { acao: 'responder', missao: 'm1', pergunta: 99, escolha: 0 }, T)).status === 400, 'pergunta inexistente recusada')
  ok((await fn('jogar', { acao: 'responder', missao: 'mX', pergunta: 0, escolha: 0 }, T)).status === 400, 'missão inexistente recusada')

  /* ------------------------------------------------------------ mini-game -- */
  console.log('\n--- mini-game ---')
  const j1 = await fn('jogar', { acao: 'jogo-concluir', missao: 'm1', resultado: { acertos: 6, total: 6, segundos: 42 } }, T)
  ok(j1.d?.pontos === 10, 'mini-game vale 10', String(j1.d?.pontos))
  ok(j1.d?.total === 12, 'total = 12', String(j1.d?.total))

  const j2 = await fn('jogar', { acao: 'jogo-concluir', missao: 'm1', resultado: { acertos: 6, total: 6, segundos: 9 } }, T)
  ok(j2.d?.ja === true && j2.d?.pontos === 0, 'concluir de novo não credita')
  ok((await fn('jogar', { acao: 'jogo-concluir', missao: 'm2', resultado: { acertos: 3, total: 3 } }, T)).status === 400, 'resultado com tamanho errado é recusado')

  /* ---------------------------------------------------------------- bônus -- */
  console.log('\n--- bônus ---')
  const b = await fn('jogar', { acao: 'bonus' }, T)
  ok(b.d?.pontos === 0 && b.d?.ja === false, 'bônus negado com a jornada incompleta')
  ok(b.d?.total === 12, 'e não mexe no placar', String(b.d?.total))

  /* --------------------------------------------------------------- perfil -- */
  console.log('\n--- perfil: só o que é cosmético ---')
  const p1 = await fn('jogar', { acao: 'perfil', emoji: '🚀', cor: '#00BBDC', opt_in: true }, T)
  ok(p1.d?.jogador?.emoji === '🚀', 'avatar salvo')
  ok(p1.d?.jogador?.opt_in === true, 'entrou no ranking')

  const p2 = await fn(
    'jogar',
    { acao: 'perfil', pts: 9999, nome: 'Impostor', area: 'Diretoria', empresa: 'Outra', email: 'outro@x.com' },
    T,
  )
  ok(p2.d?.jogador?.pts === 12, 'escrever pts é IGNORADO', String(p2.d?.jogador?.pts))
  ok(p2.d?.jogador?.nome === 'Ana Descartavel de Testes', 'trocar o nome é ignorado')
  ok(p2.d?.jogador?.area === 'Testes', 'trocar a área é ignorada')
  ok(p2.d?.jogador?.empresa === 'QA Ltda', 'trocar a empresa é ignorada')
  ok(p2.d?.jogador?.email === EMAIL, 'trocar o e-mail é ignorado')

  /* -------------------------------------------------------------- ranking -- */
  console.log('\n--- ranking público ---')
  const rk = await (await comoAnon('ranking_publico?select=*')).json()
  const linha = rk.find((l) => l.nome === 'Ana Testes')
  ok(!!linha, 'quem optou aparece, com primeiro nome + último sobrenome')
  ok(linha?.pts === 12 && linha?.area === 'Testes' && linha?.empresa === 'QA Ltda', 'com pontos, área e empresa')
  ok(
    linha && !('email' in linha) && !('id' in linha) && !('matricula' in linha),
    'a view NÃO expõe e-mail, id nem matrícula',
  )
  ok(
    !rk.some((l) => String(l.nome).includes('Descartavel')),
    'o nome COMPLETO não sai da view — só o encurtado',
  )

  await fn('jogar', { acao: 'perfil', opt_in: false }, T)
  const rk2 = await (await comoAnon('ranking_publico?select=*')).json()
  ok(!rk2.some((l) => l.nome === 'Ana Testes'), 'quem sai some da lista')

  /* --------------------------------------------------------------- estado -- */
  console.log('\n--- estado retomado ---')
  const st = await fn('jogar', { acao: 'estado' }, T)
  ok(st.d?.progresso?.length === 3, 'progresso tem 3 linhas', String(st.d?.progresso?.length))
  ok(st.d?.jogador?.pts === 12, 'placar do servidor = 12', String(st.d?.jogador?.pts))
  const soma = st.d.progresso.reduce((n, l) => n + l.pontos, 0)
  ok(soma === 12, 'placar bate com a soma do livro-caixa', String(soma))
} finally {
  /* Sempre limpa, mesmo se um teste explodir no meio: um QA esquecido no
     banco polui o ranking e a contagem de adesão do RH. */
  console.log('\n--- faxina ---')
  await limpar()
  const sobrou = await (await rest(`jogadores?select=email&email=eq.${EMAIL}`)).json()
  ok(Array.isArray(sobrou) && sobrou.length === 0, 'usuário de QA removido (cascata leva progresso e sessões)')
}

console.log(`\n${falhas === 0 ? 'TUDO PASSOU' : falhas + ' FALHA(S)'}\n`)
process.exit(falhas === 0 ? 0 : 1)
