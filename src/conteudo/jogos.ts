/* ==========================================================================
   jogos.ts — conteúdo dos cinco mini-games.

   POR QUE ISTO FICA NO CLIENTE, se o gabarito do quiz não fica:

   São dois papéis diferentes. O quiz vale nota — é ele que decide a Platina e
   é ele que o certificado atesta; por isso o gabarito mora no banco e cada
   resposta vai ao servidor. O mini-game vale PRESENÇA: são 10 pontos por
   concluir, iguais para quem acertou tudo e para quem errou metade. Ele
   existe para ensinar com feedback imediato, e feedback imediato em 4G
   significa não ir ao servidor a cada carta virada.

   O que o servidor ainda garante: `jogo-concluir` é idempotente e credita uma
   vez só, e o resultado enviado é conferido contra o tamanho real do jogo.
   Adiantar o mini-game pelo DevTools economiza tempo de quem já ia ganhar os
   mesmos 10 pontos — e não muda uma linha do certificado.

   Se um dia o mini-game passar a valer nota, este arquivo migra para
   `jogo_gabarito` no banco e a Edge Function passa a servir as rodadas.
   ========================================================================== */

/* ------------------------------------------------------------------ M1 --
   JOGO DA MEMÓRIA — seis pares conceito ↔ definição.
   Seis e não oito: no celular, 16 cartas viram rolagem, e rolagem em jogo da
   memória é o mesmo que esconder o tabuleiro.
   ---------------------------------------------------------------------- */
export interface ParMemoria {
  id: string
  conceito: string
  definicao: string
}

/* As definições são CURTAS de propósito, teto de ~45 caracteres. Uma carta de
   jogo da memória num celular tem cerca de 110px de largura: definição de
   linha e meia vira parágrafo minúsculo, ilegível sob sol, e obriga o
   tabuleiro a ocupar uma tela e meia de rolagem. Quem quiser a explicação
   completa a encontra na etapa "Aprender" — a carta precisa caber. */
export const PARES_MEMORIA: ParMemoria[] = [
  {
    id: 'modelo-social',
    conceito: 'Modelo social',
    definicao: 'A barreira do ambiente é que gera a deficiência',
  },
  {
    id: 'lei-cotas',
    conceito: 'Lei de Cotas',
    definicao: '2% a 5% das vagas em empresas com 100+',
  },
  {
    id: 'lbi',
    conceito: 'LBI',
    definicao: 'O Estatuto da Pessoa com Deficiência',
  },
  {
    id: 'adaptacao',
    conceito: 'Adaptação razoável',
    definicao: 'O ajuste que iguala as condições de trabalho',
  },
  {
    id: 'assistiva',
    conceito: 'Tecnologia assistiva',
    definicao: 'Leitor de tela, teclado adaptado, lupa',
  },
  {
    id: 'reabilitado',
    conceito: 'Reabilitado do INSS',
    definicao: 'Voltou ao trabalho e também conta na cota',
  },
]

/* ------------------------------------------------------------------ M2 --
   LIGAR OS PARES — cada situação vai para o tipo de deficiência a que se
   refere. As situações são de trabalho, não de manual: é o que a pessoa
   encontra na segunda-feira.
   ---------------------------------------------------------------------- */
export interface AlvoLigar {
  id: string
  titulo: string
  descricao: string
}
export interface FichaLigar {
  id: string
  texto: string
  alvo: string
  porque: string
}

export const ALVOS_LIGAR: AlvoLigar[] = [
  { id: 'visual', titulo: 'Deficiência visual', descricao: 'Cegueira ou baixa visão' },
  { id: 'auditiva', titulo: 'Deficiência auditiva', descricao: 'Surdez total ou parcial' },
  { id: 'fisica', titulo: 'Deficiência física', descricao: 'Alteração de membro ou mobilidade' },
  { id: 'intelectual', titulo: 'Intelectual e TEA', descricao: 'Inclui o Transtorno do Espectro Autista' },
]

