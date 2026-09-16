/* ==========================================================================
   Missao.tsx — a tela de uma missão: aprender → jogar → responder.

   A tela não sabe qual mini-game está rodando. Ela lê os tipos em
   `missoes.ts`, monta os componentes correspondentes e espera um
   `aoConcluir` — o contrato de `jogos/contrato.ts`. Acrescentar um sexto jogo
   é criar um arquivo e uma linha no mapa abaixo; nada aqui muda.

   É UM JOGO POR MISSÃO, mas a tela lê uma LISTA de jogos e monta uma etapa
   para cada. A generalidade custa nada e já se pagou uma vez: a trilha teve
   dois jogos por missão por um tempo, e voltar a ter não exigiria tocar em
   nada aqui — só em `missoes.ts` e na lista espelhada da Edge Function.

   Os jogos entram por `lazy()` porque são a parte pesada do bundle: quem abre
   a Missão 1 no 4G não deve baixar o Mito ou Fato da Missão 2. É também o que
   faz os dois jogos hoje fora da trilha não custarem download a ninguém.

   As etapas são botões numa grade que se redistribui, não abas empilhadas:
   no celular, botões de largura total gastariam a tela inteira antes de a
   pessoa ver qualquer conteúdo. A grade é `auto-fit` e não três colunas
   fixas, para aguentar uma quarta etapa sem deixar o último botão sozinho
   numa linha — ver `.etapas` no CSS.
   ========================================================================== */

