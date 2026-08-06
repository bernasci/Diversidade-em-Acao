/* ==========================================================================
   Certificado.tsx â€” o fecho da jornada.

   Desenhado em <canvas> e baixado como PNG. Sem Supabase Storage, sem
   biblioteca de PDF, sem cota consumida: o arquivo nasce e morre no
   navegador da pessoa.

   O canvas Ã© `aria-hidden`. Um leitor de tela nÃ£o lÃª pixel â€” entÃ£o o mesmo
   conteÃºdo aparece logo abaixo em texto real, e Ã© ele que o leitor anuncia.
   NÃ£o Ã© uma "versÃ£o alternativa": Ã© a mesma informaÃ§Ã£o, na forma que cada
   pessoa consegue receber.
   ========================================================================== */

import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useEstado } from '../nucleo/estado'
import { MISSOES, PERGUNTAS_POR_MISSAO, PTS_MAX } from '../conteudo/missoes'
import {
  acertosTotais,
  medalhaDe,
  MEDALHAS,
  missoesCompletas,
  tudoCompleto,
} from '../nucleo/progresso'

const L = 1600
const A = 1100

export default function Certificado() {
  const { jogador, progresso } = useEstado()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const completo = tudoCompleto(progresso)
  const medalha = medalhaDe(progresso)
  const acertos = acertosTotais(progresso)
  const totalPerguntas = MISSOES.length * PERGUNTAS_POR_MISSAO
  const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const desenhar = useCallback(() => {
    const cv = canvasRef.current
    if (!cv || !jogador || !completo) return
    const c = cv.getContext('2d')
    if (!c) return

    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, L, A)

    // faixa navy no topo + moldura ciano
    c.fillStyle = '#001E62'
    c.fillRect(0, 0, L, 150)
    c.strokeStyle = '#00BBDC'
    c.lineWidth = 8
    c.strokeRect(30, 30, L - 60, A - 60)

    c.fillStyle = '#ffffff'
    c.font = 'bold 44px Sora, sans-serif'
    c.textAlign = 'center'
    c.fillText('DIVERSIDADE EM AÃ‡ÃƒO', L / 2, 95)

    c.fillStyle = '#5a6785'
    c.font = '28px Inter, sans-serif'
    c.fillText('Certificado de conclusÃ£o', L / 2, 250)

    c.fillStyle = '#141f3c'
    c.font = '26px Inter, sans-serif'
    c.fillText('Certificamos que', L / 2, 330)

    c.fillStyle = '#001E62'
    c.font = 'bold 62px Sora, sans-serif'
    c.fillText(jogador.nome || jogador.apelido, L / 2, 415)

    c.fillStyle = '#141f3c'
    c.font = '26px Inter, sans-serif'
    quebrarLinhas(
      c,
      `concluiu as ${MISSOES.length} missÃµes da jornada sobre inclusÃ£o de Pessoas com DeficiÃªncia no mundo do trabalho, acertando ${acertos} das ${totalPerguntas} perguntas e somando ${jogador.pts} de ${PTS_MAX} pontos.`,
      L / 2,
      480,
      L - 320,
      42,
    )

    if (medalha) {
      c.fillStyle = '#001E62'
      c.font = 'bold 34px Sora, sans-serif'
      c.fillText(`Medalha de ${MEDALHAS[medalha].nome}`, L / 2, 690)
    }

    // temas cobertos
    c.fillStyle = '#3d4a68'
    c.font = '20px Inter, sans-serif'
    MISSOES.forEach((m, i) => {
      c.fillText(`${m.ordem} Â· ${m.tema}`, L / 2, 760 + i * 34)
    })

    c.strokeStyle = '#dfe6f0'
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(L / 2 - 260, A - 130)
    c.lineTo(L / 2 + 260, A - 130)
    c.stroke()

    c.fillStyle = '#5a6785'
    c.font = '22px Inter, sans-serif'
    c.fillText(data, L / 2, A - 90)
  }, [jogador, completo, medalha, acertos, totalPerguntas, data])

  useEffect(() => {
    desenhar()
  }, [desenhar])

  function baixar() {
    const cv = canvasRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.download = `certificado-diversidade-em-acao-${(jogador?.apelido ?? 'participante')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}.png`
    a.href = cv.toDataURL('image/png')
    a.click()
  }

  if (!jogador) return null

  if (!completo) {
    const faltam = MISSOES.length - missoesCompletas(progresso)
    return (
      <div className="pilha-g">
        <h1>Certificado</h1>
        <div className="painel pilha">
          <p>
            <strong>Ainda nÃ£o.</strong> Faltam <strong>{faltam}</strong>{' '}
            {faltam === 1 ? 'missÃ£o' : 'missÃµes'} para o certificado ficar disponÃ­vel â€” cada missÃ£o exige
            o jogo e as {PERGUNTAS_POR_MISSAO} perguntas.
          </p>
          <p>
            <Link className="botao botao--primario" to="/">
              Ver o que falta â†’
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pilha-g">
      <h1>Certificado</h1>

      <div className="painel pilha">
        <canvas
          ref={canvasRef}
          width={L}
          height={A}
          aria-hidden="true"
          style={{ width: '100%', height: 'auto', border: '1px solid var(--linha)', borderRadius: 'var(--raio-s)' }}
        />

        <button type="button" className="botao botao--primario" onClick={baixar}>
          Baixar certificado (PNG)
        </button>
      </div>

      {/* A mesma informaÃ§Ã£o do canvas, em texto â€” para leitor de tela, para
          copiar e colar, e para quem sÃ³ quer conferir os nÃºmeros. */}
      <section className="painel pilha" aria-labelledby="t-texto">
        <h2 id="t-texto" style={{ fontSize: '1.125rem' }}>
          ConteÃºdo do certificado
        </h2>
        <p>
          Certificamos que <strong>{jogador.nome || jogador.apelido}</strong> concluiu as {MISSOES.length}{' '}
          missÃµes da jornada <strong>Diversidade em AÃ§Ã£o</strong>, sobre inclusÃ£o de Pessoas com
          DeficiÃªncia no mundo do trabalho, acertando <strong>{acertos}</strong> das {totalPerguntas}{' '}
          perguntas e somando <strong>{jogador.pts}</strong> de {PTS_MAX} pontos.
          {medalha && <> Medalha de <strong>{MEDALHAS[medalha].nome}</strong>.</>} Emitido em {data}.
        </p>
        <ul>
          {MISSOES.map((m) => (
            <li key={m.id}>
              {m.ordem} Â· {m.tema}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** Quebra de linha centrada. O `fillText` do canvas nÃ£o quebra sozinho â€” sem
    isto, a frase do meio sai reta para fora da folha. */
function quebrarLinhas(
  c: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  largura: number,
  alturaLinha: number,
) {
  const palavras = texto.split(' ')
  let linha = ''
  let yAtual = y
  for (const p of palavras) {
    const teste = linha ? `${linha} ${p}` : p
    if (c.measureText(teste).width > largura && linha) {
      c.fillText(linha, x, yAtual)
      linha = p
      yAtual += alturaLinha
    } else {
      linha = teste
    }
  }
  if (linha) c.fillText(linha, x, yAtual)
}

