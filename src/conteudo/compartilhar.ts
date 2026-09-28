/* ==========================================================================
   compartilhar.ts — o texto que vai pré-preenchido no post do LinkedIn.

   Fica em `conteudo/` pelo mesmo motivo dos outros arquivos daqui: é texto de
   campanha, e quem escreve campanha é o RH. Mudar a chamada não deveria exigir
   abrir um componente React.

   O QUE ESTE TEXTO TENTA NÃO SER: o post corporativo de conclusão de curso.
   "Tive a honra de participar" não convence ninguém e não ensina nada. O que
   faz alguém parar o polegar é uma frase concreta — e as três que o jogo já
   usa como tagline são exatamente isso. Por isso a do meio é emprestada da
   Missão 2: quem lê o post sem nunca ter jogado leva junto o conteúdo.

   A pessoa edita tudo antes de publicar. Isto é um rascunho com o caminho
   andado, não um texto pronto que ela é obrigada a assinar.
   ========================================================================== */

export interface DadosPost {
  /** Nome da medalha conquistada ("Ouro"), ou null para quem não tem. */
  medalha: string | null
  /** O endereço do app. Vem de `window.location.origin` para não engessar o
      domínio: o dia em que a campanha sair do `.vercel.app` não deve exigir
      mexer neste arquivo. */
  url: string
}

export function textoDoPost({ medalha, url }: DadosPost): string {
  const linhas = [
    'Concluí a jornada Diversidade em Ação, da Semana da Diversidade, Equidade & Inclusão da DOME: três missões sobre a inclusão de Pessoas com Deficiência no mundo do trabalho.',
    '',
    'O que fica não é regra decorada. É perceber a barreira que a gente levanta sem querer — o elogio que diminui, a ajuda que atrapalha, a tarefa que se tira do outro achando que está ajudando.',
  ]

  if (medalha) linhas.push('', `Medalha de ${medalha}.`)

  linhas.push('', url, '', '#Inclusão #Diversidade #PcD #DiversidadeEmAção')
  return linhas.join('\n')
}

/**
 * O endereço que abre o compositor do LinkedIn já com o texto dentro.
 *
 * ATENÇÃO, porque isto é o ponto frágil da funcionalidade: o LinkedIn NÃO
 * publica uma API para pré-preencher post. O `shareArticle` antigo aceitava
 * `title` e `summary` e hoje os ignora — sobrou `share-offsite`, que carrega
 * só a URL e monta o card a partir das metatags dela.
 *
 * `?shareActive=true&text=` é o caminho que funciona de verdade hoje: abre o
 * compositor do feed com o texto preenchido, e o link dentro do texto vira o
 * card sozinho. Não é documentado, então pode mudar sem aviso. Se mudar, o
 * botão passa a abrir o feed do LinkedIn sem texto — degrada, não quebra, e é
 * por isso que este caminho foi preferido a um que pudesse dar erro na cara da
 * pessoa.
 */
export const enderecoDoCompositor = (texto: string): string =>
  `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(texto)}`
