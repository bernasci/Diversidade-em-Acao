import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let cliente: NeonQueryFunction<boolean, boolean> | null = null

export function banco() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não configurada.')
  if (!cliente) cliente = neon(url)
  return cliente
}

export function primeiroResultado(linhas: Record<string, unknown>[]): Record<string, unknown> | null {
  const resultado = linhas[0]?.resultado
  return resultado && typeof resultado === 'object' && !Array.isArray(resultado)
    ? (resultado as Record<string, unknown>)
    : null
}
