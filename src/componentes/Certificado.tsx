/* ==========================================================================
   Certificado.tsx — o certificado, na marca do evento.

   Desenhado em <canvas> e baixado como PNG. Sem Supabase Storage, sem
   biblioteca de PDF, sem cota consumida: o arquivo nasce e morre no navegador
   da pessoa.

   O DESENHO EM SI mora em `certificado-desenho.ts`, como função pura — é o
   que permite abrir a folha num navegador sem login para conferir o layout.
   Aqui fica só o que é do React: o jogador, a imagem, o canvas e o texto.

   A MARCA É A DO EVENTO, não a do app. O coração é o arquivo original
   recortado (`public/coracao.png`), e não um coração redesenhado a olho: a
   silhueta é particular, com lobos largos e um entalhe raso, e reproduzi-la
   com bezier sairia "quase". A versão anterior do certificado era uma faixa
   navy com moldura ciano, herdada do app; a marca do evento é o oposto —
   branco, preto e uma cor —, e a folha passou a obedecer a ela. O navy ficou
   só no nome da pessoa e na assinatura, que é onde a DOME entra.

   O canvas é `aria-hidden`. Leitor de tela não lê pixel — então o mesmo
   conteúdo aparece logo abaixo em texto real, e é ele que o leitor anuncia.
   Não é uma "versão alternativa": é a mesma informação, na forma que cada
   pessoa consegue receber.

   E vale registrar o que este arquivo NÃO é: credencial. O PNG nasce no
   navegador e não fica guardado em lugar nenhum — qualquer um consegue forjar
   um. É lembrança. O registro de quem concluiu está no banco, e é de lá que o
   RH tira a lista para reconhecimento (ver `supabase/consultas.sql`).
   ========================================================================== */

import { useEffect, useRef, useState } from 'react'
import { useEstado } from '../nucleo/estado'
import { MISSOES, PTS_MAX, TOTAL_PERGUNTAS } from '../conteudo/missoes'
import { acertosTotais, medalhaDe, MEDALHAS } from '../nucleo/progresso'
import { A, desenharCertificado, L } from './certificado-desenho'
import { enderecoDoCompositor, textoDoPost } from '../conteudo/compartilhar'
import type { Medalha } from '../nucleo/tipos'

/** As mesmas quatro cores de `tokens.css`. Aqui elas não podem vir da
    variável CSS: o canvas não resolve `var(--ouro)`. */
const COR_MEDALHA: Record<Medalha, string> = {
  bronze: '#A1622C',
  prata: '#6B7A8D',
  ouro: '#96700F',
  platina: '#0E6A7D',
}

/**
 * Celular ou não.
 *
 * NÃO BASTA PERGUNTAR se o navegador sabe compartilhar arquivo: o Chrome do
 * Windows sabe, e abre a folha de compartilhamento do sistema — onde o
 * LinkedIn quase nunca está, porque quase ninguém instala o app dele no
 * desktop. O botão diria "Publicar no LinkedIn" e abriria um painel do Windows
 * com o Bluetooth e o Mail. Preferir o compositor no navegador, ali, é o que
 * faz o botão cumprir o que promete.
 *
 * `userAgentData.mobile` é o teste certo e é o que os navegadores novos
 * respondem. O resto é para os que ainda não têm: a regex pega Android e
 * iPhone, e o par Macintosh + toque pega o iPad, que desde o iPadOS 13 se
 * declara Mac.
 */
