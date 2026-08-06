/* ==========================================================================
   M4 · Mito ou Fato — oito afirmações que circulam no corredor da empresa.

   O cronômetro é ESCOLHIDO antes de começar, na mesma tela e com o mesmo peso
   visual das duas opções. Não é uma configuração escondida: limite de tempo
   obrigatório reprova em WCAG 2.2.1, e num jogo sobre inclusão de PcD isso
   seria irônico demais para passar. Quem quer a adrenalina liga; quem lê
   devagar, usa leitor de tela ou tem deficiência motora joga sem relógio — e
   ganha exatamente os mesmos 10 pontos.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from 'react'
import { CARTAS_MITO } from '../conteudo/jogos'
import { agora, embaralhar, type PropsJogo } from './contrato'

const SEGUNDOS_POR_CARTA = 15

export default function MitoOuFato({ aoConcluir, jaFeito }: PropsJogo) {
  const cartas = useMemo(() => embaralhar(CARTAS_MITO), [])
  const [fase, setFase] = useState<'escolha' | 'jogando' | 'fim'>('escolha')
  const [comTempo, setComTempo] = useState(false)
  const [i, setI] = useState(0)
  const [acertos, setAcertos] = useState(0)
  const [resposta, setResposta] = useState<{ certo: boolean; texto: string } | null>(null)
  const [restam, setRestam] = useState(SEGUNDOS_POR_CARTA)
  const inicio = useRef(agora())
  const concluiu = useRef(false)

  const carta = cartas[i]

  function responder(escolhaFato: boolean | null) {
    if (resposta || !carta) return
    const certo = escolhaFato !== null && escolhaFato === carta.fato
    if (certo) setAcertos((a) => a + 1)
    setResposta({
      certo,
      texto:
        escolhaFato === null
          ? `Tempo esgotado. ${carta.explicacao}`
          : carta.explicacao,
    })
  }

  function proxima() {
    setResposta(null)
    setRestam(SEGUNDOS_POR_CARTA)
    if (i + 1 >= cartas.length) setFase('fim')
    else setI((x) => x + 1)
  }

  /* Cronômetro. Só existe quando a pessoa pediu por ele; para na hora em que
     a resposta aparece, para não correr por cima da explicação. */
  useEffect(() => {
    if (fase !== 'jogando' || !comTempo || resposta) return
    if (restam <= 0) {
      responder(null)
      return
    }
    const t = window.setTimeout(() => setRestam((r) => r - 1), 1000)
    return () => window.clearTimeout(t)
  })

  useEffect(() => {
    if (fase !== 'fim' || concluiu.current) return
    concluiu.current = true
    aoConcluir({ acertos, total: cartas.length, segundos: agora() - inicio.current })
  }, [fase, acertos, cartas.length, aoConcluir])

  /* ------------------------------ ESCOLHA ------------------------------ */
  if (fase === 'escolha') {
    return (
      <div className="jogo">
        <div className="jogo__instrucao">
          <strong>Como jogar:</strong> oito afirmações sobre deficiência no trabalho. Para cada uma, decida
          se é <strong>mito</strong> ou <strong>fato</strong>. Depois de responder, você lê o porquê.
        </div>

        <fieldset className="cartao pilha" style={{ border: '1px solid var(--linha)' }}>
          <legend style={{ fontWeight: 700, padding: '0 .5rem' }}>Como você prefere jogar?</legend>
          <p className="discreto" style={{ margin: 0 }}>
            As duas formas valem os mesmos pontos. Escolha a que for melhor para você.
          </p>
          <button
            type="button"
            className="botao botao--primario botao--largo"
            onClick={() => {
              setComTempo(false)
              inicio.current = agora()
              setFase('jogando')
            }}
          >
            Sem cronômetro — leio no meu tempo
          </button>
          <button
            type="button"
            className="botao botao--secundario botao--largo"
            onClick={() => {
              setComTempo(true)
              setRestam(SEGUNDOS_POR_CARTA)
              inicio.current = agora()
              setFase('jogando')
            }}
          >
            Com cronômetro — {SEGUNDOS_POR_CARTA} segundos por carta
          </button>
        </fieldset>
      </div>
    )
  }

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
          {jaFeito && <p className="discreto">Você já tinha concluído este jogo — os pontos valem uma vez só.</p>}
        </div>
      </div>
    )
  }

  /* ------------------------------ JOGANDO ------------------------------ */
  return (
    <div className="jogo">
      <div className="jogo__topo">
        <span>
          Carta {i + 1} de {cartas.length}
        </span>
        <span className="jogo__placar">Acertos: {acertos}</span>
      </div>

      <div className="mito">
        {comTempo && !resposta && (
          <div className="mito__cronometro">
            <div
              className="progresso"
              role="timer"
              aria-label={`Tempo restante: ${restam} segundos`}
            >
              <div className="progresso__barra" style={{ width: `${(restam / SEGUNDOS_POR_CARTA) * 100}%` }} />
            </div>
            <p className="discreto centro" style={{ marginTop: '.25rem' }}>
              {restam}s
            </p>
          </div>
        )}

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
            <div className="mito__resposta" role="status" aria-live="polite">
              <p>
                <strong>{resposta.certo ? '✓ Você acertou.' : '✗ Não é isso.'}</strong>{' '}
                {resposta.texto}
              </p>
            </div>
            <button type="button" className="botao botao--primario" onClick={proxima} autoFocus>
              {i + 1 >= cartas.length ? 'Ver resultado' : 'Próxima carta'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
