/* ==========================================================================
   Avatar.tsx — o círculo com o ícone, em um lugar só.

   Ele aparece em três tamanhos e três telas: o retrato de 4rem no perfil, a
   prévia de 1,75rem logo abaixo dele e a lista do ranking. Antes de existir
   este arquivo, o desenho estava escrito duas vezes — no Perfil e no Ranking
   — e as duas versões já tinham divergido: a do ranking não sabia de moldura,
   de degradê nem de iniciais.

   `aria-hidden` por construção, e não por opção de quem chama: o avatar nunca
   é a única forma de saber de quem é a linha. O nome está sempre escrito ao
   lado, em texto. Um leitor de tela anunciando "foguete" antes de cada nome
   seria ruído, não informação.
   ========================================================================== */

import {
  conteudoDoAvatar,
  corDeContraste,
  ehTexto,
  fundoDoAvatar,
  MOLDURA_PADRAO,
} from '../conteudo/avatares'

export interface PropsAvatar {
  emoji: string
  cor: string
  moldura?: string
  /** Necessário só quando `emoji` é o sentinela `@ini`. A view do ranking já
      devolve as iniciais resolvidas, então lá ele não faz falta. */
  nome?: string
  tamanho?: 'g' | 'm'
}

export default function Avatar({ emoji, cor, moldura, nome = '', tamanho = 'g' }: PropsAvatar) {
  const conteudo = conteudoDoAvatar(emoji, nome)

  return (
    <span
      aria-hidden="true"
      className={[
        'avatar',
        tamanho === 'm' ? 'avatar--mini' : '',
        ehTexto(conteudo) ? 'avatar--texto' : '',
        `avatar--${moldura || MOLDURA_PADRAO}`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: fundoDoAvatar(cor),
        color: corDeContraste(cor),
        // A moldura precisa da cor crua, sem o degradê, para o anel não sair
        // com duas tonalidades.
        ['--avatar-cor' as string]: cor,
      }}
    >
      {conteudo}
    </span>
  )
}
