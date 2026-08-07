/* ==========================================================================
   Missao.tsx — a tela de uma missão: aprender → jogar → responder.

   A tela não sabe qual mini-game está rodando. Ela lê o tipo em `missoes.ts`,
   monta o componente correspondente e espera um `aoConcluir` — o contrato de
   `jogos/contrato.ts`. Acrescentar um sexto jogo é criar um arquivo e uma
   linha no mapa abaixo; nada aqui muda.

   Os jogos entram por `lazy()` porque são a parte pesada do bundle e quase
   nunca aparecem juntos: quem abre a Missão 1 no 4G não deve baixar o
   quebra-cabeça da Missão 3.

   As três etapas são botões numa fila rolável, não abas empilhadas: no
   celular, três botões de largura total gastariam metade da tela antes de a
   pessoa ver qualquer conteúdo.
   ========================================================================== */

import { Suspense, lazy, useCallback, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { concluirJogo } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import { useAvisos } from '../componentes/avisos'
import { Carregando, Nota, Selo } from '../componentes/comuns'
import Quiz from '../componentes/Quiz'
import { MISSAO_POR_ID, MISSOES, PERGUNTAS_POR_MISSAO, PTS_JOGO, type TipoJogo } from '../conteudo/missoes'
import { fezJogo, missaoCompleta, quizCompleto } from '../nucleo/progresso'
import { ErroApi, type IdMissao } from '../nucleo/tipos'
import type { PropsJogo, ResultadoJogo } from '../jogos/contrato'

const JOGOS: Record<TipoJogo, LazyExoticComponent<ComponentType<PropsJogo>>> = {
  memoria: lazy(() => import('../jogos/Memoria')),
  ligar: lazy(() => import('../jogos/LigarPares')),
  quebra: lazy(() => import('../jogos/QuebraCabeca')),
  mito: lazy(() => import('../jogos/MitoOuFato')),
  cenario: lazy(() => import('../jogos/Cenario')),
}

type Etapa = 'aprender' | 'jogo' | 'quiz'

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
    async (r: ResultadoJogo) => {
      if (!missao) return
      try {
        const c = await concluirJogo(missao.id, r)
        registrar(missao.id, 'jogo', c.pontos, c.total)
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

  const jogoFeito = fezJogo(progresso, missao.id)
  const quizFeito = quizCompleto(progresso, missao.id)
  const completa = missaoCompleta(progresso, missao.id)
  const Jogo = JOGOS[missao.jogo]
  const indice = MISSOES.findIndex((m) => m.id === missao.id)
  const proxima = MISSOES[indice + 1]

  const etapas: [Etapa, string][] = [
    ['aprender', 'Aprender'],
    ['jogo', missao.jogoNome],
    ['quiz', 'Quiz'],
  ]

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
          <Selo estado={jogoFeito ? 'ok' : 'pendente'}>{missao.jogoNome}</Selo>
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
          <div className="acoes">
            <button type="button" className="botao botao--primario" onClick={() => setEtapa('jogo')}>
              Ir para o {missao.jogoNome.toLowerCase()} →
            </button>
          </div>
        </section>
      )}

      {etapa === 'jogo' && (
        <section aria-labelledby="t-jogo" className="pilha">
          <div className="linha">
            <h2 id="t-jogo">{missao.jogoNome}</h2>
            <Selo estado={jogoFeito ? 'ok' : 'neutro'}>
              {jogoFeito ? 'Concluído' : `Vale ${PTS_JOGO} pontos`}
            </Selo>
          </div>
          <p className="meta">{missao.jogoComo}</p>

          <Suspense fallback={<Carregando texto="Preparando o jogo…" linhas={4} />}>
            <Jogo aoConcluir={aoConcluirJogo} jaFeito={jogoFeito} />
          </Suspense>

          <div className="acoes">
            <button type="button" className="botao botao--secundario" onClick={() => setEtapa('quiz')}>
              Ir para o quiz →
            </button>
          </div>
        </section>
      )}

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
              <Link className="botao botao--primario" to="/conquistas">
                Ver meu certificado →
              </Link>
            )}
          </div>
        </Nota>
      )}
    </div>
  )
}
