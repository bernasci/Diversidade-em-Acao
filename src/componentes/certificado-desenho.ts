/* ==========================================================================
   certificado-desenho.ts — o desenho do certificado, fora do React.

   POR QUE ISTO NÃO MORA DENTRO DO COMPONENTE: para poder ser OLHADO. Layout
   de canvas é aritmética de coordenadas escrita às cegas — cada `fillText`
   num `y` que pareceu razoável — e a única forma de saber se a folha ficou
   equilibrada é rendê-la. Sendo uma função pura de (contexto, dados), ela
   roda num navegador sem sessão, sem Supabase e sem login, e a imagem que
   sai da conferência é byte a byte a que a pessoa vai baixar.

   O componente fica com o que é do React: buscar o jogador, carregar a
   imagem, montar o <canvas> e o texto acessível.
   ========================================================================== */

import { MISSOES, PTS_MAX, TOTAL_PERGUNTAS } from '../conteudo/missoes'

/** Folha em paisagem. Não é A4: é a proporção que cabe inteira na tela de um
    celular deitado, que é onde a maioria vai ver antes de baixar. */
export const L = 1600
export const A = 1100

/* As seis cores do evento, na ordem da fileira de corações. Saíram dos
   próprios arquivos da marca (`logo do evento/`), lidas do pixel e não
   estimadas a olho: o ciano é exatamente o #00BBDC da DOME, o que faz as duas
   marcas se encaixarem sem ninguém ter combinado. */
export const CORES_EVENTO = ['#00BBDC', '#30A570', '#EC9D26', '#BA659C', '#DBA9C0', '#BA8272']

const TINTA = '#111111' // o preto do letreiro da marca
const NAVY = '#001E62' // DOME: só o nome da pessoa e a assinatura
const CINZA = '#5A6785'
const CORPO = '#2A3552'

/** Proporção do arquivo do coração: 874 × 784. */
const RAZAO_CORACAO = 874 / 784

/** Proporção do logotipo da DOME: 420 × 126. */
const RAZAO_DOME = 420 / 126

export interface DadosCertificado {
  nome: string
  pts: number
  acertos: number
  /** Nome e cor da medalha, já resolvidos, ou null para quem não tem. */
  medalha: { nome: string; cor: string } | null
  data: string
}

export interface ImagensCertificado {
  /** O coração da marca do evento (`public/coracao.png`). */
  coracao: CanvasImageSource | null
  /** O logotipo da DOME em cor (`public/dome-cor.png`), para a assinatura. */
  dome: CanvasImageSource | null
}

