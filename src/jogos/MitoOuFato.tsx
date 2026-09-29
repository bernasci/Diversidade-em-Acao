/* ==========================================================================
   M4 · Mito ou Fato — oito afirmações que circulam no corredor da empresa.

   SEM CRONÔMETRO PRÓPRIO. Este jogo já teve um opcional, de 15 segundos por
   carta, escolhido antes de começar — com a promessa de que as duas formas
   valiam os mesmos pontos. A promessa deixou de ser verdade quando todos os
   mini-games passaram a pontuar a rapidez (decisão do time, ver
   `PartidaCronometrada`), e manter a escolha seria mentir na tela.

   O relógio agora é o de fora, igual para os três jogos e medido pelo
   servidor. Ele nunca interrompe a partida — não há tempo esgotado nem carta
   perdida —, só pesa no bônus. É o que mantém o jogo dentro do WCAG 2.2.1:
   quem lê devagar termina, só leva menos bônus.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from 'react'
import { CARTAS_MITO } from '../conteudo/jogos'
import { agora, embaralhar, type PropsJogo } from './contrato'
import { Nota } from '../componentes/comuns'

export default function MitoOuFato({ aoConcluir, jaFeito }: PropsJogo) {
  const cartas = useMemo(() => embaralhar(CARTAS_MITO), [])
  const [fase, setFase] = useState<'jogando' | 'fim'>('jogando')
  const [i, setI] = useState(0)
  const [acertos, setAcertos] = useState(0)
  const [resposta, setResposta] = useState<{ certo: boolean; texto: string } | null>(null)
  const inicio = useRef(agora())
  const concluiu = useRef(false)

  const carta = cartas[i]

  function responder(escolhaFato: boolean) {
    if (resposta || !carta) return
    const certo = escolhaFato === carta.fato
    if (certo) setAcertos((a) => a + 1)
    setResposta({ certo, texto: carta.explicacao })
  }

  function proxima() {
    setResposta(null)
    if (i + 1 >= cartas.length) setFase('fim')
    else setI((x) => x + 1)
  }

  useEffect(() => {
    if (fase !== 'fim' || concluiu.current) return
    concluiu.current = true
    aoConcluir({ acertos, total: cartas.length, segundos: agora() - inicio.current })
  }, [fase, acertos, cartas.length, aoConcluir])

  /* -------------------------------- FIM -------------------------------- */
  if (fase === 'fim') {
    return (
      <div className="jogo">
        <div className="jogo__fim">
          <p className="jogo__fim__nota">
            {acertos}/{cartas.length}
          </p>
          <p>
            <strong>Rodada concluída.</strong>{' '}
            {acertos === cartas.length
              ? 'Você identificou todos os mitos.'
              : 'Os mitos que passaram são justamente os que mais circulam por aí.'}
          </p>
          {jaFeito && <p className="meta">Você já tinha concluído este jogo — os pontos valem uma vez só.</p>}
        </div>
      </div>
    )
  }

  /* ------------------------------ JOGANDO ------------------------------ */
  return (
    <div className="jogo">
      <div className="jogo__barra">
        <span>
          Carta <b>{i + 1}</b>/{cartas.length}
        </span>
        <span>
          Acertos <b>{acertos}</b>
        </span>
      </div>

      <div className="mito">
        <p className="mito__carta">{carta.texto}</p>

        {!resposta ? (
          <div className="mito__botoes">
            <button type="button" className="mito__botao mito__botao--mito" onClick={() => responder(false)}>
              É MITO
            </button>
            <button type="button" className="mito__botao mito__botao--fato" onClick={() => responder(true)}>
              É FATO
            </button>
          </div>
        ) : (
          <>
            <Nota tipo={resposta.certo ? 'ok' : 'erro'} vivo>
              <b>{resposta.certo ? 'Você acertou.' : 'Não é isso.'}</b>
              {resposta.texto}
            </Nota>
            <button
              type="button"
              className="botao botao--primario botao--largo"
              onClick={proxima}
              autoFocus
            >
              {i + 1 >= cartas.length ? 'Ver resultado' : 'Próxima carta'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
