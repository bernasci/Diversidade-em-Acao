/* ==========================================================================
   tipos.ts — o contrato entre o app e as Edge Functions.

   Mudou aqui, muda em `supabase/functions/jogar/index.ts`. São dois arquivos
   porque Deno e o bundle do navegador não compartilham módulo, mas os nomes
   são os mesmos de propósito: quando divergirem, é para doer na leitura.
   ========================================================================== */

export type IdMissao = 'm1' | 'm2' | 'm3' | 'm4' | 'm5'

/** `jogo` = mini-game da missão · `quiz-0`…`quiz-4` = perguntas · `bonus` = fecho. */
export type Tarefa = 'jogo' | `quiz-${number}` | 'bonus'

export interface Jogador {
  id: string
  email: string
  /** Nome completo, como veio da lista do RH. O jogador não edita. */
  nome: string
  area: string | null
  empresa: string | null
  emoji: string
  cor: string
  pts: number
  opt_in: boolean
}

export interface LinhaProgresso {
  missao: IdMissao | 'geral'
  tarefa: Tarefa
  pontos: number
  detalhe: Record<string, unknown> | null
}

export interface EstadoServidor {
  jogador: Jogador
  progresso: LinhaProgresso[]
}

export interface RespostaEntrar extends EstadoServidor {
  token: string
}

/** Resposta de uma pergunta do quiz. `ja` = já tinha respondido antes; não é erro. */
export interface RespostaQuiz {
  certo: boolean
  resposta: number
  explicacao: string
  ja: boolean
  pontos: number
  total: number
}

export interface RespostaCredito {
  ja: boolean
  pontos: number
  total: number
}

export interface LinhaRanking {
  posicao: number
  /** Já vem encurtado pela view: primeiro nome + último sobrenome. */
  nome: string
  area: string | null
  empresa: string | null
  emoji: string
  cor: string
  pts: number
}

export type Medalha = 'bronze' | 'prata' | 'ouro' | 'platina'

/** Erros que a interface trata por nome. Qualquer outro cai no texto genérico. */
export type CodigoErro =
  | 'nao-elegivel'
  | 'sessao-invalida'
  | 'sem-conexao'
  | 'muitas-tentativas'
  | 'dados-invalidos'
  | 'nao-configurado'
  | 'desconhecido'

export class ErroApi extends Error {
  constructor(
    public codigo: CodigoErro,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = 'ErroApi'
  }
}