export async function desenharCertificado(
  c: CanvasRenderingContext2D,
  d: DadosCertificado,
  imagens: ImagensCertificado,
): Promise<void> {
  const { coracao, dome } = imagens
  /* GARANTIR A FONTE ANTES DE DESENHAR.
 
     `document.fonts.ready` sozinho NÃO basta, e a prova de renderização
     mostrou por quê: ele só espera as fontes que já estão sendo carregadas, e
     uma fonte que ninguém usou ainda não está. O canvas não conta como uso
     que dispare o download — atribuir `c.font` e desenhar no mesmo quadro
     escreve com a fonte de sistema, e é essa a folha que a pessoa baixa se
     clicar rápido. Saía visivelmente diferente: a Helvetica é mais estreita
     que a Inter, e o letreiro encolhia.
 
     `fonts.load()` pede cada corpo e peso explicitamente. A string de amostra
     leva acento e cedilha de propósito: com subsetting, pedir só "a" pode
     baixar um pedaço que não cobre o "Ação" do letreiro. */
  const AMOSTRA = 'Diversidade em Ação — ÁÉÍÓÚÃÕÇ 0123456789'
  const FONTES = [
    '400 58px Inter',
    '600 21px Inter',
    '400 25px Inter',
    '700 60px Inter',
    '700 32px Inter',
    '400 20px Inter',
    '400 22px Inter',
  ]
  try {
    await Promise.all(FONTES.map((f) => document.fonts.load(f, AMOSTRA)))
    await document.fonts.ready
  } catch {
    /* navegador sem a API, ou fonte que não veio: desenha com o que tiver */
  }

  /* Cada cor vira uma cópia recolorida do arquivo, feita uma vez só. O truque
     é `source-in`: pinta um retângulo cheio SOMENTE onde o desenho já é
     opaco, o que preserva o antisserrilhado da borda — recolorir trocando
     pixel a pixel deixaria a silhueta serrilhada. */
  const cache = new Map<string, HTMLCanvasElement>()
  const pintado = (cor: string, img: CanvasImageSource) => {
    const feito = cache.get(cor)
    if (feito) return feito
    const off = document.createElement('canvas')
    off.width = 874
    off.height = 784
    const x = off.getContext('2d')!
    x.drawImage(img, 0, 0, off.width, off.height)
    x.globalCompositeOperation = 'source-in'
    x.fillStyle = cor
    x.fillRect(0, 0, off.width, off.height)
    cache.set(cor, off)
    return off
  }

  const coracaoEm = (cx: number, topo: number, altura: number, cor: string) => {
    if (!coracao) return
    const larg = altura * RAZAO_CORACAO
    c.drawImage(pintado(cor, coracao), cx - larg / 2, topo, larg, altura)
  }

  const escrever = (t: string, x: number, y: number, fonte: string, cor: string, espaco = 0) => {
    c.font = fonte
    c.fillStyle = cor
    c.textAlign = 'center'
    // `letterSpacing` é recente; onde não existir, a atribuição é ignorada e o
    // texto sai com espaçamento normal — nada quebra.
    const ctx = c as unknown as { letterSpacing: string }
    ctx.letterSpacing = `${espaco}px`
    c.fillText(t, x, y)
    ctx.letterSpacing = '0px'
  }

  /* ------------------------------------------------------------- folha -- */
  c.fillStyle = '#FFFFFF'
  c.fillRect(0, 0, L, A)

  // Uma faixa fina no topo, em vez da testeira navy de antes: a marca do
  // evento é branca, e um bloco de cor no alto competiria com o coração.
  c.fillStyle = '#00BBDC'
  c.fillRect(0, 0, L, 12)

  /* -------------------------------------------------- a marca do evento -- */
  coracaoEm(L / 2, 64, 146, '#00BBDC')
  escrever('Diversidade em Ação', L / 2, 288, '400 58px Inter, sans-serif', TINTA, -0.5)

  /* A FILEIRA DE CORAÇÕES no lugar de um filete. É o sistema da marca — a
     mesma forma em seis cores — e diz o que o texto diria em uma frase. */
  const passo = 50
  const inicio = L / 2 - (passo * (CORES_EVENTO.length - 1)) / 2
  CORES_EVENTO.forEach((cor, i) => coracaoEm(inicio + i * passo, 330, 26, cor))

  /* ------------------------------------------------------------ título -- */
  escrever('CERTIFICADO DE CONCLUSÃO', L / 2, 424, '600 21px Inter, sans-serif', CINZA, 5)

  /* ------------------------------------------------------------ pessoa -- */
  escrever('Certificamos que', L / 2, 486, '400 25px Inter, sans-serif', CORPO)
  escrever(d.nome, L / 2, 562, fonteQueCabe(c, d.nome, L - 360, 60), NAVY)

  c.font = '400 25px Inter, sans-serif'
  c.fillStyle = CORPO
  c.textAlign = 'center'
  const fim = quebrarLinhas(
    c,
    `concluiu as ${MISSOES.length} missões da jornada sobre inclusão de Pessoas com Deficiência no mundo do trabalho, acertando ${d.acertos} das ${TOTAL_PERGUNTAS} perguntas e somando ${d.pts} de ${PTS_MAX} pontos.`,
    L / 2,
    626,
    L - 440,
    40,
  )

  /* A MEDALHA flutua logo abaixo do parágrafo, e não num `y` fixo: a frase
     tem duas ou três linhas conforme o tamanho dos números, e com `y` fixo ela
     encostava na frase num caso e sobrava no outro.

     Cada medalha sai na cor dela — o bronze acobreado, a platina esverdeada —,
     as mesmas quatro de `tokens.css`. Antes saíam todas no ciano da marca, o
     que era bonito e não dizia nada: a única linha da folha que distingue uma
     conclusão de outra estava pintada igual para todo mundo. */
  if (d.medalha) {
    escrever(`Medalha de ${d.medalha.nome}`, L / 2, fim + 64, '700 32px Inter, sans-serif', d.medalha.cor)
  }

  /* --------------------------------------------------------- a trilha --
     ANCORADA NO RODAPÉ, e não no fluxo do texto acima. É o que mantém as três
     linhas sempre à mesma distância do filete, com medalha ou sem: seguindo o
     fluxo, quem não tem medalha via a lista subir 58px e abrir um vão no pé da
     folha. Um documento se lê de cima para baixo, mas se equilibra pelas duas
     pontas. */
  const filete = A - 156
  MISSOES.forEach((m, i) => {
    const y = filete - 76 - (MISSOES.length - 1 - i) * 34
    escrever(`${m.ordem} · ${m.nome} — ${m.tema}`, L / 2, y, '400 20px Inter, sans-serif', CINZA)
  })

  /* ------------------------------------------------------------ rodapé -- */
  c.strokeStyle = '#E3EAF4'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(L / 2 - 300, filete)
  c.lineTo(L / 2 + 300, filete)
  c.stroke()

  escrever(d.data, L / 2, A - 112, '400 22px Inter, sans-serif', CINZA)
  assinatura(c, dome, A - 68)
}

