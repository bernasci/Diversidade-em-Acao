/* ==========================================================================
   jogar — tudo o que acontece depois de entrar.

   POST { acao, ... } + cabeçalho `x-sessao: <token>`

     estado         →  { jogador, progresso }
     responder      →  { certo, resposta, explicacao, ja, pontos, total }
     jogo-concluir  →  { ja, pontos, total }
     bonus          →  { ja, pontos, total }
     perfil         →  { jogador }

   A TABELA DE RECOMPENSAS MORA AQUI, e é a única que vale. O app tem os
   mesmos números em `src/conteudo/missoes.ts`, mas só para escrever "+10" na
   tela: quando divergirem, o cliente adota o total que esta função devolve, e
   a divergência aparece na hora em vez de acumular em silêncio.

   Deploy:  supabase functions deploy jogar --no-verify-jwt
   (a autenticação é o `x-sessao`, conferido linha a linha aqui dentro.)
   ========================================================================== */

import {
  CORS,
  CAMPOS_JOGADOR,
  admin,
  creditar,
  erro,
  jogadorDaSessao,
  responder,
  totalDe,
  type Jogador,
} from '../_compartilhado/comum.ts'

const RECOMPENSA = { jogo: 10, acerto: 2, bonus: 20 } as const

const MISSOES = ['m1', 'm2', 'm3', 'm4', 'm5'] as const
const PERGUNTAS_POR_MISSAO = 5

/** Quantas rodadas cada mini-game tem de verdade. Usado só para recusar
    resultado impossível — o mini-game vale presença, não nota. */
const RODADAS_DO_JOGO: Record<string, number> = {
  m1: 6, // memória: 6 pares
  m2: 8, // ligar os pares: 8 situações
  m3: 9, // quebra-cabeça: 9 peças
  m4: 8, // mito ou fato: 8 cartas
  m5: 4, // cenário: 4 situações
}

const eMissao = (v: unknown): v is (typeof MISSOES)[number] =>
  typeof v === 'string' && (MISSOES as readonly string[]).includes(v)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return erro('metodo', 'Use POST.', 405)

  const sb = admin()

  const jogador = await jogadorDaSessao(sb, req)
  if (!jogador) return erro('sessao-invalida', 'Sua sessão expirou. Entre novamente com seu e-mail.', 401)

  let corpo: Record<string, unknown>
  try {
    corpo = await req.json()
  } catch {
    return erro('dados-invalidos', 'Corpo da requisição inválido.')
  }

  const acao = String(corpo.acao ?? '')

  try {
    switch (acao) {
      case 'estado':
        return await acaoEstado(sb, jogador)
      case 'responder':
        return await acaoResponder(sb, jogador, corpo)
      case 'jogo-concluir':
        return await acaoJogoConcluir(sb, jogador, corpo)
      case 'bonus':
        return await acaoBonus(sb, jogador)
      case 'perfil':
        return await acaoPerfil(sb, jogador, corpo)
      default:
        return erro('dados-invalidos', `Ação desconhecida: ${acao}`)
    }
  } catch (e) {
    console.error('[jogar]', acao, e)
    return erro('desconhecido', 'Algo deu errado do nosso lado. Tente de novo em instantes.', 500)
  }
})

/* --------------------------------------------------------------- estado -- */
async function acaoEstado(sb: ReturnType<typeof admin>, jogador: Jogador) {
  const { data: progresso } = await sb
    .from('progresso')
    .select('missao, tarefa, pontos, detalhe')
    .eq('jogador', jogador.id)
  return responder({ jogador, progresso: progresso ?? [] })
}

/* ------------------------------------------------------------ responder --
   O único lugar do sistema que sabe a resposta certa. O cliente manda a
   escolha; recebe de volta se acertou, qual era e por quê.

   Errar TAMBÉM grava linha, com 0 ponto. Duas consequências, as duas
   desejadas: dá para retomar o quiz de onde parou, e não dá para tentar de
   novo até acertar. */
async function acaoResponder(sb: ReturnType<typeof admin>, jogador: Jogador, corpo: Record<string, unknown>) {
  const missao = corpo.missao
  const pergunta = Number(corpo.pergunta)
  const escolha = Number(corpo.escolha)

  if (!eMissao(missao)) return erro('dados-invalidos', 'Missão inválida.')
  if (!Number.isInteger(pergunta) || pergunta < 0 || pergunta >= PERGUNTAS_POR_MISSAO) {
    return erro('dados-invalidos', 'Pergunta inválida.')
  }
  if (!Number.isInteger(escolha) || escolha < 0 || escolha > 3) {
    return erro('dados-invalidos', 'Alternativa inválida.')
  }

  const { data: gabarito } = await sb
    .from('quiz_gabarito')
    .select('resposta, explicacao')
    .eq('missao', missao)
    .eq('pergunta', pergunta)
    .maybeSingle()

  if (!gabarito) return erro('dados-invalidos', 'Essa pergunta não existe.')

  const certo = escolha === gabarito.resposta
  const c = await creditar(
    sb,
    jogador.id,
    missao,
    `quiz-${pergunta}`,
    certo ? RECOMPENSA.acerto : 0,
    { escolha, certo },
  )

  return responder({
    certo,
    resposta: gabarito.resposta,
    explicacao: gabarito.explicacao,
    ja: c.ja,
    pontos: c.pontos,
    total: c.total,
  })
}

