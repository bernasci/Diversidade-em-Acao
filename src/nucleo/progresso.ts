/* ==========================================================================
   progresso.ts — funções puras que leem a lista de `progresso`.

   Toda pergunta do tipo "a pessoa já fez isso?" tem UMA resposta, e ela mora
   aqui. Sem estado espalhado por tela: a tela do início, a da missão e a do
   certificado leem as mesmas funções, então não existe o bug de a missão
   aparecer concluída num lugar e pendente no outro.
   ========================================================================== */

import { MISSOES, PERGUNTAS_POR_MISSAO } from '../conteudo/missoes'
import type { IdMissao, LinhaProgresso, Medalha } from './tipos'

export const fezTarefa = (p: LinhaProgresso[], missao: IdMissao, tarefa: string): boolean =>
  p.some((l) => l.missao === missao && l.tarefa === tarefa)

export const fezJogo = (p: LinhaProgresso[], missao: IdMissao): boolean => fezTarefa(p, missao, 'jogo')

export const respondeu = (p: LinhaProgresso[], missao: IdMissao, pergunta: number): boolean =>
  fezTarefa(p, missao, `quiz-${pergunta}`)

/** Quantas perguntas da missão já foram respondidas (certas ou erradas). */
export const respondidas = (p: LinhaProgresso[], missao: IdMissao): number =>
  p.filter((l) => l.missao === missao && l.tarefa.startsWith('quiz-')).length

/** Quantas foram acertadas. Acerto vale ponto; erro grava a linha com 0. */
export const acertos = (p: LinhaProgresso[], missao: IdMissao): number =>
  p.filter((l) => l.missao === missao && l.tarefa.startsWith('quiz-') && l.pontos > 0).length

export const quizCompleto = (p: LinhaProgresso[], missao: IdMissao): boolean =>
  respondidas(p, missao) >= PERGUNTAS_POR_MISSAO

export const missaoCompleta = (p: LinhaProgresso[], missao: IdMissao): boolean =>
  fezJogo(p, missao) && quizCompleto(p, missao)

export const missoesCompletas = (p: LinhaProgresso[]): number =>
  MISSOES.filter((m) => missaoCompleta(p, m.id)).length

export const tudoCompleto = (p: LinhaProgresso[]): boolean => missoesCompletas(p) === MISSOES.length

export const acertosTotais = (p: LinhaProgresso[]): number =>
  MISSOES.reduce((n, m) => n + acertos(p, m.id), 0)

export const fezBonus = (p: LinhaProgresso[]): boolean => p.some((l) => l.tarefa === 'bonus')

/** Percentual da jornada, contando mini-game e quiz como tarefas iguais. */
export function percentual(p: LinhaProgresso[]): number {
  const total = MISSOES.length * 2
  const feitas = MISSOES.reduce(
    (n, m) => n + (fezJogo(p, m.id) ? 1 : 0) + (quizCompleto(p, m.id) ? 1 : 0),
    0,
  )
  return Math.round((feitas / total) * 100)
}

/* --------------------------------------------------------------------------
   MEDALHAS

   Derivadas do progresso, sem marca d'água no banco: se um dia uma linha de
   `progresso` for corrigida, a medalha se corrige junto. Guardar a medalha
   como campo separado é como o placar diverge.
   -------------------------------------------------------------------------- */
export function medalhaDe(p: LinhaProgresso[]): Medalha | null {
  const completas = missoesCompletas(p)
  const gabaritou = acertosTotais(p) === MISSOES.length * PERGUNTAS_POR_MISSAO
  if (completas === MISSOES.length && gabaritou) return 'platina'
  if (completas === MISSOES.length) return 'ouro'
  if (completas >= 3) return 'prata'
  if (completas >= 1) return 'bronze'
  return null
}

export const MEDALHAS: Record<Medalha, { nome: string; ico: string; comoGanhar: string }> = {
  bronze: { nome: 'Bronze', ico: '🥉', comoGanhar: 'Conclua 1 missão' },
  prata: { nome: 'Prata', ico: '🥈', comoGanhar: 'Conclua 3 missões' },
  ouro: { nome: 'Ouro', ico: '🥇', comoGanhar: 'Conclua as 5 missões' },
  platina: { nome: 'Platina', ico: '💎', comoGanhar: 'Conclua as 5 missões acertando todas as 25 perguntas' },
}

export const ORDEM_MEDALHA: Medalha[] = ['bronze', 'prata', 'ouro', 'platina']