/* --------------------------------------------------------------------------
   A ASSINATURA: o logotipo da DOME, sozinho e centrado, abaixo da data.

   Chegou a vir acompanhado do filete de pé e do nome do evento, como no
   masthead do jogo. Saíram os dois: no alto da tela aquele arranjo existe
   para dizer de quem é o produto que a pessoa está abrindo, e aqui a folha
   inteira já disse isso — o nome do evento está na coroa, em corpo 58. Repetir
   embaixo era a mesma informação duas vezes, e o filete só existia para
   separar uma coisa da outra.

   O logotipo é o `dome-cor.png`, e não o `dome-branca.png` do cabeçalho: lá o
   fundo é navy, aqui é papel branco, e a versão branca sairia invisível.

   Se a imagem não tiver chegado, a palavra "DOME" entra no lugar dela, na
   mesma posição. Uma assinatura faltando é pior que uma assinatura escrita.
   -------------------------------------------------------------------------- */
function assinatura(c: CanvasRenderingContext2D, dome: CanvasImageSource | null, centroY: number) {
  const ALTURA = 46

  if (!dome) {
    c.textAlign = 'center'
    c.fillStyle = NAVY
    c.font = '700 32px Inter, sans-serif'
    c.fillText('DOME', L / 2, centroY + 11)
    return
  }

  const largura = ALTURA * RAZAO_DOME
  c.drawImage(dome, (L - largura) / 2, centroY - ALTURA / 2, largura, ALTURA)
}

/**
 * A maior fonte em que o texto ainda cabe na largura dada.
 *
 * DEVOLVE A FONTE, e não o texto, porque quem escreve é o `escrever`, e ele
 * atribui `c.font` — se esta função só mexesse no contexto, a atribuição de
 * lá desfaria o ajuste e o nome longo sairia atravessando a margem.
 *
 * O nome vem da lista do RH e não tem teto: "Leonardo Henrique Lopes dos
 * Santos" tem 34 caracteres e, a 60px, não cabe. Encolher é melhor que
 * quebrar em duas linhas — o nome é a única coisa da folha que precisa ser
 * lida de longe.
 */
function fonteQueCabe(
  c: CanvasRenderingContext2D,
  texto: string,
  largura: number,
  corpo: number,
): string {
  let tamanho = corpo
  const fonte = () => `700 ${tamanho}px Inter, sans-serif`
  c.font = fonte()
  while (c.measureText(texto).width > largura && tamanho > 28) {
    tamanho -= 2
    c.font = fonte()
  }
  return fonte()
}

/** Quebra de linha centrada; devolve o `y` da última linha escrita. O
    `fillText` do canvas não quebra sozinho — sem isto, a frase do meio sai
    reta para fora da folha. */
function quebrarLinhas(
  c: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  largura: number,
  alturaLinha: number,
): number {
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
  return yAtual
}