/* --------------------------------------------------------- jogo-concluir --
   O mini-game vale presença: 10 pontos por concluir, iguais para quem acertou
   tudo e para quem errou metade. A conferência aqui é de plausibilidade — o
   `total` enviado tem de bater com o tamanho real do jogo. Não é anti-cheat
   sério, e não precisa ser: forjar isto economiza os minutos de um jogo que
   daria os mesmos 10 pontos de qualquer jeito, e não muda uma linha do
   certificado, que atesta o quiz. */
async function acaoJogoConcluir(sb: ReturnType<typeof admin>, jogador: Jogador, corpo: Record<string, unknown>) {
  const missao = corpo.missao
  if (!eMissao(missao)) return erro('dados-invalidos', 'Missão inválida.')

  const r = (corpo.resultado ?? {}) as { acertos?: number; total?: number; segundos?: number }
  const esperado = RODADAS_DO_JOGO[missao]

  if (Number(r.total) !== esperado) {
    return erro('dados-invalidos', 'Resultado do jogo não confere.')
  }

  const c = await creditar(sb, jogador.id, missao, 'jogo', RECOMPENSA.jogo, {
    acertos: Number(r.acertos) || 0,
    total: esperado,
    segundos: Number(r.segundos) || 0,
  })

  await talvezAtualizarRanking(sb)
  return responder(c)
}

/* ---------------------------------------------------------------- bonus --
   Quem decide se a jornada acabou é esta função, relendo `progresso`. O
   cliente pergunta depois de cada crédito; se a resposta for não, ele fica
   quieto — não é erro do usuário. */
async function acaoBonus(sb: ReturnType<typeof admin>, jogador: Jogador) {
  const { data: linhas } = await sb
    .from('progresso')
    .select('missao, tarefa')
    .eq('jogador', jogador.id)

  const feito = new Set((linhas ?? []).map((l) => `${l.missao}/${l.tarefa}`))
  const completou = MISSOES.every((m) => {
    if (!feito.has(`${m}/jogo`)) return false
    for (let i = 0; i < PERGUNTAS_POR_MISSAO; i++) if (!feito.has(`${m}/quiz-${i}`)) return false
    return true
  })

  if (!completou) {
    return responder({ ja: false, pontos: 0, total: await totalDe(sb, jogador.id) })
  }

  const c = await creditar(sb, jogador.id, 'geral', 'bonus', RECOMPENSA.bonus)
  await talvezAtualizarRanking(sb)
  return responder(c)
}

/* --------------------------------------------------------------- perfil --
   Só campo cosmético e a decisão sobre o ranking.

   `nome`, `area` e `empresa` NÃO estão na lista de campos aceitos: eles vêm
   da lista do RH e são reespelhados a cada acesso. É o que faz o ranking
   dizer a verdade sobre quem é quem — se a pessoa pudesse editar o próprio
   nome, a lista pública deixaria de valer como registro. */
async function acaoPerfil(sb: ReturnType<typeof admin>, jogador: Jogador, corpo: Record<string, unknown>) {
  const mudanca: Record<string, unknown> = {}

  if (typeof corpo.emoji === 'string') mudanca.emoji = corpo.emoji.slice(0, 8)
  if (typeof corpo.cor === 'string' && /^#[0-9a-fA-F]{6}$/.test(corpo.cor)) mudanca.cor = corpo.cor
  if (typeof corpo.opt_in === 'boolean') mudanca.opt_in = corpo.opt_in

  if (Object.keys(mudanca).length === 0) return responder({ jogador })

  const { data, error } = await sb
    .from('jogadores')
    .update(mudanca)
    .eq('id', jogador.id)
    .select(CAMPOS_JOGADOR)
    .single<Jogador>()

  if (error || !data) return erro('desconhecido', 'Não conseguimos salvar seu perfil.', 500)

  // Entrar ou sair do ranking precisa aparecer rápido; o resto pode esperar
  // o ciclo normal de cinco minutos.
  if ('opt_in' in mudanca) await sb.rpc('atualizar_ranking')

  return responder({ jogador: data })
}

/* Rede de segurança para quando o pg_cron não estiver ligado: uma em cada
   ~50 conclusões atualiza a view. Barato, e evita ranking congelado. */
async function talvezAtualizarRanking(sb: ReturnType<typeof admin>) {
  if (Math.random() < 0.02) {
    try {
      await sb.rpc('atualizar_ranking')
    } catch {
      /* view ocupada ou pg_cron já cuidando: sem problema */
    }
  }
}
