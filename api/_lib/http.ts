export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-sessao',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export function json(corpo: unknown, status = 200, extras: HeadersInit = {}): Response {
  return Response.json(corpo, {
    status,
    headers: { ...CORS, ...extras },
  })
}

export function erro(codigo: string, mensagem: string, status = 400): Response {
  return json({ erro: codigo, mensagem }, status)
}

export async function corpoJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const corpo = await req.json()
    return corpo && typeof corpo === 'object' && !Array.isArray(corpo)
      ? (corpo as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export function responderResultado(resultado: Record<string, unknown> | null | undefined): Response {
  if (!resultado) return erro('desconhecido', 'Algo deu errado do nosso lado. Tente novamente.', 500)
  const codigo = typeof resultado.erro === 'string' ? resultado.erro : ''
  if (!codigo) return json(resultado)

  const status = codigo === 'sessao-invalida' ? 401
    : codigo === 'nao-elegivel' ? 403
      : codigo === 'muitas-tentativas' ? 429
        : codigo === 'dados-invalidos' ? 400
          : 500

  const mensagens: Record<string, string> = {
    'sessao-invalida': 'Sua sessão expirou. Entre novamente com seu e-mail.',
    'nao-elegivel': 'Esse e-mail não está na lista de participantes. Fale com o RH para ser incluído.',
    'muitas-tentativas': 'Muitas entradas seguidas. Espere alguns minutos e tente de novo.',
    'dados-invalidos': 'Os dados enviados não são válidos.',
    desconhecido: 'Algo deu errado do nosso lado. Tente novamente.',
  }
  return erro(codigo, typeof resultado.mensagem === 'string' ? resultado.mensagem : mensagens[codigo] ?? mensagens.desconhecido, status)
}
