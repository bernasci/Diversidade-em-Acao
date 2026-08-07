/* ==========================================================================
   api.ts — único ponto de contato com o Supabase.

   Duas portas, e só duas:

   1. As Edge Functions `entrar` e `jogar`, que rodam com service_role e são
      as donas de tudo que dá vantagem (gabarito, pontos, progresso).
   2. A view materializada `ranking_publico`, lida direto com a anon key —
      é a ÚNICA coisa no banco que `anon` enxerga.

   Não existe cliente do Supabase aqui, de propósito: o SDK pesa mais que o
   app inteiro e as duas chamadas que fazemos são `fetch` de dez linhas. Foi
   a mesma decisão do DOME GAMES (`app/js/nucleo/supabase.js`), e pelo mesmo
   motivo: isto abre no 4G, no celular de quem está trabalhando.
   ========================================================================== */

import { ErroApi, type CodigoErro, type EstadoServidor, type LinhaRanking, type RespostaCredito, type RespostaEntrar, type RespostaQuiz, type IdMissao } from './tipos'
import { lerToken } from './sessao'
import { SUPABASE_ANON_PADRAO, SUPABASE_URL_PADRAO } from './projeto'

/* O `.env` vence os valores de `projeto.ts`. Assim o app funciona ao clonar e
   ao publicar, sem configuração nenhuma, e ainda dá para apontar para um
   banco de homologação sem tocar no código. */
const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL_PADRAO) as string
const ANON = (import.meta.env.VITE_SUPABASE_ANON || SUPABASE_ANON_PADRAO) as string

export const CONFIGURADO = Boolean(URL_BASE && ANON)

/* Só aparece se alguém esvaziar os valores de `projeto.ts` — o que é um jeito
   legítimo de forçar a configuração por ambiente, então a mensagem explica os
   dois caminhos. */
export const MENSAGEM_SEM_CONFIG = import.meta.env.DEV
  ? 'O app não está conectado a nenhum banco. Preencha src/nucleo/projeto.ts ou defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON no .env, e reinicie o servidor.'
  : 'O app não está conectado a nenhum banco. Preencha src/nucleo/projeto.ts ou defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON nas variáveis de ambiente, e publique de novo.'

const TEMPO_LIMITE = 15_000

function cabecalhos(comSessao: boolean): HeadersInit {
  const h: Record<string, string> = {
    'content-type': 'application/json',
    apikey: ANON,
    authorization: `Bearer ${ANON}`,
  }
  if (comSessao) {
    const t = lerToken()
    if (t) h['x-sessao'] = t
  }
  return h
}

async function chamar<T>(funcao: 'entrar' | 'jogar', corpo: unknown, comSessao = true): Promise<T> {
  if (!CONFIGURADO) {
    // Guarda de última instância. A tela de entrada já bloqueia o envio antes
    // de chegar aqui — se esta linha disparar, é chamada de outro lugar.
    throw new ErroApi('nao-configurado', MENSAGEM_SEM_CONFIG)
  }

  // AbortSignal.timeout é o que impede a tela de ficar em "carregando" para
  // sempre quando o 4G cai no meio da requisição.
  let resposta: Response
  try {
    resposta = await fetch(`${URL_BASE}/functions/v1/${funcao}`, {
      method: 'POST',
      headers: cabecalhos(comSessao),
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    })
  } catch {
    throw new ErroApi('sem-conexao', 'Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.')
  }

  let dados: unknown = null
  try {
    dados = await resposta.json()
  } catch {
    /* corpo vazio ou não-JSON: tratado abaixo pelo status */
  }

  if (!resposta.ok) {
    const d = dados as { erro?: string; mensagem?: string } | null
    const codigo = (d?.erro ?? 'desconhecido') as CodigoErro
    throw new ErroApi(codigo, d?.mensagem ?? mensagemPadrao(codigo))
  }

  return dados as T
}

function mensagemPadrao(codigo: CodigoErro): string {
  switch (codigo) {
    case 'nao-elegivel':
      return 'Esse e-mail não está na lista de participantes. Fale com o RH para ser incluído.'
    case 'sessao-invalida':
      return 'Sua sessão expirou. Entre novamente com seu e-mail.'
    case 'muitas-tentativas':
      return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
    case 'sem-conexao':
      return 'Não conseguimos falar com o servidor. Verifique sua conexão.'
    default:
      return 'Algo deu errado do nosso lado. Tente de novo em instantes.'
  }
}

/* ------------------------------ CHAMADAS ------------------------------- */

export const entrar = (email: string) =>
  chamar<RespostaEntrar>('entrar', { email }, false)

export const buscarEstado = () =>
  chamar<EstadoServidor>('jogar', { acao: 'estado' })

export const responderQuiz = (missao: IdMissao, pergunta: number, escolha: number) =>
  chamar<RespostaQuiz>('jogar', { acao: 'responder', missao, pergunta, escolha })

/** `resultado` é o placar do mini-game: acertos, total de rodadas e tempo. */
export const concluirJogo = (missao: IdMissao, resultado: { acertos: number; total: number; segundos: number }) =>
  chamar<RespostaCredito>('jogar', { acao: 'jogo-concluir', missao, resultado })

export const pedirBonus = () =>
  chamar<RespostaCredito>('jogar', { acao: 'bonus' })

export const salvarPerfil = (mudanca: { emoji?: string; cor?: string; opt_in?: boolean }) =>
  chamar<{ jogador: EstadoServidor['jogador'] }>('jogar', { acao: 'perfil', ...mudanca })

/** Primeiro nome + último sobrenome, para caber numa linha. O ranking já
    recebe assim da view; aqui é para as telas que têm o nome completo. */
export function nomeCurto(nome: string): string {
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (partes.length <= 1) return partes[0] ?? ''
  return `${partes[0]} ${partes[partes.length - 1]}`
}

/* ------------------------------- RANKING -------------------------------
   Leitura direta na view materializada. É o único endpoint do PostgREST
   aberto ao `anon`, e ele expõe o nome já encurtado, área, empresa, avatar e
   pontos de quem optou por aparecer — nunca e-mail, nome completo ou id.

   Sem polling: quem quiser ver de novo, recarrega. Com 5.602 pessoas, um
   `setInterval` de 15s como o do DOME GAMES estoura sozinho os 5 GB de
   egress do plano Free.
   ------------------------------------------------------------------------ */
export async function buscarRanking(limite = 100): Promise<LinhaRanking[]> {
  if (!CONFIGURADO) return []
  const url = `${URL_BASE}/rest/v1/ranking_publico?select=posicao,nome,area,empresa,emoji,cor,pts&order=posicao.asc&limit=${limite}`
  try {
    const r = await fetch(url, {
      headers: { apikey: ANON, authorization: `Bearer ${ANON}` },
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    })
    if (!r.ok) return []
    return (await r.json()) as LinhaRanking[]
  } catch {
    return []
  }
}
