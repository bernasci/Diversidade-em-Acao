/* ==========================================================================
   M2 · Ligar os pares — cada situação vai para o tipo de deficiência certo.

   O mecanismo REAL é "seleciono a ficha, depois seleciono a coluna". Arrastar
   é uma camada opcional por cima, que chama exatamente a mesma função. Isso
   não é preciosismo: drag-and-drop puro é operável só com ponteiro preciso —
   exclui teclado, leitor de tela, tremor e tela pequena de uma vez só. Num
   jogo sobre inclusão de PcD, seria difícil de justificar.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from 'react'
import { ALVOS_LIGAR, FICHAS_LIGAR } from '../conteudo/jogos'
import { agora, embaralhar, type PropsJogo } from './contrato'
import { Nota } from '../componentes/comuns'

export default function LigarPares({ aoConcluir, jaFeito }: PropsJogo) {
  const fichas = useMemo(() => embaralhar(FICHAS_LIGAR), [])
  const [colocadas, setColocadas] = useState<Record<string, string>>({})
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [erros, setErros] = useState(0)
  const [aviso, setAviso] = useState<{ certo: boolean; texto: string } | null>(null)
  const inicio = useRef(agora())
  const concluiu = useRef(false)

  const pendentes = fichas.filter((f) => !colocadas[f.id])
  const completo = pendentes.length === 0

  function soltar(idFicha: string | null, idAlvo: string) {
    if (!idFicha) return
    const ficha = FICHAS_LIGAR.find((f) => f.id === idFicha)
    if (!ficha) return

    setSelecionada(null)
    setArrastando(null)

    if (ficha.alvo === idAlvo) {
      setColocadas((c) => ({ ...c, [ficha.id]: idAlvo }))
      setAviso({ certo: true, texto: `Certo. ${ficha.porque}` })
      return
    }

    setErros((e) => e + 1)
    const certo = ALVOS_LIGAR.find((a) => a.id === ficha.alvo)
    setAviso({
      certo: false,
      texto: `Ainda não. Essa situação é de ${certo?.titulo ?? 'outro tipo'}. ${ficha.porque}`,
    })
  }

  useEffect(() => {
    if (!completo || concluiu.current) return
    concluiu.current = true
    aoConcluir({
      acertos: FICHAS_LIGAR.length,
      total: FICHAS_LIGAR.length,
      segundos: agora() - inicio.current,
    })
  }, [completo, aoConcluir])

  return (
    <div className="jogo">
      <div className="jogo__barra">
        <span>
          Classificadas <b>{FICHAS_LIGAR.length - pendentes.length}</b>/{FICHAS_LIGAR.length}
        </span>
        <span>
          Erros <b>{erros}</b>
        </span>
      </div>

      <details className="jogo__como">
        <summary>Como jogar</summary>
        Escolha uma situação e depois o tipo de deficiência a que ela se refere.
        <ul>
          <li>No toque ou no teclado: ative a situação, depois ative o destino.</li>
          <li>No mouse também dá para arrastar, se preferir.</li>
        </ul>
      </details>

      <div className="ligar">
        <div>
          <p className="ligar__titulo">
            {selecionada ? 'Agora escolha o destino abaixo' : 'Situações'}
          </p>
          <div>
            {pendentes.map((f) => (
              <button
                key={f.id}
                type="button"
                className="ficha"
                aria-pressed={selecionada === f.id}
                data-arrastando={arrastando === f.id ? 'sim' : undefined}
                draggable
                onDragStart={() => {
                  setArrastando(f.id)
                  setSelecionada(f.id)
                }}
                onDragEnd={() => setArrastando(null)}
                onClick={() => setSelecionada((s) => (s === f.id ? null : f.id))}
              >
                {f.texto}
              </button>
            ))}
            {pendentes.length === 0 && <p className="meta">Nenhuma situação restante.</p>}
          </div>
        </div>

        <div>
          <p className="ligar__titulo">Tipos de deficiência</p>
          <div className="alvos">
            {ALVOS_LIGAR.map((a) => {
              const dentro = FICHAS_LIGAR.filter((f) => colocadas[f.id] === a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  className="alvo"
                  data-ativo={selecionada || arrastando ? 'sim' : undefined}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    soltar(arrastando ?? selecionada, a.id)
                  }}
                  onClick={() => soltar(selecionada, a.id)}
                  aria-label={
                    selecionada
                      ? `Colocar a situação selecionada em ${a.titulo}`
                      : `${a.titulo}. ${dentro.length} situações classificadas aqui.`
                  }
                >
                  <span className="alvo__nome">{a.titulo}</span>
                  <span className="alvo__desc">{a.descricao}</span>
                  {dentro.map((f) => (
                    <span key={f.id} className="alvo__item">
                      <span aria-hidden="true">✓</span> {f.texto}
                    </span>
                  ))}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {aviso && (
        <Nota tipo={aviso.certo ? 'ok' : 'atencao'} vivo>
          {aviso.texto}
        </Nota>
      )}

      {completo && (
        <div className="jogo__fim">
          <p className="jogo__fim__nota">
            {FICHAS_LIGAR.length}/{FICHAS_LIGAR.length}
          </p>
          <p>
            <strong>Todas classificadas.</strong>{' '}
            {erros === 0 ? 'Sem nenhum erro no caminho.' : `Com ${erros} tentativa(s) errada(s).`}
          </p>
          {jaFeito && <p className="meta">Você já tinha concluído este jogo — os pontos valem uma vez só.</p>}
        </div>
      )}
    </div>
  )
}