export const FICHAS_LIGAR: FichaLigar[] = [
  {
    id: 'f1',
    texto: 'O relatório precisa ir em texto, não em imagem, para o leitor de tela conseguir ler',
    alvo: 'visual',
    porque: 'Leitor de tela lê texto. Um PDF que é só foto de página é uma parede.',
  },
  {
    id: 'f2',
    texto: 'A reunião gravada precisa de legenda para o colega acompanhar depois',
    alvo: 'auditiva',
    porque: 'Legenda é o que transforma um vídeo em informação acessível — e ajuda todo mundo no ônibus.',
  },
  {
    id: 'f3',
    texto: 'A bancada foi levantada 10 cm para a cadeira de rodas entrar por baixo',
    alvo: 'fisica',
    porque: 'Adaptação razoável clássica: barata, rápida e definitiva.',
  },
  {
    id: 'f4',
    texto: 'As instruções foram reescritas em passos curtos, um por linha, com exemplo',
    alvo: 'intelectual',
    porque: 'Linguagem simples e instrução em passos beneficia quem tem deficiência intelectual — e o time inteiro.',
  },
  {
    id: 'f5',
    texto: 'O intérprete de Libras foi contratado para o treinamento de segurança',
    alvo: 'auditiva',
    porque: 'Treinamento obrigatório sem acessibilidade não é treinamento: é formalidade.',
  },
  {
    id: 'f6',
    texto: 'O contraste do sistema foi aumentado e a fonte, ampliada',
    alvo: 'visual',
    porque: 'Baixa visão não é cegueira. Contraste e tamanho resolvem boa parte dos casos.',
  },
  {
    id: 'f7',
    texto: 'A sala de reunião passou a ser sempre a do térreo, sem degrau na entrada',
    alvo: 'fisica',
    porque: 'Mudar o local da reunião custa zero e derruba a barreira arquitetônica na hora.',
  },
  {
    id: 'f8',
    texto: 'Combinou-se avisar com antecedência qualquer mudança de rotina e evitar ruído alto na baia',
    alvo: 'intelectual',
    porque: 'Previsibilidade e controle de estímulos são ajustes frequentes para pessoas autistas.',
  },
]

/* ------------------------------------------------------------------ M3 --
   QUEBRA-CABEÇA — nove peças que, na ordem certa, montam a leitura do posto
   de trabalho acessível: do chegar ao prédio até o crescer na empresa.
   A "imagem" é textual de propósito: quem usa leitor de tela monta o mesmo
   quebra-cabeça que todo mundo, e não uma versão consolo.
   ---------------------------------------------------------------------- */
export interface PecaQuebra {
  id: number
  ico: string
  texto: string
}

export const PECAS_QUEBRA: PecaQuebra[] = [
  { id: 0, ico: '🚌', texto: 'Chegada acessível: transporte e calçada até a portaria' },
  { id: 1, ico: '🚪', texto: 'Entrada sem degrau, com rampa ou nível' },
  { id: 2, ico: '🛗', texto: 'Circulação interna: elevador e corredores livres' },
  { id: 3, ico: '🚻', texto: 'Banheiro acessível no mesmo andar' },
  { id: 4, ico: '🪑', texto: 'Posto de trabalho ajustado à pessoa' },
  { id: 5, ico: '💻', texto: 'Sistemas com leitor de tela, contraste e teclado' },
  { id: 6, ico: '🤟', texto: 'Comunicação acessível: Libras, legenda, linguagem simples' },
  { id: 7, ico: '🧭', texto: 'Rota de emergência que funciona para todos' },
  { id: 8, ico: '📈', texto: 'Plano de carreira e feedback como o de qualquer colega' },
]

/* ------------------------------------------------------------------ M4 --
   MITO OU FATO — oito afirmações que circulam no corredor da empresa.
   ---------------------------------------------------------------------- */
export interface CartaMito {
  id: string
  texto: string
  /** true = a afirmação é verdadeira (FATO) · false = é MITO */
  fato: boolean
  explicacao: string
}

