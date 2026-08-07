# Operação — guia do RH

Este documento é para quem vai **operar** a campanha, não para quem programa. Tudo aqui se faz pelo
painel do Supabase, no navegador.

---

## 1. A lista de participantes

**Só entra no jogo quem estiver na lista.** Ela vive na tabela `elegiveis` e é carregada a partir de
um CSV exportado do Excel.

O arquivo precisa de uma linha de cabeçalho e de, no mínimo, uma coluna de e-mail. Os nomes aceitos
são flexíveis — não é preciso renomear nada:

| Coluna | Nomes aceitos | Obrigatória |
| --- | --- | --- |
| E-mail | `email`, `e-mail`, `mail` | **sim** |
| Nome | `nome`, `colaborador`, `nome completo` | recomendada |
| Área | `area`, `área`, `setor`, `departamento`, `lotação` | recomendada |
| Empresa | `empresa`, `organização`, `companhia`, `cliente` | recomendada |
| Matrícula | `matricula`, `matrícula`, `chapa`, `registro` | não |

**Nome, área e empresa aparecem no ranking** de quem escolher participar — nessa ordem, com área e
empresa em letra menor abaixo do nome. Se vierem em branco, a pessoa aparece só com o e-mail
encurtado, o que fica pior para todo mundo. A coluna **empresa** existe porque o evento não é só da
DOME: participam pessoas de outras empresas.

Do nome completo, o ranking mostra só **primeiro nome + último sobrenome** — "Maria da Silva Santos
Oliveira" vira "Maria Oliveira". O nome completo nunca sai do servidor.

> **Corrigiu a lista depois?** Basta reimportar. Nome, área e empresa de quem já entrou são
> atualizados no próximo acesso da pessoa.

Veja `ferramentas/exemplo-lista.csv` para o formato.

**Carregar a lista** (com quem cuida do técnico, uma vez só):

```powershell
npm run importar -- ferramentas/lista.csv --simular   # confere o que foi lido, sem enviar
npm run importar -- ferramentas/lista.csv             # envia
```

Pode rodar quantas vezes quiser. E-mail repetido **atualiza** a linha; não duplica. Quando o RH
mandar a lista corrigida, é só rodar de novo.

> A lista tem e-mails de pessoas reais e por isso **não entra no repositório** — o `.gitignore` já
> bloqueia qualquer arquivo `ferramentas/lista*.csv`.

### Alguém disse que não consegue entrar

Quase sempre é e-mail fora da lista, ou grafado diferente do que veio na planilha. Confira no SQL
Editor:

```sql
select * from public.elegiveis where email ilike '%parte.do.nome%';
```

Para incluir uma pessoa isolada, sem recarregar a lista inteira:

```sql
insert into public.elegiveis (email, nome, area, matricula)
values ('nome.sobrenome@empresa.com.br', 'Nome Sobrenome', 'Área', '12345')
on conflict (email) do update
  set nome = excluded.nome, area = excluded.area, matricula = excluded.matricula;
```

Para **remover** alguém (apaga junto o progresso da pessoa, por cascata):

```sql
delete from public.elegiveis where email = 'nome.sobrenome@empresa.com.br';
```

---

## 2. Acompanhar a campanha

Abra **SQL Editor** no painel do Supabase, copie do arquivo `supabase/consultas.sql` o bloco que
interessa e execute só ele. Os blocos prontos:

1. **Adesão** — convidados, quantos entraram, quantos começaram a jogar.
2. **Conclusão** — quantas pessoas fecharam as 5 missões, e quantas pararam em 4, 3, 2, 1.
3. **Onde as pessoas param** — por missão. Se uma missão despenca em relação à anterior, o problema
   costuma ser dela: conteúdo longo demais, jogo confuso.
4. **Perguntas mais erradas** — é a melhor pauta de comunicação interna que a campanha produz: mostra
   o que a empresa inteira ainda não sabe sobre inclusão de PcD.
5. **Adesão por área** — para cobrar gestor e para planejar o lançamento escalonado.
6. **Quem concluiu tudo** — a lista para emitir reconhecimento.

---

## 3. Lançamento

O risco não é o número total de pessoas: é **todo mundo entrar no mesmo minuto**, logo depois do
e-mail de divulgação. Duas formas de lidar:

- **Escalonar** — divulgar por área, em lotes, ao longo de alguns dias. É de graça e funciona.
- **Subir de plano** — o plano Pro do Supabase (US$ 25) só no mês da campanha, e voltar ao Free
  depois. Nenhuma linha de código muda.

A decisão sai de um teste: quem cuida do técnico roda `npm run carga -- 300` e olha a latência p95.
Acima de 2 segundos, escalone.

---

## 4. Sobre a segurança do acesso

O login é **só o e-mail corporativo**, sem senha e sem código. Foi uma escolha consciente: senha para
5.602 pessoas gera fila no suporte, e link por e-mail exigiria um servidor de envio próprio, com
risco de cair em spam corporativo no dia do lançamento.

O que isso significa na prática: **quem souber o e-mail de um colega consegue entrar no lugar dele.**
Como a premiação é simbólica e o ranking é opcional, o risco é baixo.

Se em algum momento a campanha passar a valer prêmio material, dá para exigir **e-mail + matrícula**
sem refazer nada — a matrícula já está sendo guardada na lista desde o começo justamente para isso.
Basta pedir ao técnico: são poucas linhas na função `entrar`, já escritas e comentadas no código.

---

## 5. Privacidade

- O **ranking é opcional e desligado por padrão**. Ninguém aparece sem ter marcado a opção no Perfil,
  e quem sair depois some também da busca.
- O ranking mostra **nome (primeiro + último sobrenome), área, empresa e pontos**. Nunca e-mail,
  nunca nome completo, nunca matrícula.
- A tela do Perfil lista, com todas as letras, o que fica visível antes de a pessoa decidir. Como o
  ranking passou a mostrar **nome real** — e não mais um apelido —, vale mencionar isso na
  comunicação de lançamento: a escolha é de cada um, mas ela precisa ser informada.
- O certificado é gerado no próprio celular ou computador da pessoa e baixado como imagem. Não fica
  guardado em lugar nenhum.
- As consultas do item 2 que trazem nome e e-mail (a de número 6) são para uso interno do RH.
