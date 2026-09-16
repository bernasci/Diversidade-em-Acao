/* ==========================================================================
   missoes.ts — as três etapas.

   Só metadados: nome, tema, quais mini-games rodam e o texto que a tela
   mostra. Nada aqui decide pontuação — a tabela autoritativa mora dentro da
   Edge Function `jogar`. As constantes abaixo servem aos rótulos ("+10") e,
   se divergirem do servidor, o servidor ganha: o app adota o total que ele
   devolve, então a divergência aparece na hora em vez de acumular.
   ========================================================================== */

import type { IdMissao } from '../nucleo/tipos'

export type TipoJogo = 'memoria' | 'ligar' | 'quebra' | 'mito' | 'cenario'

export interface JogoDaMissao {
  tipo: TipoJogo
  nome: string
  como: string
}

export interface Missao {
  id: IdMissao
  ordem: string
  nome: string
  tema: string
  tagline: string
  /** Aparece na tela da missão, antes dos mini-games. É o conteúdo que o quiz cobra. */
  aprender: string[]
  /** Uma etapa de jogo por item, na ordem em que aparecem na tela. */
  jogos: JogoDaMissao[]
}

export const PTS_JOGO = 10
export const PTS_ACERTO = 2
export const PTS_BONUS = 20
export const PERGUNTAS_POR_MISSAO = 5

/* --------------------------------------------------------------------------
   UM VERBO POR MISSÃO. É esse o sistema.

   O jogo se chama "Diversidade em AÇÃO", e cada missão é uma ação:

       ENTENDER · DESAPRENDER · AGIR

   Três palavras, três campos de significado distintos, terminando no verbo
   que dá nome ao jogo. No card da trilha o título de uma palavra também para
   de competir com o tema logo abaixo, que é quem carrega o conteúdo.

   POR QUE TRÊS E NÃO CINCO. A trilha nasceu com cinco verbos —
   entender · conhecer · adaptar · desaprender · agir — e dois pares eram
   quase sinônimos na leitura de quem chega de fora. "Entender" e "conhecer"
   só se sustentavam lado a lado com uma explicação (entende-se a regra,
   conhecem-se as pessoas), e explicação que a interface precisa dar é
   distinção que a interface não tem. "Adaptar" e "desaprender" tratavam da
   mesma coisa por dois ângulos: a barreira física e a barreira atitudinal —
   e a segunda é justamente o que faz a primeira continuar de pé.

   A fusão chegou a dar dois mini-games a cada missão fundida. Não ficou: são
   dez minutos no celular, no meio do expediente, e dois tabuleiros antes do
   quiz transformavam a missão numa sessão. Ficou UM JOGO POR MISSÃO, o que
   melhor carrega o tema de cada uma:

       Entender    → jogo da memória   (vocabulário, que é do que ela trata)
       Desaprender → mito ou fato      (é literalmente desmontar o que se crê)
       Agir        → cenário           (decidir, que é o verbo da missão)

   O "Ligar os pares" e o "Quebra-cabeça" saíram da trilha, mas NÃO do código:
   componentes e conteúdo continuam em `jogos/` e em `conteudo/jogos.ts`,
   prontos para voltar com uma linha neste arquivo. Ninguém os baixa enquanto
   não estiverem aqui — o `lazy()` só busca o que uma missão pede.

   "Desaprender" é o mais forte dos três e é deliberado: capacitismo não é
   ignorância, é coisa aprendida. Não se corrige aprendendo mais por cima —
   corrige-se desmontando o que já está lá.

   AS TAGLINES seguem uma forma só: contraste ou tríade curta, segunda pessoa,
   sem eufemismo corporativo. Cada uma diz o que a missão desmonta.

   O QUE NÃO ENTRA MAIS AQUI: número de lei, percentual de cota e nome de
   estatuto. O conteúdo saiu inteiro do registro jurídico e ficou no registro
   das pessoas — o que é deficiência, o que atrapalha, o que fazer na
   segunda-feira. Quem quiser a norma encontra na intranet do RH; quem está
   com dez minutos no celular precisa do resto.
   -------------------------------------------------------------------------- */
