/* ==========================================================================
   teste-carga.mjs — quantas pessoas ao mesmo tempo o plano Free aguenta?

   Uso:
     node ferramentas/teste-carga.mjs 200          # 200 entradas concorrentes
     node ferramentas/teste-carga.mjs 200 --quiz   # entra e ainda responde

   O que ele mede: latência p50/p95 e taxa de erro da Edge Function `entrar`
   sob concorrência. É o número que decide se o lançamento pode ser aberto
   para os 5.602 de uma vez ou se precisa ser escalonado por área.

   ANTES DE RODAR: crie os e-mails de teste na lista de elegíveis, senão tudo
   volta 403 e a medição não vale nada:

     insert into public.elegiveis (email, nome, area)
     select 'carga'||n||'@teste.local', 'Teste '||n, 'Carga'
     from generate_series(1, 500) n
     on conflict (email) do nothing;

   E DEPOIS, para não sujar o ranking e a contagem do RH:

     delete from public.jogadores where email like 'carga%@teste.local';
     delete from public.elegiveis where email like 'carga%@teste.local';
     select public.atualizar_ranking();
   ========================================================================== */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function lerEnv() {
  const env = { ...process.env }
  try {
    for (const linha of readFileSync(resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* sem .env */
  }
  return env
}

const env = lerEnv()
const URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON
const QUANTOS = Number(process.argv[2] || 100)
const COM_QUIZ = process.argv.includes('--quiz')

if (!URL || !ANON) {
  console.error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON no .env.')
  process.exit(1)
}

const cabecalhos = (extra = {}) => ({
  apikey: ANON,
  authorization: `Bearer ${ANON}`,
  'content-type': 'application/json',
  ...extra,
})

async function umaPessoa(n) {
  const t0 = performance.now()
  const r = await fetch(`${URL}/functions/v1/entrar`, {
    method: 'POST',
    headers: cabecalhos(),
    body: JSON.stringify({ email: `carga${n}@teste.local` }),
  })
  const ms = performance.now() - t0
  if (!r.ok) return { ok: false, ms, status: r.status }

  if (!COM_QUIZ) return { ok: true, ms }

  const { token } = await r.json()
  const t1 = performance.now()
  const r2 = await fetch(`${URL}/functions/v1/jogar`, {
    method: 'POST',
    headers: cabecalhos({ 'x-sessao': token }),
    body: JSON.stringify({ acao: 'responder', missao: 'm1', pergunta: 0, escolha: 1 }),
  })
  return { ok: r2.ok, ms: ms + (performance.now() - t1), status: r2.status }
}

const percentil = (lista, p) => {
  const ordenada = [...lista].sort((a, b) => a - b)
  return Math.round(ordenada[Math.min(ordenada.length - 1, Math.floor((p / 100) * ordenada.length))])
}

console.log(`Disparando ${QUANTOS} sessões concorrentes${COM_QUIZ ? ' + 1 resposta cada' : ''}…`)
const inicio = performance.now()
const resultados = await Promise.all(Array.from({ length: QUANTOS }, (_, i) => umaPessoa(i + 1)))
const total = performance.now() - inicio

const ok = resultados.filter((r) => r.ok)
const tempos = ok.map((r) => r.ms)
const falhas = resultados.filter((r) => !r.ok)

console.log(`\nTempo total .......... ${Math.round(total)} ms`)
console.log(`Sucesso .............. ${ok.length}/${QUANTOS}`)
if (tempos.length) {
  console.log(`Latência p50 ......... ${percentil(tempos, 50)} ms`)
  console.log(`Latência p95 ......... ${percentil(tempos, 95)} ms`)
  console.log(`Latência máxima ...... ${Math.round(Math.max(...tempos))} ms`)
}
if (falhas.length) {
  const porStatus = {}
  for (const f of falhas) porStatus[f.status] = (porStatus[f.status] ?? 0) + 1
  console.log(`Falhas por status .... ${JSON.stringify(porStatus)}`)
}

console.log(
  `\nLeitura: p95 acima de 2.000 ms com ${QUANTOS} concorrentes significa escalonar o lançamento por área` +
    ' ou subir para o plano Pro no mês da campanha.',
)
