/* ==========================================================================
   sessao.ts — o token de acesso, e só ele.

   O app não usa o Supabase Auth. O login é "meu e-mail está na lista do RH?",
   respondido pela Edge Function `entrar`, que devolve um token opaco de 32
   bytes. O banco guarda apenas o SHA-256 desse token — vazar a tabela
   `sessoes` não dá acesso a ninguém.

   Consequência assumida no plano: quem souber o e-mail de um colega consegue
   jogar no lugar dele. É aceitável porque a premiação é simbólica e o ranking
   é opt-in. Se isso mudar, o upgrade é pedir a matrícula na tela de entrada e
   conferi-la na `entrar` — a coluna já existe em `elegiveis`.
   ========================================================================== */

const CHAVE = 'diversidade_sessao_v1'

export function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    // Navegador com storage bloqueado (aba anônima restrita, política de TI).
    // O app continua funcionando na sessão atual, em memória.
    return memoria
  }
}

let memoria: string | null = null

export function guardarToken(token: string): void {
  memoria = token
  try {
    localStorage.setItem(CHAVE, token)
  } catch {
    /* fica só em memória */
  }
}

export function apagarToken(): void {
  memoria = null
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    /* nada a fazer */
  }
}

export const temSessao = (): boolean => Boolean(lerToken())

/** Normaliza o que a pessoa digitou. Gente no celular manda espaço no fim e
    maiúscula no começo; nada disso pode virar "e-mail não encontrado". */
export const normalizarEmail = (v: string): string => String(v ?? '').trim().toLowerCase()

export const emailPlausivel = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizarEmail(v))
