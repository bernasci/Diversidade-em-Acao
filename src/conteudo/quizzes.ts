/* ==========================================================================
   quizzes.ts — enunciados e alternativas das 25 perguntas.

   ATENÇÃO, e é a regra mais importante deste arquivo: NÃO existe aqui o
   índice da alternativa correta, nem a explicação. Os dois moram em
   `quiz_gabarito`, uma tabela sem policy nenhuma, e só a Edge Function
   `jogar` os enxerga. Abrir o DevTools nesta tela não adianta nada — e é
   isso que faz o certificado significar alguma coisa.

   Se um dia alguém for tentado a "só deixar a resposta aqui para testar
   offline": não. Foi exatamente esse atalho que obrigou o DOME GAMES a
   manter duas fontes de verdade divergentes por três fases do projeto.

   A ordem das alternativas é fixa e o índice é a chave do gabarito — mexer
   na ordem de uma alternativa aqui exige mexer no `resposta` da migration
   002. Por isso cada bloco traz o número da pergunta comentado.
   ========================================================================== */

import type { IdMissao } from '../nucleo/tipos'

export interface Pergunta {
  q: string
  o: [string, string, string, string]
}

export const QUIZZES: Record<IdMissao, Pergunta[]> = {
  /* ---------------------------------------------------------------- M1 -- */
  m1: [
    {
      // 0
      q: 'Segundo o modelo adotado pela legislação brasileira, a deficiência é resultado de:',
      o: [
        'Uma limitação que está apenas no corpo da pessoa',
        'Da interação entre uma condição de longo prazo e as barreiras do ambiente',
        'De uma doença que precisa ser curada para a pessoa poder trabalhar',
        'Da falta de esforço da pessoa em se adaptar ao ambiente',
      ],
    },
    {
      // 1
      q: 'A Lei de Cotas (Lei 8.213/91) obriga a reservar vagas em empresas com:',
      o: [
        'Qualquer número de empregados',
        '50 ou mais empregados',
        '100 ou mais empregados',
        '1.000 ou mais empregados',
      ],
    },
    {
      // 2
      q: 'O percentual de vagas reservadas pela Lei de Cotas varia de:',
      o: [
        '2% a 5%, conforme o número de empregados da empresa',
        '1% a 2%, fixo para qualquer empresa',
        '5% a 10%, conforme o faturamento',
        '10% para todas as empresas',
      ],
    },
    {
      // 3
      q: 'A Lei Brasileira de Inclusão (13.146/2015) proíbe expressamente:',
      o: [
        'Que a empresa pergunte de qual adaptação a pessoa precisa',
        'Que pessoas com deficiência ocupem cargos de liderança',
        'Que pessoas com deficiência trabalhem em turnos',
        'Exigir aptidão plena como critério para admissão',
      ],
    },
    {
      // 4
      q: 'Contratar pessoas com deficiência é, antes de tudo:',
      o: [
        'Uma ação social voluntária da empresa',
        'Um favor prestado a quem precisa',
        'Obrigação legal — e acesso a profissionais que o mercado deixou de fora',
        'Uma exigência que vale só para o setor público',
      ],
    },
  ],

  /* ---------------------------------------------------------------- M2 -- */
  m2: [
    {
      // 0
      q: 'O termo recomendado hoje para se referir a essas pessoas é:',
      o: [
        'Portador de necessidades especiais',
        'Pessoa portadora de deficiência',
        'Pessoa com deficiência',
        'Pessoa especial',
      ],
    },
    {
      // 1
      q: 'Você conversa com uma pessoa surda acompanhada de intérprete de Libras. O correto é:',
      o: [
        'Olhar e falar com a pessoa surda; o intérprete faz a tradução',
        'Olhar e falar com o intérprete, que repassa o recado',
        'Falar bem mais alto e bem devagar',
        'Escrever tudo em papel, para não haver erro',
      ],
    },
    {
      // 2
      q: 'Uma pessoa em cadeira de rodas parece ter dificuldade com uma porta pesada. Você deve:',
      o: [
        'Empurrar a cadeira dela para ajudar mais rápido',
        'Chamar outra pessoa para resolver',
        'Fingir que não viu, para não constranger',
        'Perguntar se ela quer ajuda e, se sim, de que forma',
      ],
    },
    {
      // 3
      q: 'Sobre o cão-guia que acompanha uma pessoa com deficiência visual:',
      o: [
        'Pode receber carinho quando estiver parado',
        'Está trabalhando: não se chama, não se toca e não se oferece comida',
        'Deve ficar do lado de fora dos prédios',
        'Só entra em ambientes com autorização prévia da empresa',
      ],
    },
    {
      // 4
      q: 'O Transtorno do Espectro Autista (TEA), perante a lei brasileira:',
      o: [
        'Só é considerado deficiência se houver deficiência intelectual associada',
        'É considerado deficiência apenas no ambiente escolar',
        'É considerado pessoa com deficiência para todos os efeitos legais',
        'Não é considerado deficiência',
      ],
    },
  ],

  /* ---------------------------------------------------------------- M3 -- */
  m3: [
    {
      // 0
      q: 'Entre os seis tipos de barreira previstos na LBI, a barreira ATITUDINAL é:',
      o: [
        'O degrau na entrada do prédio',
        'O site sem texto alternativo nas imagens',
        'A calçada esburacada em frente à empresa',
        'O preconceito e a suposição de que a pessoa não dá conta',
      ],
    },
    {
      // 1
      q: 'Adaptação razoável é:',
      o: [
        'Um benefício extra que a empresa concede se quiser',
        'O ajuste necessário para que a pessoa trabalhe em igualdade de condições',
        'Um desconto na meta da pessoa com deficiência',
        'Uma exigência que vale apenas para empresas de grande porte',
      ],
    },
    {
      // 2
      q: 'O custo de uma adaptação razoável no posto de trabalho é, em regra:',
      o: [
        'Da própria pessoa com deficiência',
        'Dividido meio a meio entre a pessoa e a empresa',
        'Da empresa — e, na maioria dos casos, é baixo ou zero',
        'Do governo, por meio do INSS',
      ],
    },
    {
      // 3
      q: 'Legenda em vídeo, texto alternativo em imagem e navegação por teclado são exemplos de:',
      o: [
        'Acessibilidade digital, orientada pelas diretrizes WCAG',
        'Barreiras urbanísticas',
        'Tecnologia assistiva de uso estritamente individual',
        'Recursos que só interessam a quem tem deficiência visual',
      ],
    },
    {
      // 4
      q: 'Leitor de tela, teclado adaptado e lupa eletrônica são exemplos de:',
      o: [
        'Barreira metodológica',
        'Adaptação arquitetônica',
        'Benefício previdenciário',
        'Tecnologia assistiva',
      ],
    },
  ],

  /* ---------------------------------------------------------------- M4 -- */
  m4: [
    {
      // 0
      q: 'Dizer a um colega com deficiência "você é um exemplo de superação" é problemático porque:',
      o: [
        'É proibido por lei elogiar colegas de trabalho',
        'Somente a liderança pode fazer elogios públicos',
        'Transforma a vida cotidiana da pessoa em espetáculo motivacional para os outros',
        'Elogios devem ser sempre registrados por escrito',
      ],
    },
    {
      // 1
      q: 'Tirar as tarefas mais difíceis de um colega com deficiência "para não sobrecarregar" é:',
      o: [
        'Superproteção — trava a carreira da pessoa com a melhor das intenções',
        'Uma adaptação razoável prevista em lei',
        'Uma boa prática de gestão inclusiva',
        'Obrigatório sempre que a pessoa apresenta laudo',
      ],
    },
    {
      // 2
      q: 'Capacitismo é:',
      o: [
        'A capacidade técnica exigida por um cargo',
        'Um programa de capacitação para pessoas com deficiência',
        'A avaliação da aptidão de um candidato em processo seletivo',
        'O preconceito que trata a pessoa com deficiência como incapaz ou frágil',
      ],
    },
    {
      // 3
      q: 'Numa entrevista, concluir que o candidato com deficiência "não vai dar conta de viajar" antes de perguntar a ele é:',
      o: [
        'Cuidado legítimo com o bem-estar do candidato',
        'Viés inconsciente decidindo a seleção no lugar dos fatos',
        'Uma etapa normal do processo seletivo',
        'Uma forma de adaptação razoável',
      ],
    },
    {
      // 4
      q: 'Sobre ter vieses inconscientes:',
      o: [
        'Todo mundo tem; o que importa é perceber e corrigir antes que decidam algo',
        'Só têm vieses as pessoas mal-intencionadas',
        'Quem faz um treinamento uma vez elimina os vieses de vez',
        'Vieses são coisa da vida pessoal e não afetam decisões profissionais',
      ],
    },
  ],

  /* ---------------------------------------------------------------- M5 -- */
  m5: [
    {
      // 0
      q: 'Cumprir a cota e parar por aí costuma resultar em:',
      o: [
        'Uma equipe estável e satisfeita',
        'Alta rotatividade: a pessoa entra, não cresce e vai embora',
        'Redução automática da cota no ano seguinte',
        'Multa da fiscalização por excesso de contratações',
      ],
    },
    {
      // 1
      q: 'Um anúncio de vaga inclusivo deve:',
      o: [
        'Pedir laudo médico detalhado já na inscrição',
        'Evitar mencionar acessibilidade, para não constranger candidatos',
        'Listar somente vagas operacionais',
        'Descrever as atividades reais e perguntar de qual adaptação a pessoa precisa',
      ],
    },
    {
      // 2
      q: 'Deixar de dar um feedback difícil a um colega com deficiência "para não constranger" é:',
      o: [
        'Paternalismo — priva a pessoa da informação de que ela precisa para crescer',
        'Uma forma de adaptação razoável',
        'Uma recomendação expressa da LBI',
        'A postura mais respeitosa possível nesse caso',
      ],
    },
    {
      // 3
      q: 'Um novo colega com deficiência entra no seu time. A melhor postura é:',
      o: [
        'Evitar o assunto completamente',
        'Combinar tudo com o RH antes de falar diretamente com ele',
        'Tratar como colega e perguntar o que for prático, em vez de supor',
        'Oferecer ajuda em tudo, o tempo todo',
      ],
    },
    {
      // 4
      q: 'A inclusão deixa de depender de uma pessoa só quando:',
      o: [
        'A empresa contrata um consultor externo',
        'O RH assume todas as decisões dos times',
        'Um gestor engajado abraça o tema pessoalmente',
        'Vira processo: está na vaga, no onboarding, na avaliação e na promoção',
      ],
    },
  ],
}
