/* ==========================================================================
   comum.ts — o que `entrar` e `jogar` usam em comum.

   Roda no Deno, dentro do Supabase. Não é compilado pelo `tsc` do app (está
   fora do `include` do tsconfig) — os dois mundos não compartilham módulo,
   só convenção.
   ========================================================================== */

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

/* Aberto a qualquer origem porque o app é público e sem cookie: o que
   protege a conta é o token no cabeçalho `x-sessao`, não a origem. */
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sessao',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function responder(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  })
}

export const erro = (codigo: string, mensagem: string, status = 400): Response =>
  responder({ erro: codigo, mensagem }, status)

/** Cliente com service_role: ignora RLS. É o único que consegue ler qualquer
    coisa neste banco — ver `003_seguranca.sql`. */
export function admin(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export const normalizarEmail = (v: unknown): string => String(v ?? '').trim().toLowerCase()

/** SHA-256 em hexadecimal. O banco guarda só isto; o token em claro vive
    apenas no localStorage de quem entrou. */
export async function hashDoToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function novoToken(): string {
  const b = new Uint8Array(32)
  crypto.getRandomValues(b)
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface Jogador {
  id: string
  email: string
  nome: string
  apelido: string
  area: string | null
  emoji: string
  cor: string
  pts: number
  opt_in: boolean
}

export const CAMPOS_JOGADOR = 'id,email,nome,apelido,area,emoji,cor,pts,opt_in'

/** Resolve a sessão a partir do cabeçalho `x-sessao`. Devolve null se o token
    não existe, expirou ou nem veio — a interface trata os três do mesmo jeito:
    "sua sessão expirou, entre de novo". */
export async function jogadorDaSessao(sb: SupabaseClient, req: Request): Promise<Jogador | null> {
  const token = req.headers.get('x-sessao')
  if (!token) return null

  const { data } = await sb
    .from('sessoes')
    .select('jogador, expira_em')
    .eq('token_hash', await hashDoToken(token))
    .maybeSingle()

  if (!data || new Date(data.expira_em).getTime() < Date.now()) return null

  const { data: j } = await sb
    .from('jogadores')
    .select(CAMPOS_JOGADOR)
    .eq('id', data.jogador)
    .maybeSingle()

  return (j as Jogador) ?? null
}

/** Lê o total autoritativo. É este número que o app adota — nunca a soma
    local. Ver o comentário do topo de `src/nucleo/estado.tsx`. */
export async function totalDe(sb: SupabaseClient, jogador: string): Promise<number> {
  const { data } = await sb.from('jogadores').select('pts').eq('id', jogador).maybeSingle()
  return data?.pts ?? 0
}

/**
 * Credita uma tarefa. Idempotente por construção: a constraint
 * `progresso_unico` transforma a segunda tentativa em 23505, e 23505 aqui
 * quer dizer "já fez" — resposta legítima, não erro.
 */
export async function creditar(
  sb: SupabaseClient,
  jogador: string,
  missao: string,
  tarefa: string,
  pontos: number,
  detalhe: Record<string, unknown> | null = null,
): Promise<{ ja: boolean; pontos: number; total: number }> {
  const { error } = await sb.from('progresso').insert({ jogador, missao, tarefa, pontos, detalhe })

  if (error) {
    if (error.code === '23505') return { ja: true, pontos: 0, total: await totalDe(sb, jogador) }
    throw error
  }
  return { ja: false, pontos, total: await totalDe(sb, jogador) }
}
