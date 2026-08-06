-- ===========================================================================
-- 002_gabarito.sql — as respostas certas das 25 perguntas.
--
-- ESTE ARQUIVO É O SEGREDO DO JOGO. A tabela abaixo não tem policy nenhuma
-- (ver 003) — nem `anon` nem `authenticated` conseguem lê-la. Quem a enxerga
-- é só a Edge Function `jogar`, que roda com service_role.
--
-- O `resposta` é o ÍNDICE da alternativa, começando em 0, na ordem em que ela
-- aparece em `src/conteudo/quizzes.ts`. Mexeu na ordem das alternativas lá,
-- mexa no número aqui — os dois arquivos trazem o número da pergunta em
-- comentário justamente para essa conferência.
-- ===========================================================================

create table if not exists public.quiz_gabarito (
  missao     text    not null,
  pergunta   integer not null,
  resposta   integer not null,
  explicacao text    not null,
  primary key (missao, pergunta)
);

-- Recarregável: rodar de novo corrige o conteúdo sem duplicar linha.
insert into public.quiz_gabarito (missao, pergunta, resposta, explicacao) values

-- ------------------------------------------------------------------- M1 ---
('m1', 0, 1, $t$Este é o modelo social, adotado pela Convenção da ONU e pela lei brasileira: a deficiência não está só na pessoa, está no encontro entre a condição dela e as barreiras do ambiente. Tire a barreira e a limitação diminui.$t$),
('m1', 1, 2, $t$A Lei 8.213/91 vale para empresas com 100 ou mais empregados. Abaixo disso não há cota obrigatória — o que não impede ninguém de contratar.$t$),
('m1', 2, 0, $t$A faixa é progressiva: 2% de 100 a 200 empregados, 3% de 201 a 500, 4% de 501 a 1.000 e 5% acima de 1.000.$t$),
('m1', 3, 3, $t$A LBI proíbe exigir aptidão plena. O critério legítimo é a aptidão para as atividades reais da vaga, considerando as adaptações necessárias.$t$),
('m1', 4, 2, $t$Não é caridade nem ação social: é obrigação legal. E, antes disso, é acesso a profissionais que o processo seletivo tradicional deixava de fora.$t$),

-- ------------------------------------------------------------------- M2 ---
('m2', 0, 2, $t$"Pessoa com deficiência" — pessoa primeiro. "Portador" saiu de uso porque ninguém porta uma deficiência como quem porta um documento; "especial" e "excepcional" também ficaram para trás.$t$),
('m2', 1, 0, $t$Fale com a pessoa surda, olhando para ela. O intérprete traduz — não é com ele que a conversa acontece. O mesmo vale para acompanhantes de qualquer tipo.$t$),
('m2', 2, 3, $t$Pergunte antes e aceite o "não, obrigado" sem insistir. Empurrar a cadeira sem avisar pode assustar e até machucar: a cadeira é extensão do corpo da pessoa.$t$),
('m2', 3, 1, $t$Cão-guia é animal de trabalho. Chamar, tocar ou oferecer comida tira a atenção dele de uma função que envolve a segurança da pessoa. E ele tem entrada garantida por lei em qualquer ambiente.$t$),
('m2', 4, 2, $t$A Lei 12.764/2012 estabelece que a pessoa com TEA é considerada pessoa com deficiência para todos os efeitos legais — inclusive para a cota.$t$),

-- ------------------------------------------------------------------- M3 ---
('m3', 0, 3, $t$A barreira atitudinal é a mais cara e a mais invisível das seis: nenhuma rampa resolve um gestor que já decidiu que a pessoa não dá conta.$t$),
('m3', 1, 1, $t$Adaptação razoável é o ajuste que coloca a pessoa em igualdade de condições — mesa mais alta, horário diferente, leitor de tela, intérprete. Não é benefício, não é favor.$t$),
('m3', 2, 2, $t$A conta é da empresa, e costuma ser baixa: boa parte das adaptações é mudança de altura, de local, de horário ou de configuração de software.$t$),
('m3', 3, 0, $t$É acessibilidade digital, orientada pelas WCAG. Repare que quase tudo ali transborda: legenda serve a quem está no ônibus sem fone, contraste serve a quem está no sol.$t$),
('m3', 4, 3, $t$Tecnologia assistiva é qualquer recurso que amplia a autonomia da pessoa — de um leitor de tela a uma lupa eletrônica ou um teclado adaptado.$t$),

-- ------------------------------------------------------------------- M4 ---
('m4', 0, 2, $t$É a chamada inspiração forçada. Trabalhar, estudar e pagar contas não é façanha: é vida adulta. Transformar a rotina da pessoa em espetáculo motivacional diz mais sobre quem assiste.$t$),
('m4', 1, 0, $t$Superproteção também exclui. Tirar o projeto difícil, poupar a viagem ou evitar o feedback trava a carreira da pessoa — com a melhor das intenções, e por isso é difícil de perceber.$t$),
('m4', 2, 3, $t$Capacitismo é o preconceito que trata a pessoa com deficiência como incapaz, frágil ou inspiradora só por existir. Quase sempre chega vestido de gentileza.$t$),
('m4', 3, 1, $t$É viés inconsciente decidindo no lugar dos fatos. A pergunta legítima é a mesma que se faz a qualquer candidato: como você se organiza para as viagens da vaga?$t$),
('m4', 4, 0, $t$Todo mundo tem viés — não é defeito de caráter. O que conta é perceber e corrigir antes que ele decida uma contratação, uma promoção ou uma escala.$t$),

-- ------------------------------------------------------------------- M5 ---
('m5', 0, 1, $t$É o erro mais comum: cumprir a cota e parar. Sem plano de carreira a pessoa entra, não cresce e vai embora — e a vaga reabre todo ano, como se o problema fosse o mercado.$t$),
('m5', 1, 3, $t$Vaga inclusiva começa no anúncio: descrever as atividades reais, informar sobre a acessibilidade do local e perguntar de qual adaptação a pessoa precisa já na entrevista.$t$),
('m5', 2, 0, $t$Feedback é direito, não risco. Suavizar até virar elogio priva a pessoa da informação de que ela precisa para crescer — e depois ninguém entende por que ela não avança.$t$),
('m5', 3, 2, $t$Trate como colega. Perguntar o que for prático — o melhor jeito de combinar reunião, de mandar arquivo, de avisar mudança — resolve mais que qualquer suposição bem-intencionada.$t$),
('m5', 4, 3, $t$Enquanto depende de uma pessoa engajada, a inclusão acaba na próxima troca de gestor. Vira política quando está no processo: na vaga, no onboarding, na avaliação e na promoção.$t$)

on conflict (missao, pergunta) do update
  set resposta = excluded.resposta,
      explicacao = excluded.explicacao;
