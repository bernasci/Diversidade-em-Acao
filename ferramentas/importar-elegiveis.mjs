/* ==========================================================================
   importar-elegiveis.mjs — a lista do RH vira a tabela `elegiveis`.

   Uso:
     node ferramentas/importar-elegiveis.mjs ferramentas/lista.csv
     node ferramentas/importar-elegiveis.mjs ferramentas/lista.csv --simular

   O CSV precisa de um cabeçalho com, no mínimo, uma coluna de e-mail. Os
   nomes aceitos são generosos de propósito — o arquivo vem do RH, exportado
   do Excel, e ninguém deveria ter de renomear coluna para importar:

     email | e-mail | mail            → obrigatória
     nome  | colaborador             → opcional
     area  | área | setor | departamento → opcional
     matricula | matrícula | chapa    → opcional

   IDEMPOTENTE: rodar de novo com a lista corrigida atualiza as linhas
   existentes em vez de duplicar. É para ser rodado várias vezes mesmo — a
   lista do RH sempre volta com correção.

   Precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env. A
   service_role ignora RLS: nunca a coloque em nada que vá para o navegador.
   ========================================================================== */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LOTE = 500

/* ------------------------------ ambiente -------------------------------- */
function lerEnv() {
  const env = { ...process.env }
  try {
    const bruto = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const linha of bruto.split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* sem .env: talvez as variáveis venham do ambiente */
  }
  return env
}

/* --------------------------------- CSV ----------------------------------
   Parser pequeno, mas que aguenta o que o Excel produz: aspas, ponto e
   vírgula como separador (padrão do Excel em português) e BOM no começo. */
function separador(cabecalho) {
  const conta = (c) => (cabecalho.match(new RegExp(`\\${c}`, 'g')) ?? []).length
  return conta(';') > conta(',') ? ';' : ','
}

function analisar(texto) {
  const limpo = texto.replace(/^﻿/, '')
  const linhas = limpo.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (linhas.length === 0) return []

  const sep = separador(linhas[0])
  const campos = (linha) => {
    const saida = []
    let atual = ''
    let entreAspas = false
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i]
      if (entreAspas) {
        if (c === '"' && linha[i + 1] === '"') {
          atual += '"'
          i++
        } else if (c === '"') entreAspas = false
        else atual += c
      } else if (c === '"') entreAspas = true
      else if (c === sep) {
        saida.push(atual)
        atual = ''
      } else atual += c
    }
    saida.push(atual)
    return saida.map((v) => v.trim())
  }

  // NFD + remoção dos acentos combinantes (U+0300–U+036F): assim "área" e
  // "matrícula" no cabeçalho do Excel casam com 'area' e 'matricula'.
  const cabecalho = campos(linhas[0]).map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
  )

  const acha = (...nomes) => cabecalho.findIndex((h) => nomes.includes(h))
  const iEmail = acha('email', 'e-mail', 'mail', 'e mail')
  const iNome = acha('nome', 'colaborador', 'nome completo')
  const iArea = acha('area', 'setor', 'departamento', 'lotacao')
  const iMat = acha('matricula', 'chapa', 'registro')

  if (iEmail === -1) {
    throw new Error(
      `Não encontrei a coluna de e-mail. Cabeçalho lido: ${cabecalho.join(' | ')}`,
    )
  }

  const vistos = new Set()
  const saida = []
  for (let n = 1; n < linhas.length; n++) {
    const c = campos(linhas[n])
    const email = String(c[iEmail] ?? '').trim().toLowerCase()
    if (!email) continue
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      console.warn(`  linha ${n + 1}: e-mail ignorado por formato inválido — "${email}"`)
      continue
    }
    if (vistos.has(email)) continue // duplicado na própria planilha
    vistos.add(email)
    saida.push({
      email,
      nome: iNome === -1 ? null : c[iNome] || null,
      area: iArea === -1 ? null : c[iArea] || null,
      matricula: iMat === -1 ? null : c[iMat] || null,
    })
  }
  return saida
}

/* -------------------------------- envio ---------------------------------- */
async function enviar(url, chave, linhas) {
  const r = await fetch(`${url}/rest/v1/elegiveis`, {
    method: 'POST',
    headers: {
      apikey: chave,
      authorization: `Bearer ${chave}`,
      'content-type': 'application/json',
      // merge-duplicates é o que torna o script re-executável.
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(linhas),
  })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${await r.text()}`)
}

/* --------------------------------- main ---------------------------------- */
const arquivo = process.argv[2]
const simular = process.argv.includes('--simular')

if (!arquivo) {
  console.error('Uso: node ferramentas/importar-elegiveis.mjs <arquivo.csv> [--simular]')
  process.exit(1)
}

const env = lerEnv()
const URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const CHAVE = env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || (!CHAVE && !simular)) {
  console.error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.')
  process.exit(1)
}

const linhas = analisar(readFileSync(resolve(arquivo), 'utf8'))
console.log(`Lidas ${linhas.length} pessoas de ${arquivo}.`)

if (linhas.length === 0) {
  console.error('Nada a importar.')
  process.exit(1)
}

console.log('Amostra das três primeiras:')
for (const l of linhas.slice(0, 3)) console.log('  ', l)

if (simular) {
  console.log('\n--simular: nada foi enviado ao banco.')
  process.exit(0)
}

let enviadas = 0
for (let i = 0; i < linhas.length; i += LOTE) {
  const lote = linhas.slice(i, i + LOTE)
  await enviar(URL, CHAVE, lote)
  enviadas += lote.length
  console.log(`  ${enviadas}/${linhas.length}…`)
}

console.log(`\nPronto. ${enviadas} pessoas na lista de elegíveis.`)
