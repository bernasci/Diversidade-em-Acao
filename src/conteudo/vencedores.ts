/* ==========================================================================
   vencedores.ts — o resultado da campanha.

   ESCRITO À MÃO, e não calculado do ranking, de propósito: o resultado é uma
   DECISÃO do RH, tomada depois do encerramento — quem concorre, como tratar
   um empate técnico, o que fazer com quem jogou duas vezes. O ranking ao vivo
   não sabe nada disso. Mudar um vencedor é mudar esta lista, e só.

   O CRITÉRIO DE DESEMPATE é o tempo somado dos três mini-games, medido pelo
   servidor (do toque em "Começar" à conclusão), ao centésimo. Ao segundo
   cheio a ordem do 4º e do 5º se inverteria — 0,58s separam os dois.

   O nome é o curto, o mesmo do ranking: nome completo nunca aparece em tela
   pública. Os dois "Gabriel Silva" se distinguem pela área, como no ranking.

   `referencia` é quem ficou logo atrás do último vencedor no mesmo empate.
   Não aparece como vencedor — está aqui só para a diferença do 5º ter contra
   quem ser medida, sem expor o nome de quem ficou de fora.
   ========================================================================== */

export interface Colocado {
  posicao: number
  nome: string
  area: string
  pts: number
  /** Tempo somado dos três mini-games, em segundos, AO MILÉSIMO. A tela mostra
      centésimos, mas a diferença é calculada antes de arredondar — arredondar
      primeiro faria 0,58s virar 0,59s. */
  segundos: number
}

export const VENCEDORES: Colocado[] = [
  { posicao: 1, nome: 'Gabriel Silva', area: 'Movimentação de Carga', pts: 110, segundos: 95.104 },
  { posicao: 2, nome: 'Julia Salgado', area: 'Financeiro - Gestão', pts: 110, segundos: 110.149 },
  { posicao: 3, nome: 'Joao Peixoto', area: 'Financeiro - Gestão', pts: 109, segundos: 102.557 },
  { posicao: 4, nome: 'Gabriel Silva', area: 'QSMS', pts: 108, segundos: 116.034 },
  { posicao: 5, nome: 'Millena Silva', area: 'Manutenção & SG', pts: 108, segundos: 116.617 },
]

/** O 6º colocado: mesma pontuação do 5º, perdeu no tempo. Só para a conta. */
export const REFERENCIA: Colocado = {
  posicao: 6,
  nome: '',
  area: '',
  pts: 108,
  segundos: 124.278,
}
