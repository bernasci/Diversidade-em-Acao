import { banco } from './_lib/db.js'
import { CORS, erro, json } from './_lib/http.js'

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
    if (req.method !== 'GET') return erro('metodo', 'Use GET.', 405)

    const pedido = Number(new URL(req.url).searchParams.get('limit') ?? 100)
    const limite = Number.isInteger(pedido) ? Math.min(100, Math.max(1, pedido)) : 100
    try {
      const linhas = await banco()`select public.app_ranking(${limite}) as resultado` as Record<string, unknown>[]
      return json(linhas[0]?.resultado ?? [], 200, {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      })
    } catch (e) {
      console.error('[ranking]', e)
      return erro('desconhecido', 'Não conseguimos carregar o ranking agora.', 500)
    }
  },
}
