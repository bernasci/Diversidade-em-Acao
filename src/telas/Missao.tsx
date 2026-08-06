/* ==========================================================================
   Missao.tsx — a tela de uma missão: aprender → jogar → responder.

   A tela não sabe qual mini-game está rodando. Ela lê o tipo em `missoes.ts`,
   monta o componente correspondente e espera um `aoConcluir` — o contrato de
   `jogos/contrato.ts`. Acrescentar um sexto jogo é criar um arquivo e uma
   linha no mapa abaixo; nada aqui muda.

   Os jogos entram por `lazy()` porque são a parte pesada do bundle e quase
   nunca aparecem juntos: quem abre a Missão 1 no 4G não deve baixar o
   quebra-cabeça da Missão 3.
   ========================================================================== */

import { Suspense, lazy, useCallback, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { concluirJogo } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import { useAvisos } from '../componentes/avisos'
import { Carregando, Selo } from '../componentes/comuns'
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
          avisar(`+${c.pontos} pontos pelo ${missao.jogoNome.toLowerCase()}`, 'ok')
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
  const proxima = MISSOES[MISSOES.findIndex((m) => m.id === missao.id) + 1]

  return (
    <div className="pilha--g pilha">
      <p>
        <Link to="/">← Voltar para as missões</Link>
      </p>

      <header className="pilha">
        <span className="missao-cartao__ordem">
          <span aria-hidden="true">{missao.ico} </span>
          {missao.ordem} · {missao.tema}
        </span>
        <h1>{missao.nome}</h1>
        <p style={{ color: 'var(--ink-2)' }}>{missao.tagline}</p>
        <div className="linha">
          <Selo estado={jogoFeito ? 'ok' : 'pendente'}>{missao.jogoNome}</Selo>
          <Selo estado={quizFeito ? 'ok' : 'pendente'}>Quiz de {PERGUNTAS_POR_MISSAO} perguntas</Selo>
        </div>
      </header>

      {/* Três etapas, navegáveis nas duas direções: quem quer reler o conteúdo
          no meio do quiz não deve perder o que já respondeu para isso. */}
      <nav aria-label="Etapas da missão" className="linha">
        {(
          [
            ['aprender', '1. Aprender'],
            ['jogo', `2. ${missao.jogoNome}`],
            ['quiz', '3. Quiz'],
          ] as [Etapa, string][]
        ).map(([e, rotulo]) => (
          <button
            key={e}
            type="button"
            className={`botao ${etapa === e ? 'botao--primario' : 'botao--secundario'}`}
            aria-current={etapa === e ? 'step' : undefined}
            onClick={() => setEtapa(e)}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      {etapa === 'aprender' && (
        <section className="cartao pilha" aria-labelledby="t-aprender">
          <h2 id="t-aprender">O que você precisa saber</h2>
          <ul className="pilha" style={{ paddingLeft: '1.25rem', gap: '.75rem' }}>
            {missao.aprender.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <button type="button" className="botao botao--primario" onClick={() => setEtapa('jogo')}>
            Ir para o {missao.jogoNome.toLowerCase()} →
          </button>
        </section>
      )}

      {etapa === 'jogo' && (
        <section aria-labelledby="t-jogo" className="pilha">
          <h2 id="t-jogo">
            {missao.jogoNome}{' '}
            <span className="discreto" style={{ fontWeight: 400 }}>
              {jogoFeito ? '· já concluído' : `· vale ${PTS_JOGO} pontos`}
            </span>
          </h2>
          <p className="discreto">{missao.jogoComo}</p>

          <Suspense fallback={<Carregando texto="Preparando o jogo…" />}>
            <Jogo aoConcluir={aoConcluirJogo} jaFeito={jogoFeito} />
          </Suspense>

          <button type="button" className="botao botao--secundario" onClick={() => setEtapa('quiz')}>
            Ir para o quiz →
          </button>
        </section>
      )}

      {etapa === 'quiz' && (
        <section aria-labelledby="t-quiz" className="pilha">
          <h2 id="t-quiz">Quiz</h2>
          <Quiz missao={missao.id} />
        </section>
      )}

      {completa && (
        <section className="cartao pilha centro" aria-live="polite">
          <p>
            <strong>Missão concluída.</strong>
          </p>
          {proxima ? (
            <Link className="botao botao--primario" to={`/missao/${proxima.id}`} onClick={() => setEtapa('aprender')}>
              Começar a {proxima.ordem}: {proxima.nome} →
            </Link>
          ) : (
            <Link className="botao botao--primario" to="/certificado">
              Ver meu certificado →
            </Link>
          )}
        </section>
      )}
    </div>
  )
}
