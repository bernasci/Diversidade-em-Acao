/* ==========================================================================
   progresso.ts — funções puras que leem a lista de `progresso`.

   Toda pergunta do tipo "a pessoa já fez isso?" tem UMA resposta, e ela mora
   aqui. Sem estado espalhado por tela: a tela do início, a da missão e a do
   certificado leem as mesmas funções, então não existe o bug de a missão
   aparecer concluída num lugar e pendente no outro.

   Desde que uma missão passou a ter mais de um mini-game, a tarefa do jogo
   carrega o tipo no nome (`jogo:memoria`, `jogo:ligar`). É `tarefaDoJogo`
   quem escreve esse nome, num lugar só — cliente e Edge Function precisam
   soletrar igual, e soletrar em dois lugares é como divergem.
   ========================================================================== */

import {
  MISSAO_POR_ID,
  MISSOES,
  PERGUNTAS_POR_MISSAO,
  TOTAL_JOGOS,
  TOTAL_PERGUNTAS,
  type TipoJogo,
} from '../conteudo/missoes'
import type { IdMissao, LinhaProgresso, Medalha } from './tipos'

export const tarefaDoJogo = (tipo: TipoJogo): `jogo:${TipoJogo}` => `jogo:${tipo}`

export const fezTarefa = (p: LinhaProgresso[], missao: IdMissao, tarefa: string): boolean =>
  p.some((l) => l.missao === missao && l.tarefa === tarefa)

export const fezJogo = (p: LinhaProgresso[], missao: IdMissao, tipo: TipoJogo): boolean =>
  fezTarefa(p, missao, tarefaDoJogo(tipo))

/** Quantos mini-games da missão já foram concluídos. */
export const jogosFeitos = (p: LinhaProgresso[], missao: IdMissao): number =>
  MISSAO_POR_ID[missao].jogos.filter((j) => fezJogo(p, missao, j.tipo)).length

export const todosOsJogos = (p: LinhaProgresso[], missao: IdMissao): boolean =>
  jogosFeitos(p, missao) >= MISSAO_POR_ID[missao].jogos.length

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
  todosOsJogos(p, missao) && quizCompleto(p, missao)

export const missoesCompletas = (p: LinhaProgresso[]): number =>
  MISSOES.filter((m) => missaoCompleta(p, m.id)).length

export const tudoCompleto = (p: LinhaProgresso[]): boolean => missoesCompletas(p) === MISSOES.length

export const acertosTotais = (p: LinhaProgresso[]): number =>
  MISSOES.reduce((n, m) => n + acertos(p, m.id), 0)

export const fezBonus = (p: LinhaProgresso[]): boolean => p.some((l) => l.tarefa === 'bonus')

/** Percentual da jornada, contando cada mini-game e cada quiz como uma tarefa.
    A Missão 3 tem um jogo só, então ela pesa menos que as outras duas — e é
    correto que pese: ela também é mais curta de fazer. */
export function percentual(p: LinhaProgresso[]): number {
  const total = TOTAL_JOGOS + MISSOES.length
  const feitas = MISSOES.reduce(
    (n, m) => n + jogosFeitos(p, m.id) + (quizCompleto(p, m.id) ? 1 : 0),
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
  const gabaritou = acertosTotais(p) === TOTAL_PERGUNTAS
  if (completas === MISSOES.length && gabaritou) return 'platina'
  if (completas === MISSOES.length) return 'ouro'
  if (completas >= 2) return 'prata'
  if (completas >= 1) return 'bronze'
  return null
}

export const MEDALHAS: Record<Medalha, { nome: string; ico: string; comoGanhar: string }> = {
  bronze: { nome: 'Bronze', ico: '🥉', comoGanhar: 'Conclua 1 missão' },
  prata: { nome: 'Prata', ico: '🥈', comoGanhar: 'Conclua 2 missões' },
  ouro: { nome: 'Ouro', ico: '🥇', comoGanhar: 'Conclua as 3 missões' },
  platina: {
    nome: 'Platina',
    ico: '💎',
    comoGanhar: `Conclua as 3 missões acertando todas as ${TOTAL_PERGUNTAS} perguntas`,
  },
}

export const ORDEM_MEDALHA: Medalha[] = ['bronze', 'prata', 'ouro', 'platina']
