/* ==========================================================================
   recortar-logo.mjs — prepara um logotipo da DOME para uso em tela.

   Uso:
     node ferramentas/recortar-logo.mjs <origem.png> <destino.png> [largura]

   Exemplo (é assim que os arquivos de public/ foram gerados):
     node ferramentas/recortar-logo.mjs "C:/.../01. Logo DOME/Logo_Branca.png" public/dome-branca.png 420

   O QUE ELE FAZ, e por que existe: os originais da marca vêm com muita
   margem transparente e com o descritor "GRANSERVICES – PRUMO LOGÍSTICA"
   embaixo, que é ilegível em tamanho de tela. Este script varre os pixels,
   agrupa as linhas com tinta em faixas, fica com a PRIMEIRA faixa (o
   wordmark), acha as colunas extremas e recorta exatamente nessa caixa.

   Foi escrito depois de um erro que vale registrar: na primeira vez eu cortei
   "no olho", em 63% da altura. Medindo, o wordmark ia até 68% — o corte
   fatiava a base das letras e o M ficava sem pé, o que só aparece quando
   alguém amplia. Recorte de logo se mede, não se estima.

   Depende do Chromium do Playwright, que NÃO é dependência do projeto. Se não
   estiver instalado:  npx playwright install chromium
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [origem, destino, larguraArg] = process.argv.slice(2)
const largura = Number(larguraArg || 420)

if (!origem || !destino) {
  console.error('Uso: node ferramentas/recortar-logo.mjs <origem.png> <destino.png> [largura]')
  process.exit(1)
}

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('Playwright não está instalado. Rode: npm i -D playwright && npx playwright install chromium')
  process.exit(1)
}

const nav = await chromium.launch()
const pagina = await (await nav.newContext()).newPage()
await pagina.goto('about:blank')

const dados = 'data:image/png;base64,' + readFileSync(resolve(origem)).toString('base64')

const r = await pagina.evaluate(
  async ([url, alvo]) => {
    const img = new Image()
    img.src = url
    await img.decode()

    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const cx = c.getContext('2d')
    cx.drawImage(img, 0, 0)
    const d = cx.getImageData(0, 0, c.width, c.height).data

    const alfa = (x, y) => d[(y * c.width + x) * 4 + 3]
    const linhaTemTinta = (y) => {
      for (let x = 0; x < c.width; x++) if (alfa(x, y) > 24) return true
      return false
    }
    const colunaTemTinta = (x, y0, y1) => {
      for (let y = y0; y <= y1; y++) if (alfa(x, y) > 24) return true
      return false
    }

    // Agrupa as linhas com tinta em faixas separadas por vazio.
    const faixas = []
    let dentro = false
    for (let y = 0; y < c.height; y++) {
      const tem = linhaTemTinta(y)
      if (tem && !dentro) {
        faixas.push({ y0: y })
        dentro = true
      } else if (!tem && dentro) {
        faixas[faixas.length - 1].y1 = y - 1
        dentro = false
      }
    }
    if (dentro) faixas[faixas.length - 1].y1 = c.height - 1
    if (faixas.length === 0) throw new Error('imagem vazia')

    const w = faixas[0] // a primeira faixa é o wordmark; o resto é descritor
    let x0 = 0
    let x1 = c.width - 1
    while (x0 < c.width && !colunaTemTinta(x0, w.y0, w.y1)) x0++
    while (x1 > 0 && !colunaTemTinta(x1, w.y0, w.y1)) x1--

    const cw = x1 - x0 + 1
    const ch = w.y1 - w.y0 + 1
    const h = Math.round((ch / cw) * alvo)

    const saida = document.createElement('canvas')
    saida.width = alvo
    saida.height = h
    const sx = saida.getContext('2d')
    sx.imageSmoothingQuality = 'high'
    sx.drawImage(img, x0, w.y0, cw, ch, 0, 0, alvo, h)

    return { b64: saida.toDataURL('image/png').split(',')[1], cw, ch, h, faixas: faixas.length }
  },
  [dados, largura],
)

writeFileSync(resolve(destino), Buffer.from(r.b64, 'base64'))
await nav.close()

console.log(`${destino}`)
console.log(`  faixas encontradas .. ${r.faixas} (usada a 1ª; as outras são descritor)`)
console.log(`  caixa do wordmark ... ${r.cw}×${r.ch}`)
console.log(`  gerado .............. ${largura}×${r.h}`)
