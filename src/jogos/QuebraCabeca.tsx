/* ==========================================================================
   M3 · Quebra-cabeça — montar a jornada de um posto de trabalho acessível.

   Nove peças embaralhadas; a operação é trocar duas de lugar. Não é
   arrastar-pixel de propósito: a versão clássica do quebra-cabeça, com
   encaixe por coordenada, é impossível com teclado e péssima no toque. Aqui,
   selecionar duas peças e trocar funciona igual no mouse, no dedo e no Tab.

   A "imagem" é textual — cada peça é uma etapa da jornada, do chegar ao
   prédio até crescer na empresa. Quem monta lê o conteúdo enquanto joga, que
   é o motivo de o jogo existir.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from 'react'
import { PECAS_QUEBRA } from '../conteudo/jogos'
import { agora, embaralhar, type PropsJogo } from './contrato'

const TOTAL = PECAS_QUEBRA.length

function embaralharDeVerdade(): number[] {
  const ids = PECAS_QUEBRA.map((p) => p.id)
  // Nas raras vezes em que o embaralhamento devolve a ordem certa, o jogo
  // nasceria resolvido. Repete até sobrar pelo menos uma peça fora do lugar.
  for (let tentativa = 0; tentativa < 20; tentativa++) {
    const m = embaralhar(ids)
    if (m.some((id, i) => id !== i)) return m
  }
  return [...ids].reverse()
}

export default function QuebraCabeca({ aoConcluir, jaFeito }: PropsJogo) {
  const inicial = useMemo(embaralharDeVerdade, [])
  const [ordem, setOrdem] = useState<number[]>(inicial)
  const [selecionado, setSelecionado] = useState<number | null>(null)
  const [trocas, setTrocas] = useState(0)
  const [anuncio, setAnuncio] = useState('')
  const inicio = useRef(agora())
  const concluiu = useRef(false)

  const noLugar = ordem.filter((id, i) => id === i).length
  const completo = noLugar === TOTAL

  function tocar(pos: number) {
    if (completo) return

    if (selecionado === null) {
      setSelecionado(pos)
      setAnuncio(`Peça "${PECAS_QUEBRA[ordem[pos]].texto}" selecionada. Escolha outra para trocar de lugar.`)
      return
    }
    if (selecionado === pos) {
      setSelecionado(null)
      setAnuncio('Seleção cancelada.')
      return
    }

    const nova = [...ordem]
    ;[nova[selecionado], nova[pos]] = [nova[pos], nova[selecionado]]
    setOrdem(nova)
    setTrocas((t) => t + 1)
    setSelecionado(null)

    const acertosAgora = nova.filter((id, i) => id === i).length
    setAnuncio(`Peças trocadas. ${acertosAgora} de ${TOTAL} no lugar certo.`)
  }

  useEffect(() => {
    if (!completo || concluiu.current) return
    concluiu.current = true
    aoConcluir({ acertos: TOTAL, total: TOTAL, segundos: agora() - inicio.current })
  }, [completo, aoConcluir])

  return (
    <div className="jogo">
      <div className="jogo__instrucao">
        <strong>Como jogar:</strong> as nove peças contam a jornada de acessibilidade na ordem em que ela
        acontece — da chegada ao prédio até o crescimento na empresa. Coloque-as na ordem certa.
        <ul>
          <li>Ative uma peça e depois outra para trocá-las de lugar.</li>
          <li>Peça no lugar certo fica marcada com "no lugar".</li>
        </ul>
      </div>

      <div className="jogo__topo">
        <span>
          No lugar: {noLugar}/{TOTAL}
        </span>
        <span className="jogo__placar">Trocas: {trocas}</span>
      </div>

      <div className="quebra">
        <div className="quebra__grade" role="group" aria-label="Tabuleiro do quebra-cabeça">
          {ordem.map((id, pos) => {
            const p = PECAS_QUEBRA[id]
            const certa = id === pos
            return (
              <button
                key={pos}
                type="button"
                className="quebra__peca"
                aria-pressed={selecionado === pos}
                data-certa={certa ? 'sim' : undefined}
                onClick={() => tocar(pos)}
                aria-label={`Posição ${pos + 1} de ${TOTAL}: ${p.texto}. ${certa ? 'No lugar certo.' : 'Fora do lugar.'}`}
              >
                <span aria-hidden="true">{p.ico}</span>
                <span aria-hidden="true">{p.texto}</span>
                {certa && (
                  <span className="so-leitor" aria-hidden="true">
                    no lugar
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="quebra__legenda">
          <strong>A ordem certa é a da jornada real:</strong>
          <ol style={{ margin: 0, paddingLeft: '1.125rem' }}>
            <li>Chegar ao prédio</li>
            <li>Entrar</li>
            <li>Circular por dentro</li>
            <li>Usar o banheiro</li>
            <li>Sentar para trabalhar</li>
            <li>Usar os sistemas</li>
            <li>Comunicar-se</li>
            <li>Sair em segurança</li>
            <li>Crescer na empresa</li>
          </ol>
          <p className="discreto" style={{ margin: 0 }}>
            Repare que a acessibilidade não termina na rampa: ela vai até a promoção.
          </p>
        </div>
      </div>

      <p aria-live="polite" className="so-leitor">
        {anuncio}
      </p>

      {completo && (
        <div className="jogo__fim">
          <p className="jogo__fim__nota">{trocas}</p>
          <p>
            <strong>Jornada montada</strong> em {trocas} trocas.
          </p>
          {jaFeito && <p className="discreto">Você já tinha concluído este jogo — os pontos valem uma vez só.</p>}
        </div>
      )}
    </div>
  )
}
