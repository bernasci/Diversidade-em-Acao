import { banco, primeiroResultado } from './_lib/db.js'
import { CORS, corpoJson, erro, json, responderResultado } from './_lib/http.js'
import { hashToken, normalizarEmail, novoToken } from './_lib/sessao.js'

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
    if (req.method !== 'POST') return erro('metodo', 'Use POST.', 405)

    const corpo = await corpoJson(req)
    if (!corpo) return erro('dados-invalidos', 'Corpo da requisição inválido.')

    const email = normalizarEmail(corpo.email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return erro('dados-invalidos', 'Digite seu e-mail completo, no formato nome@empresa.com.br.')
    }

    try {
      const token = novoToken()
      const hash = await hashToken(token)
      const expira = new Date(Date.now() + 30 * 86_400_000).toISOString()
      const linhas = await banco()`select public.app_entrar(${email}, ${hash}, ${expira}::timestamptz) as resultado`
      const resultado = primeiroResultado(linhas as Record<string, unknown>[])
      if (resultado?.erro) return responderResultado(resultado)
      return json({ token, ...resultado })
    } catch (e) {
      console.error('[entrar]', e)
      return erro('desconhecido', 'Não conseguimos abrir sua sessão agora. Tente novamente.', 500)
    }
  },
}
