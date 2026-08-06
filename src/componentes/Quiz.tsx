/* ==========================================================================
   Quiz.tsx — as cinco perguntas da missão.

   Uma pergunta por vez, e cada resposta vai ao servidor. O cliente não sabe
   qual alternativa é a certa antes de perguntar — o gabarito está em
   `quiz_gabarito`, tabela sem policy, lida só pela Edge Function `jogar`.
   Abrir o DevTools nesta tela não adianta nada, e é isso que faz a Platina
   significar alguma coisa.

   Cada resposta grava uma linha em `progresso`. Errar também grava (com 0
   ponto) — é o que permite retomar a missão de onde parou sem responder duas
   vezes a mesma pergunta, e é o que impede tentar de novo até acertar.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { responderQuiz } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import { PERGUNTAS_POR_MISSAO } from '../conteudo/missoes'
import { QUIZZES } from '../conteudo/quizzes'
import { acertos as contarAcertos, respondeu, respondidas } from '../nucleo/progresso'
import { ErroApi, type IdMissao } from '../nucleo/tipos'
import { useAvisos } from './avisos'
import { Erro } from './comuns'

const LETRAS = ['A', 'B', 'C', 'D']

export default function Quiz({ missao }: { missao: IdMissao }) {
  const { progresso, registrar } = useEstado()
  const { avisar } = useAvisos()
  const perguntas = QUIZZES[missao]

  /* Índices que ainda faltam. Congelado na montagem: se recalculássemos a
     cada `registrar`, a lista encolheria embaixo da pessoa e a pergunta
     atual pularia sozinha. */
  const [pendentes] = useState(() =>
    perguntas.map((_, i) => i).filter((i) => !respondeu(progresso, missao, i)),
  )

  const [passo, setPasso] = useState(0)
  const [escolha, setEscolha] = useState<number | null>(null)
  const [veredito, setVeredito] = useState<{ certo: boolean; resposta: number; explicacao: string } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const feitasAntes = useMemo(() => respondidas(progresso, missao), [progresso, missao])
  const indice = pendentes[passo]
  const terminou = passo >= pendentes.length

  async function responder(op: number) {
    if (enviando || veredito) return
    setEscolha(op)
    setEnviando(true)
    setErro(null)
    try {
      const r = await responderQuiz(missao, indice, op)
      setVeredito({ certo: r.certo, resposta: r.resposta, explicacao: r.explicacao })
      registrar(missao, `quiz-${indice}`, r.pontos, r.total)
      if (r.certo && r.pontos > 0) avisar(`+${r.pontos} pontos`, 'ok')
    } catch (e) {
      setEscolha(null)
      setErro(e instanceof ErroApi ? e.message : 'Não conseguimos registrar sua resposta. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  function proxima() {
    setVeredito(null)
    setEscolha(null)
    setPasso((p) => p + 1)
  }

  if (pendentes.length === 0) {
    return (
      <div className="cartao pilha">
        <p>
          <strong>Quiz concluído.</strong> Você acertou {contarAcertos(progresso, missao)} de{' '}
          {PERGUNTAS_POR_MISSAO} perguntas.
        </p>
        <p className="discreto">Cada pergunta é respondida uma única vez — por isso ela não reabre.</p>
      </div>
    )
  }

  if (terminou) {
    return (
      <div className="jogo__fim">
        <p className="jogo__fim__nota">
          {contarAcertos(progresso, missao)}/{PERGUNTAS_POR_MISSAO}
        </p>
        <p>
          <strong>Quiz da missão concluído.</strong>
        </p>
      </div>
    )
  }

  const p = perguntas[indice]
  const numero = feitasAntes + passo + 1

  return (
    <div className="pilha">
      <div className="quiz__passos" role="group" aria-label={`Pergunta ${numero} de ${PERGUNTAS_POR_MISSAO}`}>
        {perguntas.map((_, i) => (
          <span
            key={i}
            className={`quiz__passo${i < numero - 1 ? ' quiz__passo--feito' : i === numero - 1 ? ' quiz__passo--atual' : ''}`}
          />
        ))}
      </div>

      <p className="discreto centro">
        Pergunta {numero} de {PERGUNTAS_POR_MISSAO}
      </p>

      <fieldset className="quiz__opcoes">
        <legend className="quiz__pergunta">{p.q}</legend>

        {p.o.map((texto, i) => {
          const eCerta = veredito && i === veredito.resposta
          const eMinhaErrada = veredito && i === escolha && !veredito.certo
          const classe = `quiz__opcao${eCerta ? ' quiz__opcao--certa' : eMinhaErrada ? ' quiz__opcao--errada' : ''}`
          return (
            <button
              key={i}
              type="button"
              className={classe}
              disabled={enviando || Boolean(veredito)}
              onClick={() => responder(i)}
            >
              <span className="quiz__opcao__letra" aria-hidden="true">
                {LETRAS[i]}
              </span>
              <span>
                {texto}
                {eCerta && <span className="so-leitor"> — resposta correta</span>}
                {eMinhaErrada && <span className="so-leitor"> — sua resposta, incorreta</span>}
              </span>
            </button>
          )
        })}
      </fieldset>

      {erro && <Erro>{erro}</Erro>}

      {veredito && (
        <>
          <div className="quiz__explicacao" role="status" aria-live="polite">
            <p>
              <strong>{veredito.certo ? '✓ Você acertou.' : '✗ A resposta certa é a ' + LETRAS[veredito.resposta] + '.'}</strong>{' '}
              {veredito.explicacao}
            </p>
          </div>
          <button type="button" className="botao botao--primario" onClick={proxima} autoFocus>
            {passo + 1 >= pendentes.length ? 'Concluir o quiz' : 'Próxima pergunta'}
          </button>
        </>
      )}
    </div>
  )
}
