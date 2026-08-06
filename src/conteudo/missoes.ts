/* ==========================================================================
   missoes.ts — as cinco missões.

   Só metadados: nome, tema, qual mini-game roda e o texto que a tela mostra.
   Nada aqui decide pontuação — a tabela autoritativa mora dentro da Edge
   Function `jogar`. As constantes abaixo servem aos rótulos ("+10") e, se
   divergirem do servidor, o servidor ganha: o app adota o total que ele
   devolve, então a divergência aparece na hora em vez de acumular.
   ========================================================================== */

import type { IdMissao } from '../nucleo/tipos'

export type TipoJogo = 'memoria' | 'ligar' | 'quebra' | 'mito' | 'cenario'

export interface Missao {
  id: IdMissao
  ordem: string
  ico: string
  nome: string
  tema: string
  tagline: string
  /** Aparece na tela da missão, antes do mini-game. É o conteúdo que o quiz cobra. */
  aprender: string[]
  jogo: TipoJogo
  jogoNome: string
  jogoComo: string
}

export const PTS_JOGO = 10
export const PTS_ACERTO = 2
export const PTS_BONUS = 20
export const PERGUNTAS_POR_MISSAO = 5

export const MISSOES: Missao[] = [
  {
    id: 'm1',
    ordem: 'Missão 01',
    ico: '📘',
    nome: 'O ponto de partida',
    tema: 'Conceitos e a Lei de Cotas',
    tagline: 'O que é deficiência, o que diz a lei e por que isso não é caridade.',
    aprender: [
      'Deficiência não é a característica da pessoa isolada: é o encontro entre uma condição de longo prazo e as barreiras do ambiente. É o chamado modelo social, adotado pela Convenção da ONU e pela lei brasileira.',
      'A Lei 8.213/91, a "Lei de Cotas", obriga empresas com 100 ou mais empregados a preencher de 2% a 5% das vagas com pessoas com deficiência ou reabilitadas do INSS. A faixa cresce com o tamanho da empresa.',
      'A Lei Brasileira de Inclusão (13.146/2015), ou Estatuto da Pessoa com Deficiência, garante igualdade de oportunidades e proíbe exigir aptidão plena como critério de contratação.',
      'Contratar PcD não é ação social nem favor: é obrigação legal, e antes disso é acesso a um grupo de profissionais historicamente deixado de fora do processo seletivo.',
    ],
    jogo: 'memoria',
    jogoNome: 'Jogo da memória',
    jogoComo: 'Encontre os pares. Cada par liga um conceito à sua definição.',
  },
  {
    id: 'm2',
    ordem: 'Missão 02',
    ico: '🗣️',
    nome: 'Chamar pelo nome certo',
    tema: 'Tipos de deficiência e comunicação respeitosa',
    tagline: 'Os termos que respeitam, os que ferem e o que fazer na dúvida.',
    aprender: [
      'O termo correto é "pessoa com deficiência" — pessoa primeiro, deficiência depois. "Portador", "deficiente", "especial" e "excepcional" saíram de uso: ninguém porta uma deficiência como quem porta um documento.',
      'As deficiências podem ser física, visual, auditiva, intelectual, psicossocial, múltipla — e o Transtorno do Espectro Autista tem, por lei, os mesmos direitos.',
      'Fale com a pessoa, não com o acompanhante ou o intérprete. Pergunte antes de ajudar e aceite o "não, obrigado" sem insistir.',
      'A cadeira de rodas, a bengala e o cão-guia são extensões do corpo da pessoa: não se toca, não se apoia, não se acaricia sem permissão.',
      'Na dúvida sobre como se referir a alguém ou como ajudar, pergunte à própria pessoa. É a única fonte confiável — e perguntar nunca foi falta de educação.',
    ],
    jogo: 'ligar',
    jogoNome: 'Ligar os pares',
    jogoComo: 'Leve cada situação para o tipo de deficiência a que ela se refere.',
  },
  {
    id: 'm3',
    ordem: 'Missão 03',
    ico: '🛠️',
    nome: 'Derrubar barreiras',
    tema: 'Acessibilidade e adaptações razoáveis',
    tagline: 'Acessibilidade é bem mais do que rampa — e quase sempre custa pouco.',
    aprender: [
      'A LBI lista seis tipos de barreira: arquitetônica (o degrau), atitudinal (o preconceito), comunicacional (a informação que não chega), tecnológica, metodológica (o jeito de fazer as coisas) e urbanística.',
      'A barreira atitudinal é a mais cara e a mais invisível: nenhuma rampa resolve um gestor que presume que a pessoa não dá conta.',
      'Adaptação razoável é o ajuste necessário para que a pessoa trabalhe em igualdade de condições — mesa mais alta, horário diferente, leitor de tela, intérprete de Libras. A conta é da empresa, e na maioria dos casos é baixa ou zero.',
      'Acessibilidade digital tem regra escrita: as WCAG. Legenda em vídeo, texto alternativo em imagem, contraste suficiente, tudo operável por teclado — coisas que também melhoram a vida de quem não tem deficiência nenhuma.',
      'Tecnologia assistiva é qualquer recurso que amplia a autonomia: leitor de tela, teclado adaptado, aparelho auditivo, software de comunicação alternativa, lupa eletrônica.',
    ],
    jogo: 'quebra',
    jogoNome: 'Quebra-cabeça',
    jogoComo: 'Reorganize as peças até montar o posto de trabalho acessível.',
  },
  {
    id: 'm4',
    ordem: 'Missão 04',
    ico: '🪞',
    nome: 'O que a gente nem percebe',
    tema: 'Capacitismo e vieses inconscientes',
    tagline: 'O elogio que diminui, a ajuda que atrapalha, a pergunta que não se faz.',
    aprender: [
      'Capacitismo é o preconceito que trata a pessoa com deficiência como incapaz, frágil ou inspiradora só por existir. Quase sempre chega vestido de gentileza.',
      '"Você é um exemplo de superação" transforma a rotina de alguém em espetáculo motivacional para os outros. Trabalhar, estudar e pagar contas não é façanha — é vida adulta.',
      'Superproteção também exclui: tirar tarefas, evitar dar feedback difícil ou "poupar" a pessoa de um projeto desafiador trava a carreira dela com a melhor das intenções.',
      'O viés aparece cedo, no processo seletivo: presumir que a pessoa não vai dar conta da viagem, do cliente ou da meta antes mesmo de perguntar a ela.',
      'Ter viés não faz de ninguém má pessoa — todo mundo tem. O que conta é perceber e corrigir antes que ele decida uma contratação, uma promoção ou uma escala.',
    ],
    jogo: 'mito',
    jogoNome: 'Mito ou Fato',
    jogoComo: 'Classifique cada afirmação. Você escolhe se quer o cronômetro ligado.',
  },
  {
    id: 'm5',
    ordem: 'Missão 05',
    ico: '🚀',
    nome: 'Da porta para dentro',
    tema: 'Carreira, liderança e inclusão no dia a dia',
    tagline: 'Contratar é o começo. Ficar, crescer e ser promovido é o assunto.',
    aprender: [
      'Cumprir a cota e parar aí é o erro mais comum: sem plano de carreira, a pessoa entra, não cresce e vai embora — e a vaga volta a abrir todo ano.',
      'Processo seletivo inclusivo começa no anúncio: descrever a vaga pelas atividades reais, dizer que o local é acessível e perguntar de que adaptação a pessoa precisa na entrevista.',
      'Feedback é direito. Não dar retorno difícil "para não constranger" é paternalismo, e priva a pessoa da informação de que ela precisa para crescer.',
      'Quem recebe um colega com deficiência no time não precisa de treinamento especial: precisa tratar como colega, combinar o que for prático e perguntar em vez de supor.',
      'Inclusão que depende de uma pessoa só não sobrevive à troca de gestor. Vira política quando está no processo: na vaga, no onboarding, na avaliação e na promoção.',
    ],
    jogo: 'cenario',
    jogoNome: 'Simulação de cenário',
    jogoComo: 'Quatro situações reais de trabalho. Escolha o que você faria.',
  },
]

export const MISSAO_POR_ID: Record<IdMissao, Missao> = Object.fromEntries(
  MISSOES.map((m) => [m.id, m]),
) as Record<IdMissao, Missao>

/** Teto de pontos do jogo inteiro: 5 × (10 do jogo + 5 × 2 do quiz) + 20 de bônus. */
export const PTS_MAX =
  MISSOES.length * (PTS_JOGO + PERGUNTAS_POR_MISSAO * PTS_ACERTO) + PTS_BONUS
