import { banco, primeiroResultado } from './_lib/db.js'
import { CORS, corpoJson, erro, responderResultado } from './_lib/http.js'
import { hashToken } from './_lib/sessao.js'

const MISSOES = ['m1', 'm2', 'm3']
const MOLDURAS = ['nenhuma', 'anel', 'duplo', 'solido', 'brilho', 'quadrado']

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
          linhas = await banco()`select public.app_responder(${hash}, ${missao}, ${pergunta}, ${escolha}) as resultado` as Record<string, unknown>[]
          break
        }

        case 'jogo-concluir': {
          const missao = String(corpo.missao ?? '')
          const jogo = String(corpo.jogo ?? '')
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
