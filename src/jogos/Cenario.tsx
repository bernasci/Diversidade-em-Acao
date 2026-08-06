/* ==========================================================================
   M5 · Simulação de cenário — quatro decisões de trabalho, três caminhos cada.

   Nenhuma opção errada é caricata. As alternativas ruins aqui são as que a
   gente vê acontecer com a melhor das intenções — poupar a pessoa da viagem,
   suavizar o feedback, adiar a promoção "para ela se preparar". Opção errada
   óbvia não ensina nada: todo mundo acerta e ninguém se reconhece.

   Por isso também não existe "reprovado": escolheu, lê o desdobramento e
   segue. O aprendizado está no desdobramento, não no placar.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react'
import { CENAS } from '../conteudo/jogos'
import { agora, type PropsJogo } from './contrato'

export default function Cenario({ aoConcluir, jaFeito }: PropsJogo) {
  const [i, setI] = useState(0)
  const [escolha, setEscolha] = useState<number | null>(null)
  const [boas, setBoas] = useState(0)
  const inicio = useRef(agora())
  const concluiu = useRef(false)
  const [fim, setFim] = useState(false)

  const cena = CENAS[i]

  function escolher(indice: number) {
    if (escolha !== null) return
    setEscolha(indice)
    if (cena.opcoes[indice].nota === 'boa') setBoas((b) => b + 1)
  }

  function seguir() {
    setEscolha(null)
    if (i + 1 >= CENAS.length) setFim(true)
    else setI((x) => x + 1)
  }

  useEffect(() => {
    if (!fim || concluiu.current) return
    concluiu.current = true
    aoConcluir({ acertos: boas, total: CENAS.length, segundos: agora() - inicio.current })
  }, [fim, boas, aoConcluir])

  if (fim) {
    return (
      <div className="jogo">
        <div className="jogo__fim">
          <p className="jogo__fim__nota">
            {boas}/{CENAS.length}
          </p>
          <p>
            <strong>Simulação concluída.</strong>{' '}
            {boas === CENAS.length
              ? 'Em todas as situações você escolheu o caminho que trata a pessoa como profissional.'
              : 'As escolhas que não eram as melhores costumam vir da melhor das intenções — é o que as torna difíceis de perceber no dia a dia.'}
          </p>
          {jaFeito && <p className="discreto">Você já tinha concluído este jogo — os pontos valem uma vez só.</p>}
        </div>
      </div>
    )
  }

  const opcao = escolha !== null ? cena.opcoes[escolha] : null

  return (
    <div className="jogo">
      <div className="jogo__instrucao">
        <strong>Como jogar:</strong> quatro situações reais de trabalho. Escolha o que você faria e leia o
        que acontece depois. Não existe reprovação — existe consequência.
      </div>

      <div className="jogo__topo">
        <span>
          Situação {i + 1} de {CENAS.length}: {cena.titulo}
        </span>
      </div>

      <div className="cenario">
        <p className="cenario__situacao">{cena.situacao}</p>

        {!opcao ? (
          <fieldset className="cenario__opcoes">
            <legend className="so-leitor">O que você faz?</legend>
            {cena.opcoes.map((o, k) => (
              <button key={k} type="button" className="cenario__opcao" onClick={() => escolher(k)}>
                {o.texto}
              </button>
            ))}
          </fieldset>
        ) : (
          <>
            <div className="cenario__desdobramento" role="status" aria-live="polite">
              <span className="cenario__nota">
                <span aria-hidden="true">
                  {opcao.nota === 'boa' ? '✓' : opcao.nota === 'mediana' ? '≈' : '✗'}
                </span>
                {opcao.nota === 'boa'
                  ? 'Melhor caminho'
                  : opcao.nota === 'mediana'
                    ? 'Resolve pela metade'
                    : 'Custa caro'}
              </span>
              <p>{opcao.desdobramento}</p>
            </div>
            <button type="button" className="botao botao--primario" onClick={seguir} autoFocus>
              {i + 1 >= CENAS.length ? 'Ver resultado' : 'Próxima situação'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