export const MISSOES: Missao[] = [
  {
    id: 'm1',
    ordem: 'Missão 01',
    nome: 'Entender',
    tema: 'O que é deficiência e como falar sobre isso',
    tagline: 'O que a deficiência é de verdade, o nome certo de cada coisa e o que fazer quando você não sabe.',
    aprender: [
      'Deficiência não é a característica da pessoa isolada: é o encontro entre uma condição de longo prazo e as barreiras do ambiente. Tire a barreira e a limitação diminui — é por isso que a mesma pessoa é "deficiente" num prédio e não é em outro.',
      'O termo correto é "pessoa com deficiência" — pessoa primeiro, deficiência depois. "Portador", "deficiente", "especial" e "excepcional" saíram de uso: ninguém porta uma deficiência como quem porta um documento.',
      'As deficiências podem ser física, visual, auditiva, intelectual, psicossocial ou múltipla — e o Transtorno do Espectro Autista entra nessa conta. Boa parte delas não se vê: dá para trabalhar anos ao lado de alguém sem saber.',
      'Fale com a pessoa, não com o acompanhante ou o intérprete. Pergunte antes de ajudar e aceite o "não, obrigado" sem insistir.',
      'A cadeira de rodas, a bengala e o cão-guia são extensões do corpo da pessoa: não se toca, não se apoia, não se acaricia sem permissão.',
      'Na dúvida sobre como se referir a alguém ou como ajudar, pergunte à própria pessoa. É a única fonte confiável — e perguntar nunca foi falta de educação.',
    ],
    jogos: [
      {
        tipo: 'memoria',
        nome: 'Jogo da memória',
        como: 'Encontre os pares. Cada par liga um conceito à sua definição.',
      },
    ],
  },
  {
    id: 'm2',
    ordem: 'Missão 02',
    nome: 'Desaprender',
    tema: 'Barreiras, adaptações e capacitismo',
    tagline: 'A barreira que ninguém vê, o elogio que diminui, a ajuda que atrapalha.',
    aprender: [
      'As barreiras aparecem em seis formas: arquitetônica (o degrau), atitudinal (o preconceito), comunicacional (a informação que não chega), tecnológica, metodológica (o jeito de fazer as coisas) e urbanística.',
      'A barreira atitudinal é a mais cara e a mais invisível: nenhuma rampa resolve um gestor que presume que a pessoa não dá conta.',
      'Adaptação razoável é o ajuste que coloca a pessoa em igualdade de condições — mesa mais alta, horário diferente, leitor de tela, intérprete de Libras. A conta é da empresa, e na maioria dos casos é baixa ou zero.',
      'Acessibilidade digital tem receita conhecida: legenda em vídeo, texto alternativo em imagem, contraste suficiente e tudo operável por teclado — coisas que também melhoram a vida de quem não tem deficiência nenhuma. Tecnologia assistiva é o resto do arsenal: leitor de tela, teclado adaptado, lupa eletrônica, aparelho auditivo.',
      'Capacitismo é o preconceito que trata a pessoa com deficiência como incapaz, frágil ou inspiradora só por existir. Quase sempre chega vestido de gentileza.',
      '"Você é um exemplo de superação" transforma a rotina de alguém em espetáculo motivacional para os outros. Trabalhar, estudar e pagar contas não é façanha — é vida adulta.',
      'Superproteção também exclui: tirar tarefas, evitar dar feedback difícil ou "poupar" a pessoa de um projeto desafiador trava a carreira dela com a melhor das intenções.',
      'Ter viés não faz de ninguém má pessoa — todo mundo tem. O que conta é perceber e corrigir antes que ele decida uma contratação, uma promoção ou uma escala, como quando se presume que a pessoa não vai dar conta da viagem sem nunca ter perguntado a ela.',
    ],
    jogos: [
      {
        tipo: 'mito',
        nome: 'Mito ou Fato',
        como: 'Classifique cada afirmação. Você escolhe se quer o cronômetro ligado.',
      },
    ],
  },
  {
    id: 'm3',
    ordem: 'Missão 03',
    nome: 'Agir',
    tema: 'Carreira, liderança e inclusão no dia a dia',
    tagline: 'Contratar é o começo. Ficar, crescer e ser promovido é o assunto.',
    aprender: [
      'Contratar e parar por aí é o erro mais comum: sem plano de carreira, a pessoa entra, não cresce e vai embora — e a vaga volta a abrir todo ano, como se o problema fosse o mercado.',
      'Processo seletivo inclusivo começa no anúncio: descrever a vaga pelas atividades reais, dizer que o local é acessível e perguntar de que adaptação a pessoa precisa na entrevista.',
      'Feedback é direito. Não dar retorno difícil "para não constranger" é paternalismo, e priva a pessoa da informação de que ela precisa para crescer.',
      'Quem recebe um colega com deficiência no time não precisa de treinamento especial: precisa tratar como colega, combinar o que for prático e perguntar em vez de supor.',
      'Inclusão que depende de uma pessoa só não sobrevive à troca de gestor. Vira política quando está no processo: na vaga, no onboarding, na avaliação e na promoção.',
    ],
    jogos: [
      {
        tipo: 'cenario',
        nome: 'Simulação de cenário',
        como: 'Quatro situações reais de trabalho. Escolha o que você faria.',
      },
    ],
  },
]

export const MISSAO_POR_ID: Record<IdMissao, Missao> = Object.fromEntries(
  MISSOES.map((m) => [m.id, m]),
) as Record<IdMissao, Missao>

/** Quantos mini-games a jornada inteira tem: um por missão. */
export const TOTAL_JOGOS = MISSOES.reduce((n, m) => n + m.jogos.length, 0)

/** Quantas perguntas a jornada inteira tem. */
export const TOTAL_PERGUNTAS = MISSOES.length * PERGUNTAS_POR_MISSAO

/** Teto de pontos do jogo inteiro: 3 jogos × 10 + 15 perguntas × 2 + 20 de bônus. */
export const PTS_MAX = TOTAL_JOGOS * PTS_JOGO + TOTAL_PERGUNTAS * PTS_ACERTO + PTS_BONUS