function ehCelular(): boolean {
  if (typeof navigator === 'undefined') return false
  const dados = (navigator as { userAgentData?: { mobile?: boolean } }).userAgentData
  if (typeof dados?.mobile === 'boolean') return dados.mobile
  const ua = navigator.userAgent
  return /Android|iPhone|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/** O mesmo nome no download e no arquivo que vai para o compartilhamento —
    é ele que aparece embaixo da miniatura no app do LinkedIn. */
function nomeDoArquivo(nome: string): string {
  const limpo = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `certificado-diversidade-em-acao-${limpo || 'participante'}.png`
}

export default function Certificado() {
  const { jogador, progresso } = useEstado()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [coracao, setCoracao] = useState<HTMLImageElement | null>(null)
  const [dome, setDome] = useState<HTMLImageElement | null>(null)
  /* O PNG é preparado ASSIM QUE A FOLHA FICA PRONTA, e não no clique.
     `navigator.share` exige gesto do usuário, e em Safari e Firefox o gesto se
     perde no primeiro `await` — gerar o arquivo dentro do clique funcionaria no
     Chrome e falharia calado no iPhone, que é metade do público. */
  const [arquivo, setArquivo] = useState<File | null>(null)

  const medalha = medalhaDe(progresso)
  const acertos = acertosTotais(progresso)
  const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  /* As duas imagens da folha entram por <img>, uma vez cada. Enquanto não
     chegam, o resto é desenhado assim mesmo — melhor um certificado sem o
     símbolo do que um retângulo branco, se a rede falhar no meio. Cada uma
     redesenha a folha ao chegar, e a ordem entre elas não importa. */
  useEffect(() => {
    const carregar = (src: string, guardar: (i: HTMLImageElement) => void) => {
      const img = new Image()
      img.src = src
      img.onload = () => guardar(img)
      return img
    }
    const a = carregar('/coracao.png', setCoracao)
    const b = carregar('/dome-cor.png', setDome)
    return () => {
      a.onload = null
      b.onload = null
    }
  }, [])

  const nome = jogador?.nome ?? ''
  const pts = jogador?.pts ?? 0
  const selo = medalha ? { nome: MEDALHAS[medalha].nome, cor: COR_MEDALHA[medalha] } : null

  useEffect(() => {
    const c = canvasRef.current?.getContext('2d')
    if (!c || !nome) return
    let vivo = true
    void desenharCertificado(c, { nome, pts, acertos, medalha: selo, data }, { coracao, dome }).then(
      () => {
        if (!vivo) return
        canvasRef.current?.toBlob((b) => {
          if (vivo && b) setArquivo(new File([b], nomeDoArquivo(nome), { type: 'image/png' }))
        }, 'image/png')
      },
    )
    return () => {
      vivo = false
    }
    // `selo` é recriado a cada render; a dependência é a medalha que o gerou.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, pts, acertos, medalha, data, coracao, dome])

  if (!jogador) return null

  /* No celular o certificado VAI JUNTO no post: a folha de compartilhamento do
     sistema entrega o PNG ao app do LinkedIn e o texto vai preenchido. É o
     único caminho em que a imagem da pessoa entra sozinha — o link de
     compartilhamento do LinkedIn carrega URL e nada mais.

     No desktop não existe equivalente: abre-se o compositor com o texto, e a
     pessoa anexa o arquivo que o botão ao lado baixa. */
  const podeCompartilharArquivo =
    Boolean(arquivo) &&
    ehCelular() &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [arquivo as File] })

  function publicar() {
    const texto = textoDoPost({
      medalha: medalha ? MEDALHAS[medalha].nome : null,
      url: window.location.origin,
    })

    if (podeCompartilharArquivo && arquivo) {
      void navigator
        .share({ files: [arquivo], text: texto })
        .catch(() => {
          /* a pessoa fechou a folha de compartilhamento: não é erro */
        })
      return
    }

    window.open(enderecoDoCompositor(texto), '_blank', 'noopener,noreferrer')
  }

  function baixar() {
    const cv = canvasRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.download = nomeDoArquivo(jogador?.nome ?? 'participante')
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
        <button type="button" className="botao botao--secundario" onClick={publicar}>
          Publicar no LinkedIn
        </button>
      </div>

      {/* Só aparece onde a imagem NÃO vai junto. No celular a frase seria
          mentira: lá o certificado entra no post sozinho. */}
      {!podeCompartilharArquivo && (
        <p className="meta">
          O LinkedIn abre com o texto pronto — você edita antes de publicar. A imagem o LinkedIn não
          aceita por link: baixe o certificado ao lado e arraste para o post.
        </p>
      )}

      <details className="jogo__como">
        <summary>Ler o conteúdo do certificado em texto</summary>
        <p>
          Certificamos que <strong>{jogador.nome}</strong> concluiu as {MISSOES.length} missões da
          jornada <strong>Diversidade em Ação</strong>, sobre inclusão de Pessoas com Deficiência no
          mundo do trabalho, acertando <strong>{acertos}</strong> das {TOTAL_PERGUNTAS} perguntas e
          somando <strong>{jogador.pts}</strong> de {PTS_MAX} pontos.
          {medalha && (
            <>
              {' '}
              Medalha de <strong>{MEDALHAS[medalha].nome}</strong>.
            </>
          )}{' '}
          Emitido em {data}, na Semana da Diversidade, Equidade &amp; Inclusão da DOME.
        </p>
      </details>
    </div>
  )
}
