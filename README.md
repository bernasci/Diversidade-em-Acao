# Diversidade em Ação

Gamificação individual sobre a inclusão de **Pessoas com Deficiência (PcD) no mundo do trabalho**.
Cinco missões, cada uma com um mini-game diferente e um quiz de cinco perguntas. Acesso restrito à
lista de e-mails fornecida pelo RH.

---

## Node.js

Precisa da versão **20 ou superior**. Confira com `node -v`.

Se o comando não for reconhecido, o Node pode estar instalado em pasta portátil, fora do PATH — foi o
caso desta máquina durante o desenvolvimento, com uma cópia em `Downloads\node-v24.18.1-win-x64`.
Para resolver de vez, instale de verdade:

```powershell
winget install OpenJS.NodeJS.LTS
```

Feche e reabra o terminal depois.

## Rodar localmente

```powershell
npm install
npm run dev                 # abre em http://localhost:5180
```

Funciona sem configuração: o app já aponta para o banco de produção
([`src/nucleo/projeto.ts`](src/nucleo/projeto.ts)). Só crie um `.env` para usar as **ferramentas de
linha de comando** (`importar`, `fumaca`), que precisam da service_role key, ou para apontar o app a
outro banco — veja [`.env.example`](.env.example).

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checa os tipos e gera `dist/` |
| `npm run checar` | só a checagem de tipos |
| `npm run importar -- lista.csv` | carrega a lista do RH na tabela `elegiveis` |
| `npm run fumaca` | **teste ponta a ponta** contra o projeto real (40 verificações) |
| `npm run carga -- 200` | teste de carga contra o projeto real |

`npm run fumaca` é a rede de segurança do projeto: cria um participante de QA descartável, joga por
cima dele, confere idempotência, gabarito fora do cliente, campos que o jogador não pode escrever e o
que a view do ranking expõe — e apaga tudo no fim. Rode depois de qualquer mudança nas Edge
Functions, nas migrations ou nas regras de pontuação.

---

## Configurar o Supabase

1. Crie um projeto novo em <https://supabase.com> (região **South America (São Paulo)** — é a mais
   próxima e a que dá a menor latência para quem vai jogar).
2. No **SQL Editor**, rode os quatro arquivos de `supabase/migrations/` **nesta ordem**:
   `001_base.sql` → `002_gabarito.sql` → `003_seguranca.sql` → `004_ranking.sql`.
3. Em **Database → Extensions**, ligue **pg_cron** e descomente o bloco `cron.schedule` no fim do
   `004_ranking.sql`. Sem isso o ranking ainda funciona, mas atualiza de forma oportunista.
4. Publique as Edge Functions:
   ```bash
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase functions deploy entrar --no-verify-jwt
   npx supabase functions deploy jogar  --no-verify-jwt
   ```
5. Em **Settings → API**, copie a **Project URL** e a **anon key** para o `.env`. A **service_role
   key** vai no `.env` também, mas só é usada pelas ferramentas de linha de comando — ela nunca
   entra no bundle do navegador.
6. Importe a lista do RH:
   ```powershell
   npm run importar -- ferramentas/lista.csv --simular   # confere o que foi lido
   npm run importar -- ferramentas/lista.csv             # envia de verdade
   ```

### Modelo de segurança, em uma frase

**O navegador não fala com o banco.** Todas as tabelas têm RLS ligado e nenhuma policy — na prática,
`anon` não lê nem escreve nada. Quem acessa é a service_role, só dentro das Edge Functions. A única
exceção é a view `ranking_publico`, com `grant select to anon`, e ela expõe apelido, área e pontos de
quem optou por aparecer. E-mail, nome completo e id não estão nela.

O gabarito das 25 perguntas vive em `quiz_gabarito`, que ninguém fora da função `jogar` consegue ler.
Abrir o DevTools durante o quiz não revela resposta nenhuma.

---

## Deploy (Vercel)

```bash
npx vercel            # primeira vez
npx vercel --prod
```

