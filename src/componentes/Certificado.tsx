/* ==========================================================================
   Certificado.tsx — o certificado, agora como bloco e não como tela.

   Desenhado em <canvas> e baixado como PNG. Sem Supabase Storage, sem
   biblioteca de PDF, sem cota consumida: o arquivo nasce e morre no navegador
   da pessoa.

   O canvas é `aria-hidden`. Leitor de tela não lê pixel — então o mesmo
   conteúdo aparece logo abaixo em texto real, e é ele que o leitor anuncia.
   Não é uma "versão alternativa": é a mesma informação, na forma que cada
   pessoa consegue receber.

   E vale registrar o que este arquivo NÃO é: credencial. O PNG nasce no
   navegador e não fica guardado em lugar nenhum — qualquer um consegue forjar
   um. É lembrança. O registro de quem concluiu está no banco, e é de lá que o
   RH tira a lista para reconhecimento (ver `supabase/consultas.sql`).
   ========================================================================== */

import { useCallback, useEffect, useRef } from 'react'
import { useEstado } from '../nucleo/estado'
import { MISSOES, PERGUNTAS_POR_MISSAO, PTS_MAX } from '../conteudo/missoes'
import { acertosTotais, medalhaDe, MEDALHAS } from '../nucleo/progresso'

const L = 1600
const A = 1100

export default function Certificado() {
  const { jogador, progresso } = useEstado()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const medalha = medalhaDe(progresso)
  const acertos = acertosTotais(progresso)
  const totalPerguntas = MISSOES.length * PERGUNTAS_POR_MISSAO
  const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const desenhar = useCallback(() => {
    const cv = canvasRef.current
    if (!cv || !jogador) return
    const c = cv.getContext('2d')
    if (!c) return

    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, L, A)

    c.fillStyle = '#001E62'
    c.fillRect(0, 0, L, 150)
    c.strokeStyle = '#00BBDC'
    c.lineWidth = 8
    c.strokeRect(30, 30, L - 60, A - 60)

    c.fillStyle = '#ffffff'
    c.font = 'bold 44px Inter, sans-serif'
    c.textAlign = 'center'
    c.fillText('DIVERSIDADE EM AÇÃO', L / 2, 95)

    c.fillStyle = '#5a6785'
    c.font = '28px Inter, sans-serif'
    c.fillText('Certificado de conclusão', L / 2, 250)

    c.fillStyle = '#141f3c'
    c.font = '26px Inter, sans-serif'
    c.fillText('Certificamos que', L / 2, 330)

    c.fillStyle = '#001E62'
    c.font = 'bold 62px Inter, sans-serif'
    c.fillText(jogador.nome, L / 2, 415)

    c.fillStyle = '#141f3c'
    c.font = '26px Inter, sans-serif'
    quebrarLinhas(
      c,
      `concluiu as ${MISSOES.length} missões da jornada sobre inclusão de Pessoas com Deficiência no mundo do trabalho, acertando ${acertos} das ${totalPerguntas} perguntas e somando ${jogador.pts} de ${PTS_MAX} pontos.`,
      L / 2,
      480,
      L - 320,
      42,
    )

    if (medalha) {
      c.fillStyle = '#001E62'
      c.font = 'bold 34px Inter, sans-serif'
      c.fillText(`Medalha de ${MEDALHAS[medalha].nome}`, L / 2, 690)
    }

    c.fillStyle = '#3d4a68'
    c.font = '20px Inter, sans-serif'
    MISSOES.forEach((m, i) => {
      c.fillText(`${m.ordem} · ${m.nome} — ${m.tema}`, L / 2, 760 + i * 34)
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
  }, [jogador, medalha, acertos, totalPerguntas, data])

  useEffect(() => {
    desenhar()
  }, [desenhar])

  if (!jogador) return null

  function baixar() {
    const cv = canvasRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.download = `certificado-diversidade-em-acao-${(jogador?.nome ?? 'participante')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')}.png`
    a.href = cv.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="pilha">
      <canvas
        ref={canvasRef}
        width={L}
        height={A}
        aria-hidden="true"
        style={{
          width: '100%',
          height: 'auto',
          border: '1px solid var(--linha)',
          borderRadius: 'var(--r-sm)',
        }}
      />

      <div className="acoes">
        <button type="button" className="botao botao--primario" onClick={baixar}>
          Baixar certificado (PNG)
        </button>
      </div>

      <details className="jogo__como">
        <summary>Ler o conteúdo do certificado em texto</summary>
        <p>
          Certificamos que <strong>{jogador.nome}</strong> concluiu as {MISSOES.length} missões da
          jornada <strong>Diversidade em Ação</strong>, sobre inclusão de Pessoas com Deficiência no
          mundo do trabalho, acertando <strong>{acertos}</strong> das {totalPerguntas} perguntas e
          somando <strong>{jogador.pts}</strong> de {PTS_MAX} pontos.
          {medalha && (
            <>
              {' '}
              Medalha de <strong>{MEDALHAS[medalha].nome}</strong>.
            </>
          )}{' '}
          Emitido em {data}.
        </p>
      </details>
    </div>
  )
}

/** Quebra de linha centrada. O `fillText` do canvas não quebra sozinho — sem
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
