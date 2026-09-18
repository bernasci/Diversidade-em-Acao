/* ==========================================================================
   teste-carga.mjs — mede entradas simultâneas na API Vercel + Neon.

   Uso:
     npm run carga -- 200 --url https://preview.vercel.app
     npm run carga -- 200 --quiz --url https://preview.vercel.app

   O script cria contas descartáveis diretamente no Neon, aquece a aplicação,
   dispara todas as pessoas ao mesmo tempo e remove tudo ao terminar.
   ========================================================================== */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

function lerEnv() {
  const env = { ...process.env }
  for (const arquivo of ['.env', '.env.local']) {
    try {
      for (const linha of readFileSync(resolve(process.cwd(), arquivo), 'utf8').split(/\r?\n/)) {
        const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    } catch {
      /* arquivo opcional */
    }
  }
  return env
}

const argumento = (nome) => {
  const i = process.argv.indexOf(nome)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const env = lerEnv()
const BASE = String(argumento('--url') || env.TESTE_URL || '').replace(/\/$/, '')
const QUANTOS = Number(process.argv[2] || 100)
const COM_QUIZ = process.argv.includes('--quiz')
const LIMITE_MS = Number(argumento('--timeout') || 15_000)

if (!BASE || !env.DATABASE_URL_UNPOOLED) throw new Error('Informe --url e configure DATABASE_URL_UNPOOLED.')
if (!Number.isInteger(QUANTOS) || QUANTOS < 1 || QUANTOS > 2_000) throw new Error('Quantidade inválida (1 a 2000).')

const lote = `carga-${Date.now()}`
const emails = Array.from({ length: QUANTOS + 1 }, (_, i) => `${lote}-${i}@teste.local`)
const db = new pg.Client({ connectionString: env.DATABASE_URL_UNPOOLED })
await db.connect()

async function preparar() {
  await db.query(
    `insert into public.elegiveis (email, nome, area, empresa)
     select email, 'Teste de Carga ' || ordem, 'Carga', 'QA'
     from unnest($1::text[]) with ordinality as t(email, ordem)`,
    [emails],
  )
}

async function limpar() {
  await db.query('delete from public.jogadores where email = any($1::text[])', [emails])
  await db.query('delete from public.elegiveis where email = any($1::text[])', [emails])
}

async function chamar(caminho, corpo, token) {
  const inicio = performance.now()
  try {
    const r = await fetch(`${BASE}/api/${caminho}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { 'x-sessao': token } : {}) },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(LIMITE_MS),
    })
    const dados = await r.json().catch(() => null)
    return { ok: r.ok, status: r.status, dados, ms: performance.now() - inicio }
  } catch (erro) {
    return { ok: false, status: erro?.name === 'TimeoutError' ? 'timeout' : 'rede', dados: null, ms: performance.now() - inicio }
  }
}

async function umaPessoa(email) {
  const entrada = await chamar('entrar', { email })
  if (!entrada.ok || !COM_QUIZ) return entrada

  const quiz = await chamar(
    'jogar',
    { acao: 'responder', missao: 'm1', pergunta: 0, escolha: 1 },
    entrada.dados?.token,
  )
  return { ...quiz, ms: entrada.ms + quiz.ms }
}

const percentil = (lista, p) => {
  const ordenada = [...lista].sort((a, b) => a - b)
  return Math.round(ordenada[Math.min(ordenada.length - 1, Math.ceil((p / 100) * ordenada.length) - 1)])
}

try {
  await preparar()

  const aquecimento = await umaPessoa(emails[0])
  if (!aquecimento.ok) throw new Error(`Aquecimento falhou com status ${aquecimento.status}.`)

  console.log(`Disparando ${QUANTOS} entradas simultâneas${COM_QUIZ ? ' + uma resposta por pessoa' : ''}…`)
  const inicio = performance.now()
  const resultados = await Promise.all(emails.slice(1).map(umaPessoa))
  const duracao = Math.round(performance.now() - inicio)

  const sucessos = resultados.filter((r) => r.ok)
  const falhas = resultados.filter((r) => !r.ok)
  const tempos = sucessos.map((r) => r.ms)
  const porStatus = {}
  for (const falha of falhas) porStatus[falha.status] = (porStatus[falha.status] ?? 0) + 1

  const resultado = {
    concorrencia: QUANTOS,
    fluxo: COM_QUIZ ? 'entrada+quiz' : 'entrada',
    sucesso: sucessos.length,
    falhas: falhas.length,
    taxa_sucesso: `${((sucessos.length / QUANTOS) * 100).toFixed(1)}%`,
    tempo_total_ms: duracao,
    p50_ms: tempos.length ? percentil(tempos, 50) : null,
    p95_ms: tempos.length ? percentil(tempos, 95) : null,
    max_ms: tempos.length ? Math.round(Math.max(...tempos)) : null,
    falhas_por_status: porStatus,
  }
  console.log(JSON.stringify(resultado, null, 2))
  process.exitCode = falhas.length ? 2 : 0
} finally {
  await limpar()
  await db.end()
}