**Não é preciso configurar variável de ambiente nenhuma.** A URL e a anon key do projeto vivem em
[`src/nucleo/projeto.ts`](src/nucleo/projeto.ts) — as duas são públicas por construção e iriam para
dentro do bundle de qualquer forma, já que variável `VITE_*` é substituída no momento do build. O
`.env` continua funcionando e tem prioridade, para apontar o app a um banco de homologação.

O `vercel.json` já traz o rewrite de SPA e os cabeçalhos de segurança.

O front **precisa** ficar na Vercel, e não no Supabase: assim HTML, CSS e JS não consomem o egress de
5 GB do plano Free do banco.

---

## Capacidade — 5.602 pessoas no plano Free

| Limite | Uso estimado | Margem |
| --- | --- | --- |
| 500 MB de banco | ~40–60 MB (5.602 perfis + ~112 mil linhas de progresso) | 8× |
| 5 GB de egress | ~1–2 GB | 2,5× |
| 500 mil invocações de função | ~112 mil | 4× |
| 50.000 MAU no Auth | não usamos o GoTrue | — |
| SMTP nativo: 2 e-mails/hora | o app não envia e-mail | — |

O gargalo real não é cota: é **pico de concorrência**. A instância do plano Free é compartilhada e
vai sofrer se os 5.602 abrirem o app no mesmo minuto, logo depois de um e-mail do RH. Duas saídas,
ambas válidas: lançar escalonado por área, ou subir para o plano Pro (US$ 25) só no mês da campanha.
Rode `npm run carga -- 300` antes de decidir — as instruções de preparo estão no cabeçalho do script.

---

## Estrutura

```
src/
  nucleo/        api, sessão, estado, progresso, acessibilidade
  componentes/   quiz, avisos, peças comuns
  telas/         entrada, início, missão, ranking, perfil, certificado
  jogos/         os cinco mini-games + o contrato que os une
  conteudo/      missões, 25 perguntas (sem gabarito), dados dos mini-games
  estilo/        tokens de marca, base, componentes, jogos
supabase/
  migrations/    001 base · 002 gabarito · 003 segurança · 004 ranking
  functions/     entrar, jogar
  consultas.sql  o painel do RH, em SQL
ferramentas/     importador da lista, teste de carga
```

### As cinco missões

| # | Tema | Mini-game |
| --- | --- | --- |
| M1 | Conceitos e a Lei de Cotas | Jogo da memória |
| M2 | Tipos de deficiência e comunicação respeitosa | Ligar os pares |
| M3 | Acessibilidade e adaptações razoáveis | Quebra-cabeça |
| M4 | Capacitismo e vieses inconscientes | Mito ou Fato |
| M5 | Carreira, liderança e inclusão no dia a dia | Simulação de cenário |

Pontuação: 10 por mini-game + 2 por acerto no quiz (10 por missão) + 20 de bônus ao fechar as cinco.
**Total: 120 pontos.** Medalhas: Bronze (1 missão), Prata (3), Ouro (5), Platina (5 com 25 acertos).

---

## Acessibilidade

Um jogo sobre inclusão de PcD que não seja operável por teclado e leitor de tela se desqualifica
sozinho. Por isso, e não como polimento final:

- **Os cinco mini-games funcionam só com teclado.** Onde há arrastar (M2), o mecanismo real é
  "seleciono, depois escolho o destino" — o drag é uma camada opcional por cima.
- **O jogo cronometrado (M4) pergunta antes se você quer cronômetro**, com o mesmo peso visual das
  duas opções, e as duas valem os mesmos pontos (WCAG 2.2.1).
- Barra fixa no topo para **tamanho do texto, alto contraste e desligar animações**.
- **VLibras** embutido, foco visível, `aria-live` nos resultados, foco movido para o conteúdo a cada
  troca de tela, e nenhum estado comunicado só por cor.
- O certificado é `<canvas>`, então o mesmo conteúdo aparece logo abaixo em texto real.

**Checagem antes de publicar:** percorrer o jogo inteiro só com Tab/Enter, rodar o NVDA nas missões 1
e 2, e conferir Lighthouse Accessibility ≥ 95 em todas as telas.
