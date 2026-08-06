/* ==========================================================================
   M1 · Jogo da memória — pares conceito ↔ definição.

   As cartas são <button>: foco, Enter e Espaço vêm de graça, e o leitor de
   tela já as anuncia como algo que se aperta. A face virada é TEXTO, não
   imagem, então quem joga de ouvido joga o mesmo jogo — e ainda aprende o
   conceito, que é o ponto.

   O `aria-live` anuncia o resultado de cada tentativa. Sem ele, quem não vê a
   tela vira duas cartas e não recebe notícia nenhuma.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from 'react'
import { PARES_MEMORIA } from '../conteudo/jogos'
import { agora, embaralhar, type PropsJogo } from './contrato'

interface Carta {
  chave: string
  tipo: 'conceito' | 'definicao'
  texto: string
}

const ESPERA_VIRAR = 900

export default function Memoria({ aoConcluir, jaFeito }: PropsJogo) {
  const cartas = useMemo<Carta[]>(
    () =>
      embaralhar(
        PARES_MEMORIA.flatMap((p) => [
          { chave: p.id, tipo: 'conceito' as const, texto: p.conceito },
          { chave: p.id, tipo: 'definicao' as const, texto: p.definicao },
        ]),
      ),
    [],
  )

  const [viradas, setViradas] = useState<number[]>([])
  const [achados, setAchados] = useState<string[]>([])
  const [tentativas, setTentativas] = useState(0)
  const [anuncio, setAnuncio] = useState('')
  const [travado, setTravado] = useState(false)
  const inicio = useRef(agora())
  const concluiu = useRef(false)

  function virar(i: number) {
    if (travado || viradas.includes(i) || achados.includes(cartas[i].chave)) return

    const novas = [...viradas, i]
    setViradas(novas)

    if (novas.length < 2) {
      setAnuncio(`${cartas[i].texto}. Escolha a segunda carta.`)
      return
    }

    const [a, b] = novas
    setTentativas((t) => t + 1)

    if (cartas[a].chave === cartas[b].chave) {
      setAchados((x) => [...x, cartas[a].chave])
      setViradas([])
      setAnuncio(`Par encontrado: ${cartas[a].texto} — ${cartas[b].texto}.`)
      return
    }

    setTravado(true)
    setAnuncio(`Não formam par: ${cartas[a].texto} e ${cartas[b].texto}. As cartas voltam a esconder.`)
    window.setTimeout(() => {
      setViradas([])
      setTravado(false)
    }, ESPERA_VIRAR)
  }

  const completo = achados.length === PARES_MEMORIA.length

  useEffect(() => {
    if (!completo || concluiu.current) return
    concluiu.current = true
    aoConcluir({
      acertos: PARES_MEMORIA.length,
      total: PARES_MEMORIA.length,
      segundos: agora() - inicio.current,
    })
  }, [completo, aoConcluir])

  return (
    <div className="jogo">
      <div className="jogo__instrucao">
        <strong>Como jogar:</strong> vire duas cartas por vez e encontre os {PARES_MEMORIA.length} pares.
        Cada par liga um conceito à sua definição.
        <br />
        <span className="discreto">
          No teclado: Tab para navegar entre as cartas, Enter ou Espaço para virar.
        </span>
      </div>

      <div className="jogo__topo">
        <span>
          Pares: {achados.length}/{PARES_MEMORIA.length}
        </span>
        <span className="jogo__placar">Tentativas: {tentativas}</span>
      </div>

      <div className="memoria">
        {cartas.map((c, i) => {
          const estaPar = achados.includes(c.chave)
          const estaVirada = viradas.includes(i)
          const face = estaPar ? 'par' : estaVirada ? 'virada' : 'oculta'
          const rotulo = estaPar
            ? `Par encontrado: ${c.texto}`
            : estaVirada
              ? c.texto
              : `Carta ${i + 1}, escondida. Ative para virar.`

          return (
            <button
              key={`${c.chave}-${c.tipo}`}
              type="button"
              className="memoria__carta"
              data-face={face}
              aria-label={rotulo}
              aria-disabled={estaPar}
              onClick={() => virar(i)}
            >
              <span className="memoria__texto">
                <span className="memoria__tipo" aria-hidden="true">
                  {c.tipo === 'conceito' ? 'conceito' : 'definição'}
                </span>
                {c.texto}
              </span>
            </button>
          )
        })}
      </div>

      <p aria-live="polite" className="so-leitor">
        {anuncio}
      </p>

      {completo && (
        <div className="jogo__fim">
          <p className="jogo__fim__nota">{tentativas}</p>
          <p>
            <strong>Todos os pares encontrados</strong> em {tentativas} tentativas.
          </p>
          {jaFeito && <p className="discreto">Você já tinha concluído este jogo — os pontos valem uma vez só.</p>}
        </div>
      )}
    </div>
  )
}
