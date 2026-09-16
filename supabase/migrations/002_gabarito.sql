-- ===========================================================================
-- 002_gabarito.sql — as respostas certas das 15 perguntas.
--
-- ESTE ARQUIVO É O SEGREDO DO JOGO. A tabela abaixo não tem policy nenhuma
-- (ver 003) — nem `anon` nem `authenticated` conseguem lê-la. Quem a enxerga
-- é só a Edge Function `jogar`, que roda com service_role.
--
-- O `resposta` é o ÍNDICE da alternativa, começando em 0, na ordem em que ela
-- aparece em `src/conteudo/quizzes.ts`. Mexeu na ordem das alternativas lá,
-- mexa no número aqui — os dois arquivos trazem o número da pergunta em
-- comentário justamente para essa conferência.
--
-- RODAR DE NOVO É SEGURO e é o jeito de aplicar a trilha de três missões:
-- o `delete` de baixo tira as perguntas das missões que deixaram de existir,
-- e o `on conflict` corrige as que ficaram. Rode junto com o 007, que limpa o
-- progresso — quiz novo com progresso velho deixa gente com "quiz-4" de uma
-- pergunta que mudou de assunto.
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

-- ---------------------------------------------------- M1 · ENTENDER ------
('m1', 0, 1, $t$Este é o modelo social: a deficiência não está só na pessoa, está no encontro entre a condição dela e as barreiras do ambiente. Tire a barreira e a limitação diminui — a mesma pessoa é "deficiente" num prédio e não é em outro.$t$),
('m1', 1, 2, $t$"Pessoa com deficiência" — pessoa primeiro. "Portador" saiu de uso porque ninguém porta uma deficiência como quem porta um documento; "especial" e "excepcional" também ficaram para trás.$t$),
('m1', 2, 0, $t$Fale com a pessoa surda, olhando para ela. O intérprete traduz — não é com ele que a conversa acontece. O mesmo vale para acompanhantes de qualquer tipo.$t$),
('m1', 3, 3, $t$Pergunte antes e aceite o "não, obrigado" sem insistir. Empurrar a cadeira sem avisar pode assustar e até machucar: a cadeira é extensão do corpo da pessoa.$t$),
('m1', 4, 1, $t$Cão-guia é animal de trabalho. Chamar, tocar ou oferecer comida tira a atenção dele de uma função que envolve a segurança da pessoa — e ele acompanha a pessoa em qualquer ambiente.$t$),

-- ------------------------------------------------- M2 · DESAPRENDER ------
('m2', 0, 3, $t$A barreira atitudinal é a mais cara e a mais invisível das seis: nenhuma rampa resolve um gestor que já decidiu que a pessoa não dá conta.$t$),
('m2', 1, 1, $t$Adaptação razoável é o ajuste que coloca a pessoa em igualdade de condições — mesa mais alta, horário diferente, leitor de tela, intérprete. Não é benefício, não é favor, e costuma custar pouco ou nada.$t$),
('m2', 2, 3, $t$Capacitismo é o preconceito que trata a pessoa com deficiência como incapaz, frágil ou inspiradora só por existir. Quase sempre chega vestido de gentileza.$t$),
('m2', 3, 2, $t$É a chamada inspiração forçada. Trabalhar, estudar e pagar contas não é façanha: é vida adulta. Transformar a rotina da pessoa em espetáculo motivacional diz mais sobre quem assiste.$t$),
('m2', 4, 0, $t$Superproteção também exclui. Tirar o projeto difícil, poupar a viagem ou evitar o feedback trava a carreira da pessoa — com a melhor das intenções, e por isso é difícil de perceber.$t$),

-- -------------------------------------------------------- M3 · AGIR ------
('m3', 0, 1, $t$É o erro mais comum: contratar e parar. Sem plano de carreira a pessoa entra, não cresce e vai embora — e a vaga reabre todo ano, como se o problema fosse o mercado.$t$),
('m3', 1, 3, $t$Vaga inclusiva começa no anúncio: descrever as atividades reais, informar sobre a acessibilidade do local e perguntar de qual adaptação a pessoa precisa já na entrevista.$t$),
('m3', 2, 0, $t$Feedback é direito, não risco. Suavizar até virar elogio priva a pessoa da informação de que ela precisa para crescer — e depois ninguém entende por que ela não avança.$t$),
('m3', 3, 2, $t$Trate como colega. Perguntar o que for prático — o melhor jeito de combinar reunião, de mandar arquivo, de avisar mudança — resolve mais que qualquer suposição bem-intencionada.$t$),
('m3', 4, 3, $t$Enquanto depende de uma pessoa engajada, a inclusão acaba na próxima troca de gestor. Vira política quando está no processo: na vaga, no onboarding, na avaliação e na promoção.$t$)

on conflict (missao, pergunta) do update
  set resposta = excluded.resposta,
      explicacao = excluded.explicacao;

-- A trilha tinha cinco missões e passou a ter três. Sem esta linha, `m4` e
-- `m5` ficariam no banco como gabarito de perguntas que nenhuma tela mostra.
delete from public.quiz_gabarito where missao not in ('m1', 'm2', 'm3');