export const CARTAS_MITO: CartaMito[] = [
  {
    id: 'c1',
    texto: 'Pessoa com deficiência falta mais ao trabalho do que as outras.',
    fato: false,
    explicacao:
      'Mito. Não há evidência disso. O que existe é a barreira de acesso — transporte sem acessibilidade e consulta remarcada — que atinge qualquer pessoa na mesma situação.',
  },
  {
    id: 'c2',
    texto: 'Adaptar um posto de trabalho costuma custar pouco ou nada.',
    fato: true,
    explicacao:
      'Fato. A maioria das adaptações é mudança de altura, de local, de horário ou de software — e boa parte custa zero.',
  },
  {
    id: 'c3',
    texto: 'É melhor não falar sobre a deficiência do colega para não constranger.',
    fato: false,
    explicacao:
      'Mito. O silêncio costuma constranger mais. Falar com naturalidade e perguntar o que for prático é o caminho — a fonte confiável é a própria pessoa.',
  },
  {
    id: 'c4',
    texto: 'Pessoa com deficiência só pode ocupar cargos operacionais.',
    fato: false,
    explicacao:
      'Mito, e dos caros: é o viés que trava a carreira. A deficiência não define a função — a qualificação define, como para qualquer pessoa.',
  },
  {
    id: 'c5',
    texto: 'Elogiar alguém por "superar a deficiência todo dia" pode ser capacitismo.',
    fato: true,
    explicacao:
      'Fato. É a chamada inspiração forçada: transforma a rotina da pessoa em espetáculo motivacional para quem assiste.',
  },
  {
    id: 'c6',
    texto: 'A empresa pode exigir aptidão física plena em qualquer processo seletivo.',
    fato: false,
    explicacao:
      'Mito. A LBI proíbe. O critério legítimo é a aptidão para as atividades reais da vaga, com as adaptações necessárias.',
  },
  {
    id: 'c7',
    texto: 'Legenda e texto alternativo ajudam também quem não tem deficiência.',
    fato: true,
    explicacao:
      'Fato. Legenda serve a quem está no ônibus sem fone; contraste alto serve a quem está no sol. Acessibilidade quase sempre transborda.',
  },
  {
    id: 'c8',
    texto: 'Ajudar sem perguntar é sempre um gesto gentil.',
    fato: false,
    explicacao:
      'Mito. Empurrar uma cadeira ou puxar alguém pelo braço sem avisar pode assustar e até machucar. Pergunte primeiro; aceite o "não".',
  },
]

/* ------------------------------------------------------------------ M5 --
   SIMULAÇÃO DE CENÁRIO — quatro decisões, três caminhos cada.
   Nenhuma opção é caricata: as erradas são as que a gente vê acontecer com
   boa intenção, e é isso que faz o feedback valer.
   ---------------------------------------------------------------------- */
export interface OpcaoCenario {
  texto: string
  /** 'boa' soma acerto · 'mediana' e 'ruim' não somam, mas explicam. */
  nota: 'boa' | 'mediana' | 'ruim'
  desdobramento: string
}
export interface Cena {
  id: string
  titulo: string
  situacao: string
  opcoes: OpcaoCenario[]
}

