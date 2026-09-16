/* ==========================================================================
   quizzes.ts — enunciados e alternativas das 15 perguntas.

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

   Nenhuma pergunta cobra número de lei, percentual de cota ou nome de
   estatuto: o quiz mede o que a pessoa faz na segunda-feira, não o que ela
   decorou de norma.
   ========================================================================== */

import type { IdMissao } from '../nucleo/tipos'

export interface Pergunta {
  q: string
  o: [string, string, string, string]
}

export const QUIZZES: Record<IdMissao, Pergunta[]> = {
  /* ------------------------------------------------------ M1 · ENTENDER -- */
  m1: [
    {
      // 0
      q: 'Segundo o modelo social, a deficiência é resultado de:',
      o: [
        'Uma limitação que está apenas no corpo da pessoa',
        'Da interação entre uma condição de longo prazo e as barreiras do ambiente',
        'De uma doença que precisa ser curada para a pessoa poder trabalhar',
        'Da falta de esforço da pessoa em se adaptar ao ambiente',
      ],
    },
    {
      // 1
      q: 'O termo recomendado hoje para se referir a essas pessoas é:',
      o: [
        'Portador de necessidades especiais',
        'Pessoa portadora de deficiência',
        'Pessoa com deficiência',
        'Pessoa especial',
      ],
    },
    {
      // 2
      q: 'Você conversa com uma pessoa surda acompanhada de intérprete de Libras. O correto é:',
      o: [
        'Olhar e falar com a pessoa surda; o intérprete faz a tradução',
        'Olhar e falar com o intérprete, que repassa o recado',
        'Falar bem mais alto e bem devagar',
        'Escrever tudo em papel, para não haver erro',
      ],
    },
    {
      // 3
      q: 'Uma pessoa em cadeira de rodas parece ter dificuldade com uma porta pesada. Você deve:',
      o: [
        'Empurrar a cadeira dela para ajudar mais rápido',
        'Chamar outra pessoa para resolver',
        'Fingir que não viu, para não constranger',
        'Perguntar se ela quer ajuda e, se sim, de que forma',
      ],
    },
    {
      // 4
      q: 'Sobre o cão-guia que acompanha uma pessoa com deficiência visual:',
      o: [
        'Pode receber carinho quando estiver parado',
        'Está trabalhando: não se chama, não se toca e não se oferece comida',
        'Deve ficar do lado de fora dos prédios',
        'Precisa de autorização prévia da empresa para entrar',
      ],
    },
  ],

  /* --------------------------------------------------- M2 · DESAPRENDER -- */
  m2: [
    {
      // 0
      q: 'Entre os seis tipos de barreira, a barreira ATITUDINAL é:',
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
        'Um esforço que só empresas de grande porte conseguem fazer',
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
      q: 'Dizer a um colega com deficiência "você é um exemplo de superação" é problemático porque:',
      o: [
        'Elogios devem ser feitos sempre em particular',
        'Somente a liderança pode fazer elogios públicos',
        'Transforma a vida cotidiana da pessoa em espetáculo motivacional para os outros',
        'Elogios devem ser sempre registrados por escrito',
      ],
    },
    {
      // 4
      q: 'Tirar as tarefas mais difíceis de um colega com deficiência "para não sobrecarregar" é:',
      o: [
        'Superproteção — trava a carreira da pessoa com a melhor das intenções',
        'Uma forma de adaptação razoável',
        'Uma boa prática de gestão inclusiva',
        'O caminho recomendado sempre que a pessoa tem um laudo',
      ],
    },
  ],

  /* ---------------------------------------------------------- M3 · AGIR -- */
  m3: [
    {
      // 0
      q: 'Contratar pessoas com deficiência e parar por aí costuma resultar em:',
      o: [
        'Uma equipe estável e satisfeita',
        'Alta rotatividade: a pessoa entra, não cresce e vai embora',
        'Um clima de time mais coeso, sem esforço adicional',
        'Uma economia relevante para a empresa',
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
        'Um cuidado recomendado com colegas com deficiência',
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
