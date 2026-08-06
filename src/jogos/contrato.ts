/* ==========================================================================
   contrato.ts — a única interface que os cinco mini-games compartilham.

   A tela da missão não sabe se está rodando um jogo da memória ou uma
   simulação de cenário: ela monta o componente do tipo declarado em
   `missoes.ts` e espera um `aoConcluir`. É o que mantém `Missao.tsx` sem um
   `switch` por tipo de jogo — e o que faz um sexto mini-game custar um
   arquivo, não uma refatoração.
   ========================================================================== */

export interface ResultadoJogo {
  /** Quantas rodadas a pessoa acertou. Não vale ponto — vale para o texto de fim. */
  acertos: number
  /** Quantas rodadas o jogo tinha. O servidor confere se bate com o esperado. */
  total: number
  segundos: number
}

export interface PropsJogo {
  aoConcluir: (r: ResultadoJogo) => void
  /** Já concluiu antes: o jogo roda igual, mas ninguém promete pontos de novo. */
  jaFeito: boolean
}

/** Embaralha sem alterar o original. Usado por quatro dos cinco jogos. */
export function embaralhar<T>(lista: readonly T[]): T[] {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const agora = (): number => Math.round(performance.now() / 1000)