export const CENAS: Cena[] = [
  {
    id: 'e1',
    titulo: 'A entrevista',
    situacao:
      'Você entrevista uma candidata com deficiência física para uma vaga que envolve visitas a clientes duas vezes por mês. Ela é a mais qualificada tecnicamente.',
    opcoes: [
      {
        texto: 'Perguntar a ela como costuma se organizar para deslocamentos e de qual apoio precisaria.',
        nota: 'boa',
        desdobramento:
          'Certo. Você tratou a viagem como o que ela é: uma atividade da vaga, a ser combinada com a pessoa. É exatamente assim que se pergunta a qualquer candidato sobre disponibilidade.',
      },
      {
        texto: 'Seguir a entrevista sem tocar no assunto e decidir depois se as viagens são um problema.',
        nota: 'ruim',
        desdobramento:
          'O silêncio aqui vira decisão tomada sem ela. É onde o viés entra: você conclui sozinho o que só ela poderia responder.',
      },
      {
        texto: 'Oferecer a ela outra vaga, sem viagens, para evitar desgaste.',
        nota: 'ruim',
        desdobramento:
          'Isso é rebaixar a candidata mais qualificada por uma suposição. A decisão sobre o que ela dá conta é dela — e a lei chama isso de discriminação.',
      },
    ],
  },
  {
    id: 'e2',
    titulo: 'A chegada ao time',
    situacao:
      'Um colega surdo entra na sua equipe. Na primeira reunião, você percebe que ele não está acompanhando as falas cruzadas.',
    opcoes: [
      {
        texto: 'Combinar com o time falar um de cada vez e verificar com ele o que funciona melhor — legenda automática, intérprete, pauta escrita.',
        nota: 'boa',
        desdobramento:
          'Certo. Você mudou o processo da reunião, não a pessoa. E perguntou em vez de supor qual recurso serve.',
      },
      {
        texto: 'Mandar para ele, depois, um resumo por escrito do que foi decidido.',
        nota: 'mediana',
        desdobramento:
          'Melhor que nada, mas mantém o colega fora da discussão — ele recebe o resultado sem ter participado da decisão. Resolve a informação, não a participação.',
      },
      {
        texto: 'Falar mais alto e mais devagar, olhando para ele.',
        nota: 'ruim',
        desdobramento:
          'Volume não resolve surdez e atrapalha a leitura labial. Falar olhando para a pessoa é correto; o resto precisa de recurso de acessibilidade, não de esforço vocal.',
      },
    ],
  },
  {
    id: 'e3',
    titulo: 'A avaliação',
    situacao:
      'Chegou o ciclo de avaliação. Um membro do seu time, com deficiência intelectual, entregou dois trabalhos abaixo do combinado.',
    opcoes: [
      {
        texto: 'Dar o feedback com clareza, como daria a qualquer pessoa, e combinar junto o que ajustar.',
        nota: 'boa',
        desdobramento:
          'Certo. Feedback é direito, não risco. Suavizar até virar elogio priva a pessoa da informação de que ela precisa para crescer.',
      },
      {
        texto: 'Registrar "atende" para não desmotivar e conversar informalmente mais adiante.',
        nota: 'ruim',
        desdobramento:
          'Paternalismo com aparência de cuidado. A avaliação deixa de refletir a realidade e, na próxima promoção, ninguém entende por que ela não avança.',
      },
      {
        texto: 'Antes de avaliar, checar se as instruções e o prazo estavam acessíveis para ela.',
        nota: 'mediana',
        desdobramento:
          'Boa checagem — e às vezes a barreira está mesmo aí. Mas ela não substitui o feedback: verifique o processo E converse sobre a entrega.',
      },
    ],
  },
  {
    id: 'e4',
    titulo: 'A promoção',
    situacao:
      'Abriu uma vaga de coordenação. Uma pessoa com deficiência do seu time tem o melhor desempenho e já pediu para crescer, mas alguém comenta: "será que ela aguenta a pressão?".',
    opcoes: [
      {
        texto: 'Trazer os critérios objetivos da vaga para a mesa e avaliar todos os candidatos pelos mesmos itens.',
        nota: 'boa',
        desdobramento:
          'Certo. Critério claro e comparável é o que impede o "será que" de decidir no lugar dos fatos. E vale para todo mundo, não só para ela.',
      },
      {
        texto: 'Promover para mostrar o compromisso da empresa com a diversidade.',
        nota: 'mediana',
        desdobramento:
          'A pessoa certa pela razão errada. Promover pela deficiência, e não pelo desempenho, entrega a ela um cargo que todo mundo vai atribuir à cota.',
      },
      {
        texto: 'Sugerir que ela espere o próximo ciclo, para se preparar melhor.',
        nota: 'ruim',
        desdobramento:
          'Esse "próximo ciclo" costuma não chegar. É assim que a rotatividade acontece: a pessoa entra pela cota, não cresce e vai embora.',
      },
    ],
  },
]
