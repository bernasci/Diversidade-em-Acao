/* ==========================================================================
   api.ts — único ponto de contato do navegador com o servidor.

   Duas portas, e só duas:

   1. As funções Vercel `entrar` e `jogar`, que são as donas de tudo que dá
      vantagem (gabarito, pontos, progresso).
   2. A função pública `ranking`, que devolve somente os campos exibidos.

   Não existe cliente de banco no navegador. O segredo do Neon vive apenas na
   Vercel e o front faz `fetch` para o próprio domínio.
   ========================================================================== */

import { ErroApi, type CodigoErro, type EstadoServidor, type LinhaRanking, type RespostaCredito, type RespostaEntrar, type RespostaQuiz, type IdMissao } from './tipos'
import type { TipoJogo } from '../conteudo/missoes'
import { lerToken } from './sessao'

/* Em produção a API mora no mesmo domínio do site. `VITE_API_URL` existe só
   para desenvolvimento e para testar uma implantação de preview. */
const URL_BASE = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const CONFIGURADO = true
export const MENSAGEM_SEM_CONFIG = ''

const TEMPO_POR_TENTATIVA = 12_000
const TENTATIVAS = 2

function cabecalhos(comSessao: boolean): HeadersInit {
  const h: Record<string, string> = {
    'content-type': 'application/json',
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

  // Uma segunda tentativa curta absorve picos de conexão no início do evento.
  // As operações do servidor são idempotentes: repetir nunca duplica pontos.
  let resposta: Response | null = null
  for (let tentativa = 0; tentativa < TENTATIVAS && !resposta; tentativa++) {
    try {
      resposta = await fetch(`${URL_BASE}/api/${funcao}`, {
        method: 'POST',
        headers: cabecalhos(comSessao),
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(TEMPO_POR_TENTATIVA),
      })
    } catch {
      if (tentativa + 1 < TENTATIVAS) {
        await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 500))
      }
    }
  }
  if (!resposta) {
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

/** `jogo` é o tipo do mini-game (`memoria`, `ligar`…) — a missão tem mais de
    um, e é ele que diz qual está sendo creditado. `resultado` é o placar:
    acertos, total de rodadas e tempo. */
export const concluirJogo = (
  missao: IdMissao,
  jogo: TipoJogo,
  resultado: { acertos: number; total: number; segundos: number },
) => chamar<RespostaCredito>('jogar', { acao: 'jogo-concluir', missao, jogo, resultado })

export const pedirBonus = () =>
  chamar<RespostaCredito>('jogar', { acao: 'bonus' })

export const salvarPerfil = (mudanca: { emoji?: string; cor?: string; moldura?: string; opt_in?: boolean }) =>
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
   A API devolve nome já encurtado, área, empresa, avatar e pontos de quem
   optou por aparecer — nunca e-mail, nome completo ou id.

   Sem polling: quem quiser ver de novo, recarrega. Com 5.602 pessoas, um
   `setInterval` de 15s como o do DOME GAMES estoura sozinho os 5 GB de
   egress do plano Free.
   ------------------------------------------------------------------------ */
export async function buscarRanking(limite = 100): Promise<LinhaRanking[]> {
  const url = `${URL_BASE}/api/ranking?limit=${limite}`
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    })
    if (!r.ok) return []
    return (await r.json()) as LinhaRanking[]
  } catch {
    return []
  }
}