import { Suspense, lazy, useCallback, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { concluirJogo } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import { useAvisos } from '../componentes/avisos'
import { Carregando, Nota, Selo } from '../componentes/comuns'
import Quiz from '../componentes/Quiz'
import { MISSAO_POR_ID, MISSOES, PERGUNTAS_POR_MISSAO, PTS_JOGO, type TipoJogo } from '../conteudo/missoes'
import { fezJogo, missaoCompleta, quizCompleto, tarefaDoJogo } from '../nucleo/progresso'
import { ErroApi, type IdMissao } from '../nucleo/tipos'
import type { PropsJogo, ResultadoJogo } from '../jogos/contrato'

const JOGOS: Record<TipoJogo, LazyExoticComponent<ComponentType<PropsJogo>>> = {
  memoria: lazy(() => import('../jogos/Memoria')),
  ligar: lazy(() => import('../jogos/LigarPares')),
  quebra: lazy(() => import('../jogos/QuebraCabeca')),
  mito: lazy(() => import('../jogos/MitoOuFato')),
  cenario: lazy(() => import('../jogos/Cenario')),
}

/** `aprender` · `quiz` · ou o tipo de um dos mini-games da missão. */
type Etapa = 'aprender' | 'quiz' | TipoJogo

export default function TelaMissao() {
  const { id } = useParams<{ id: string }>()
  const { progresso, registrar } = useEstado()
  const { avisar, comemorar } = useAvisos()
  const [etapa, setEtapa] = useState<Etapa>('aprender')

  const missao = id && id in MISSAO_POR_ID ? MISSAO_POR_ID[id as IdMissao] : null

  /* Este `useCallback` vem ANTES do `return` de rota inválida de propósito:
     hook depois de saída antecipada quebra a ordem dos hooks entre
     renderizações. Daí ele tolerar `missao` nulo. */
  const aoConcluirJogo = useCallback(
    async (tipo: TipoJogo, r: ResultadoJogo) => {
      if (!missao) return
      try {
        const c = await concluirJogo(missao.id, tipo, r)
        registrar(missao.id, tarefaDoJogo(tipo), c.pontos, c.total)
        if (!c.ja) {
          avisar(`+${c.pontos} pontos`, 'ok')
          comemorar(30)
        }
      } catch (e) {
        avisar(
          e instanceof ErroApi ? e.message : 'Não conseguimos registrar sua conclusão. Tente de novo.',
          'erro',
        )
      }
    },
    [missao, registrar, avisar, comemorar],
  )

  if (!missao) return <Navigate to="/" replace />

  const quizFeito = quizCompleto(progresso, missao.id)
  const completa = missaoCompleta(progresso, missao.id)
  const indice = MISSOES.findIndex((m) => m.id === missao.id)
  const proxima = MISSOES[indice + 1]

  const etapas: [Etapa, string][] = [
    ['aprender', 'Aprender'],
    ...missao.jogos.map((j) => [j.tipo, j.nome] as [Etapa, string]),
    ['quiz', 'Quiz'],
  ]

  /* A etapa seguinte na mesma fila. É o que o botão do fim de cada seção
     empurra — sem isso, cada seção precisaria saber o nome da próxima, e a
     Missão 3 (um jogo só) teria um botão a menos escrito na unha.

     O rótulo é "Continuar: <nome>" e não "Ir para o <nome>" porque o nome do
     jogo tem gênero próprio: "ir para o ligar os pares" e "ir para o
     simulação de cenário" não são frases. Dois pontos resolvem os cinco
     nomes de uma vez. */
  const posicao = etapas.findIndex(([e]) => e === etapa)
  const seguinte = etapas[posicao + 1]

  const jogoAtual = missao.jogos.find((j) => j.tipo === etapa)

  return (
    <div className="pilha-g">
      <p className="meta">
        <Link to="/">← Todas as missões</Link>
      </p>

      <header className="heroi">
        <div className="pilha-2">
          <p className="meta">
            Missão {indice + 1} de {MISSOES.length} · {missao.tema}
          </p>
          <h1>{missao.nome}</h1>
          <p>{missao.tagline}</p>
        </div>
        <div className="linha">
          {missao.jogos.map((j) => (
            <Selo key={j.tipo} estado={fezJogo(progresso, missao.id, j.tipo) ? 'ok' : 'pendente'}>
              {j.nome}
            </Selo>
          ))}
          <Selo estado={quizFeito ? 'ok' : 'pendente'}>{PERGUNTAS_POR_MISSAO} perguntas</Selo>
        </div>
      </header>

      {/* Navegável nas duas direções: quem quer reler o conteúdo no meio do
          quiz não deve perder o que já respondeu para isso. */}
      <nav aria-label="Etapas da missão" className="etapas">
        {etapas.map(([e, rotulo]) => (
          <button
            key={e}
            type="button"
            aria-current={etapa === e ? 'step' : undefined}
            onClick={() => setEtapa(e)}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      {etapa === 'aprender' && (
        <section className="pilha" aria-labelledby="t-aprender">
          <h2 id="t-aprender">O que você precisa saber</h2>
          <ul className="pilha sem-lista">
            {missao.aprender.map((t, i) => (
              <li key={i} className="painel prosa">
                {t}
              </li>
            ))}
          </ul>
          {seguinte && (
            <div className="acoes">
              <button
                type="button"
                className="botao botao--primario"
                onClick={() => setEtapa(seguinte[0])}
              >
                Continuar: {seguinte[1]} →
              </button>
            </div>
          )}
        </section>
      )}

      {jogoAtual &&
        (() => {
          const feito = fezJogo(progresso, missao.id, jogoAtual.tipo)
          const Jogo = JOGOS[jogoAtual.tipo]
          return (
            <section aria-labelledby="t-jogo" className="pilha">
              <div className="linha">
                <h2 id="t-jogo">{jogoAtual.nome}</h2>
                <Selo estado={feito ? 'ok' : 'neutro'}>
                  {feito ? 'Concluído' : `Vale ${PTS_JOGO} pontos`}
                </Selo>
              </div>
              <p className="meta">{jogoAtual.como}</p>

              {/* A `key` reinicia o jogo ao trocar de etapa. Sem ela, os dois
                  mini-games da missão compartilhariam a instância montada e o
                  segundo abriria com o tabuleiro do primeiro. */}
              <Suspense fallback={<Carregando texto="Preparando o jogo…" linhas={4} />}>
                <Jogo
                  key={jogoAtual.tipo}
                  aoConcluir={(r) => aoConcluirJogo(jogoAtual.tipo, r)}
                  jaFeito={feito}
                />
              </Suspense>

              {seguinte && (
                <div className="acoes">
                  <button
                    type="button"
                    className="botao botao--secundario"
                    onClick={() => setEtapa(seguinte[0])}
                  >
                    Continuar: {seguinte[1]} →
                  </button>
                </div>
              )}
            </section>
          )
        })()}

      {etapa === 'quiz' && (
        <section aria-labelledby="t-quiz" className="pilha">
          <h2 id="t-quiz">Quiz</h2>
          <Quiz missao={missao.id} />
        </section>
      )}

      {completa && (
        <Nota tipo="ok" vivo>
          <b>Missão concluída.</b>
          <div className="acoes" style={{ marginTop: '.75rem' }}>
            {proxima ? (
              <Link
                className="botao botao--primario"
                to={`/missao/${proxima.id}`}
                onClick={() => setEtapa('aprender')}
              >
                Próxima: {proxima.nome} →
              </Link>
            ) : (
              <Link className="botao botao--primario" to="/#certificado">
                Ver meu certificado →
              </Link>
            )}
          </div>
        </Nota>
      )}
    </div>
  )
}
