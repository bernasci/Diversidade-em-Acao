import { banco, primeiroResultado } from './_lib/db.js'
import { CORS, corpoJson, erro, responderResultado } from './_lib/http.js'
import { hashToken } from './_lib/sessao.js'
import { encerrado, estaAberta, rotuloAbertura, rotuloEncerramento } from './_lib/calendario.js'

const MISSOES = ['m1', 'm2', 'm3']
const MOLDURAS = ['nenhuma', 'anel', 'duplo', 'solido', 'brilho', 'quadrado']

/* MISSÃO FECHADA NÃO CREDITA. A tela esconde a missão antes da data, mas a
   tela é conselho: quem chama esta função pelo DevTools pula o cadeado. O
   bloqueio de verdade é este, com o relógio do servidor. Vale para as duas
   ações que dão ponto — responder quiz e concluir jogo. `estado` e `perfil`
   não passam por aqui, porque ler o próprio progresso nunca é problema.

   O ENCERRAMENTO fecha tudo de uma vez, pelo mesmo caminho. `bonus` fica de
   fora de propósito: ele só paga a quem já completou as três missões, então
   não cria pontuação nova — e quem respondeu a última pergunta às 17:59:59
   não deve perder os 20 pontos porque a chamada seguinte chegou às 18:00:01. */
const fechada = (missao: string): Response | null =>
  encerrado()
    ? erro('etapa-bloqueada', `O jogo foi encerrado às ${rotuloEncerramento()}. Seus pontos estão garantidos.`, 403)
    : estaAberta(missao)
      ? null
      : erro('etapa-bloqueada', `Esta etapa abre na ${rotuloAbertura(missao)}.`, 403)

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
    if (req.method !== 'POST') return erro('metodo', 'Use POST.', 405)

    const token = req.headers.get('x-sessao')
    if (!token) return erro('sessao-invalida', 'Sua sessão expirou. Entre novamente com seu e-mail.', 401)

    const corpo = await corpoJson(req)
    if (!corpo) return erro('dados-invalidos', 'Corpo da requisição inválido.')

    const acao = String(corpo.acao ?? '')
    const hash = await hashToken(token)

    try {
      let linhas: Record<string, unknown>[]
      switch (acao) {
        case 'estado':
          linhas = await banco()`select public.app_estado(${hash}) as resultado` as Record<string, unknown>[]
          break

        case 'responder': {
          const missao = String(corpo.missao ?? '')
          const pergunta = Number(corpo.pergunta)
          const escolha = Number(corpo.escolha)
          if (!MISSOES.includes(missao) || !Number.isInteger(pergunta) || pergunta < 0 || pergunta >= 5 || !Number.isInteger(escolha) || escolha < 0 || escolha > 3) {
            return erro('dados-invalidos', 'Pergunta ou alternativa inválida.')
          }
          const bloqueio = fechada(missao)
          if (bloqueio) return bloqueio
          linhas = await banco()`select public.app_responder(${hash}, ${missao}, ${pergunta}, ${escolha}) as resultado` as Record<string, unknown>[]
          break
        }

        /* O relógio do bônus de rapidez começa aqui, no servidor. Recomeçar o
           jogo chama de novo e zera o relógio — ver `app_jogo_iniciar`. */
        case 'jogo-iniciar': {
          const missao = String(corpo.missao ?? '')
          const jogo = String(corpo.jogo ?? '')
          const bloqueio = fechada(missao)
          if (bloqueio) return bloqueio
          linhas = await banco()`select public.app_jogo_iniciar(${hash}, ${missao}, ${jogo}) as resultado` as Record<string, unknown>[]
          break
        }

        case 'jogo-concluir': {
          const missao = String(corpo.missao ?? '')
          const jogo = String(corpo.jogo ?? '')
          const bloqueio = fechada(missao)
          if (bloqueio) return bloqueio
          const r = corpo.resultado && typeof corpo.resultado === 'object'
            ? corpo.resultado as Record<string, unknown>
            : {}
          const acertos = Number(r.acertos) || 0
          const total = Number(r.total)
          const segundos = Number(r.segundos) || 0
          linhas = await banco()`select public.app_jogo_concluir(${hash}, ${missao}, ${jogo}, ${acertos}, ${total}, ${segundos}) as resultado` as Record<string, unknown>[]
          break
        }

        case 'bonus':
          linhas = await banco()`select public.app_bonus(${hash}) as resultado` as Record<string, unknown>[]
          break

        case 'perfil': {
          const emoji = typeof corpo.emoji === 'string' ? corpo.emoji.slice(0, 8) : null
          const cor = typeof corpo.cor === 'string' && /^#[0-9a-fA-F]{6}$/.test(corpo.cor) ? corpo.cor : null
          const moldura = typeof corpo.moldura === 'string' && MOLDURAS.includes(corpo.moldura) ? corpo.moldura : null
          const optIn = typeof corpo.opt_in === 'boolean' ? corpo.opt_in : null
          linhas = await banco()`select public.app_perfil(${hash}, ${emoji}, ${cor}, ${moldura}, ${optIn}) as resultado` as Record<string, unknown>[]
          break
        }

        default:
          return erro('dados-invalidos', `Ação desconhecida: ${acao}`)
      }

      return responderResultado(primeiroResultado(linhas))
    } catch (e) {
      console.error('[jogar]', acao, e)
      return erro('desconhecido', 'Algo deu errado do nosso lado. Tente novamente.', 500)
    }
  },
}
