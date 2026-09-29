/* ==========================================================================
   PartidaCronometrada.tsx — a moldura de tempo em volta de cada mini-game.

   Antes do jogo, uma tela que DIZ que ele é cronometrado e como o tempo vira
   ponto. Não é formalidade: pontuar velocidade sem avisar é armadilha, e
   quem lê devagar ou usa leitor de tela merece saber a regra antes de
   começar, não descobri-la no placar. O relógio só corre depois do toque em
   "Começar" — ler as instruções não conta.

   O TEMPO QUE VALE PONTO É O DO SERVIDOR. O toque em "Começar" chama
   `iniciarJogo`, que grava a hora no banco; a conclusão faz o banco calcular
   a diferença com o relógio dele. O cronômetro na tela é só para a pessoa
   acompanhar — e por isso é aproximado de propósito, sem décimos.

   Quem já concluiu o jogo joga de novo sem relógio nenhum: os pontos valem
   uma vez só, e cronometrar uma partida que não conta seria pressão à toa.
   ========================================================================== */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { iniciarJogo } from '../nucleo/api'
import { ErroApi, type IdMissao } from '../nucleo/tipos'
import { PTS_JOGO, PTS_TEMPO, type TipoJogo } from '../conteudo/missoes'
import { Erro } from './comuns'

interface Props {
  missao: IdMissao
  jogo: TipoJogo
  jaFeito: boolean
  /** O jogo em si. Recebe `aoTerminar` para parar o relógio da tela. */
  children: (aoTerminar: () => void) => ReactNode
}

export default function PartidaCronometrada({ missao, jogo, jaFeito, children }: Props) {
  const [fase, setFase] = useState<'antes' | 'iniciando' | 'jogando' | 'fim'>(jaFeito ? 'jogando' : 'antes')
  const [erro, setErro] = useState<string | null>(null)
  const [segundos, setSegundos] = useState(0)
  const inicio = useRef(0)

  useEffect(() => {
    if (fase !== 'jogando' || jaFeito) return
    const t = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicio.current) / 1000)), 1000)
    return () => window.clearInterval(t)
  }, [fase, jaFeito])

  async function comecar() {
    setErro(null)
    setFase('iniciando')
    try {
      await iniciarJogo(missao, jogo)
      inicio.current = Date.now()
      setSegundos(0)
      setFase('jogando')
    } catch (e) {
      setFase('antes')
      setErro(e instanceof ErroApi ? e.message : 'Não conseguimos iniciar o cronômetro. Tente de novo.')
    }
  }

  if (fase === 'antes' || fase === 'iniciando') {
    return (
      <div className="painel pilha partida">
        <p className="partida__titulo">⏱ Este jogo é cronometrado</p>
        <p className="prosa">
          Concluir vale <strong>{PTS_JOGO} pontos</strong>. Terminar rápido e acertando vale até{' '}
          <strong>+{PTS_TEMPO}</strong> — quanto menos tempo e mais acertos, maior o bônus. O relógio só
          começa quando você tocar no botão.
        </p>
        {erro && <Erro>{erro}</Erro>}
        <div className="acoes">
          <button
            type="button"
            className="botao botao--primario"
            onClick={() => void comecar()}
            disabled={fase === 'iniciando'}
          >
            {fase === 'iniciando' ? 'Preparando…' : 'Começar ⏱'}
          </button>
        </div>
      </div>
    )
  }

  const mm = String(Math.floor(segundos / 60))
  const ss = String(segundos % 60).padStart(2, '0')

  return (
    <div className="pilha">
      {!jaFeito && (
        /* `role="timer"` sem `aria-live`: anunciar o segundo a cada segundo
           tornaria o jogo impossível com leitor de tela. Quem quiser saber o
           tempo navega até ele. */
        <div className="partida__relogio" role="timer" aria-label={`Tempo: ${mm} minutos e ${ss} segundos`}>
          <span aria-hidden="true">⏱</span>
          <b>
            {mm}:{ss}
          </b>
          {fase === 'fim' && <span className="meta">concluído</span>}
        </div>
      )}
      {children(() => setFase('fim'))}
    </div>
  )
}
