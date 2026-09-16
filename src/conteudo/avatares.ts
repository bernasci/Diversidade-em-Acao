/* ==========================================================================
   avatares.ts — o que o jogador pode escolher: ícone, cor e moldura.

   Fica em `conteudo/` e não dentro da tela porque é conteúdo editável: quem
   quiser trocar um ícone mexe aqui, sem abrir um componente React.

   LIMITE TÉCNICO QUE NÃO DÁ PARA IGNORAR: a Edge Function corta o `emoji` em
   8 unidades UTF-16 (`corpo.emoji.slice(0, 8)`). Um emoji simples ocupa 2 e
   uma sequência com ZWJ — 🧑‍💻 é 🧑 + ZWJ + 💻 — ocupa 5. Sequências mais
   longas (bandeiras de subdivisão, famílias, profissões com tom de pele)
   chegariam truncadas e apareceriam quebradas na tela de todo mundo. A trava
   `EMOJIS_LONGOS` no fim do arquivo avisa no console em desenvolvimento em
   vez de a pessoa descobrir pelo avatar quebrado.
   ========================================================================== */

export interface GrupoAvatar {
  id: string
  titulo: string
  emojis: string[]
}

/* --------------------------------------------------------------------------
   POR QUE EXISTE O GRUPO "ACESSIBILIDADE", e por que ele é o segundo e não o
   último.

   Este é um app sobre inclusão de pessoas com deficiência, e parte dele é
   jogado por pessoas com deficiência. Uma lista de avatares que oferece
   dezenas de rostos sorridentes e nenhuma bengala diz, sem querer, que a
   pessoa escolha outra coisa para se representar. Cadeira, bengala, aparelho
   auditivo e cão-guia são como muita gente se reconhece — e o app inteiro
   argumenta que isso é parte de um colega, não um detalhe a ser escondido.

   O RISCO CONHECIDO, para quem for reavaliar isto depois: alguém sem
   deficiência pode escolher ♿ por graça, e aí o símbolo vira fantasia. Foi
   pesado contra o custo do silêncio e perdeu — a lista é pública, com nome
   real ao lado, e é um ambiente de trabalho. Se um dia a decisão mudar,
   apague o grupo `acessibilidade` inteiro: nada mais no código depende dele.
   -------------------------------------------------------------------------- */
export const GRUPOS_AVATAR: GrupoAvatar[] = [
  {
    id: 'pessoas',
    titulo: 'Pessoas',
    emojis: ['😀', '🙂', '😎', '🤓', '🥳', '🧑‍💻', '🧑‍🔧', '👷', '🧑‍🏫', '🧑‍⚕️', '🧑‍🍳', '🧑‍🌾'],
  },
  {
    id: 'acessibilidade',
    titulo: 'Acessibilidade',
    emojis: ['♿', '🦽', '🦼', '🦯', '🦻', '🤟', '🐕‍🦺', '🦾', '🧏', '👐'],
  },
  {
    id: 'natureza',
    titulo: 'Natureza',
    emojis: ['🌱', '🌳', '🌻', '🌵', '🍀', '🌊', '⛰️', '🌙', '☀️', '🔥', '❄️', '🌈'],
  },
  {
    id: 'bichos',
    titulo: 'Bichos',
    emojis: ['🐶', '🐱', '🦊', '🐼', '🦉', '🐧', '🐝', '🦋', '🐢', '🐙', '🦜', '🐴'],
  },
  {
    id: 'esporte',
    titulo: 'Esporte',
    emojis: ['⚽', '🏀', '🏐', '🎾', '🏊', '🚴', '🏃', '🧗', '🥋', '🏆', '🎽', '🛹'],
  },
  {
    id: 'musica',
    titulo: 'Música',
    emojis: ['🎸', '🥁', '🎤', '🎧', '🎹', '🎺', '🎻', '🪘', '🎼', '📻', '💿', '🎶'],
  },
  {
    id: 'simbolos',
    titulo: 'Símbolos',
    emojis: ['🚀', '⚓', '🧠', '⭐', '🎯', '⚡', '📚', '🧭', '🔧', '💡', '🗝️', '🎲'],
  },
]

export const EMOJI_PADRAO = '😀'

/* --------------------------------------------------------------------------
   INICIAIS

   `@ini` é um SENTINELA, não um dado: guardado na coluna `emoji`, ele quer
   dizer "desenhe as minhas iniciais", e quem as calcula é o banco, na view do
   ranking (migration 008), e o cliente, aqui.

   POR QUE SENTINELA E NÃO AS LETRAS DIRETO. Guardar "AR" funcionaria hoje e
   apodreceria depois: nome vem da lista do RH e é reespelhado a cada acesso,
   então uma correção de cadastro — "Ana Descartavel" virando "Ana Ribeiro" —
   deixaria as iniciais gravadas apontando para um nome que não existe mais.
   Com o sentinela, elas se corrigem sozinhas no mesmo instante que o nome.

   Cabe folgado no corte de 8 unidades da Edge Function, e não colide com
   emoji nenhum: nenhum caractere de emoji é "@".
   -------------------------------------------------------------------------- */
export const INICIAIS = '@ini'

/**
 * Primeira letra do primeiro nome + primeira do último. Mesma regra do
 * `nomeCurto` em `api.ts`, para o avatar e o nome ao lado contarem a mesma
 * história. Um nome de uma palavra só devolve uma letra.
 */
export function iniciaisDe(nome: string): string {
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (partes.length === 0) return '?'
  const primeira = partes[0][0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1][0] ?? '') : ''
  return (primeira + ultima).toLocaleUpperCase('pt-BR')
}

/** O que desenhar no círculo: o emoji escolhido, ou as iniciais do nome. */
export const conteudoDoAvatar = (emoji: string, nome: string): string =>
  emoji === INICIAIS ? iniciaisDe(nome) : emoji

/**
 * Letra ou emoji? Muda o tamanho e o peso da fonte no círculo — emoji pede
 * corpo grande, duas maiúsculas pedem corpo menor e negrito, senão elas
 * encostam na borda.
 *
 * A view do ranking já devolve as iniciais resolvidas, então lá chega texto e
 * não o sentinela: é por isso que o teste é sobre o formato do valor, e não
 * sobre ser igual a `@ini`.
 */
export const ehTexto = (valor: string): boolean => /^\p{L}{1,3}$/u.test(valor)

/* --------------------------------------------------------------------------
   CORES

   Dez, das seis que havia. As duas primeiras são as da marca; o resto abre o
   leque o suficiente para uma lista de cem pessoas não virar um mar de azul,
   sem sair de tons que convivem com a identidade da DOME.

   Todas são escuras o bastante para o conteúdo do círculo descolar do fundo,
   EXCETO o ciano da marca, que é claro de propósito — e é por causa dele que
   existe a `corDeContraste`, em vez de um branco fixo que sumiria em cima.
   -------------------------------------------------------------------------- */
export interface CorAvatar {
  hex: string
  nome: string
}

export const CORES_AVATAR: CorAvatar[] = [
  { hex: '#004AA1', nome: 'Azul DOME' },
  { hex: '#00BBDC', nome: 'Ciano DOME' },
  { hex: '#001E62', nome: 'Azul-marinho' },
  { hex: '#05627A', nome: 'Petróleo' },
  { hex: '#12724A', nome: 'Verde' },
  { hex: '#1E8E5A', nome: 'Verde-claro' },
  { hex: '#8F5A06', nome: 'Âmbar' },
  { hex: '#B3301A', nome: 'Vermelho' },
  { hex: '#7C5CE0', nome: 'Roxo' },
  { hex: '#C2185B', nome: 'Magenta' },
]

export const COR_PADRAO = CORES_AVATAR[0].hex

const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)

/**
 * Preto ou branco, o que enxergar melhor em cima de `hex`.
 *
 * É a fórmula de luminância relativa da WCAG, não um "se for claro usa preto"
 * no olho. O conteúdo do círculo e o ✓ de selecionado ficam POR CIMA da cor
 * escolhida, e não podem depender de a pessoa distinguir a cor — sumiriam
 * para quem não distingue, e sumiriam para todo mundo no ciano.
 */
export function corDeContraste(hex: string): string {
  const linear = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)
  const luz = 0.2126 * linear(canal(hex, 0)) + 0.7152 * linear(canal(hex, 1)) + 0.0722 * linear(canal(hex, 2))
  return 1.05 / (luz + 0.05) >= (luz + 0.05) / 0.05 ? '#FFFFFF' : '#101A33'
}

/** Mesma cor, `fator` mais escura. 0.18 = 18% para o preto. */
export function escurecer(hex: string, fator: number): string {
  const c = (i: number) =>
    Math.round(canal(hex, i) * (1 - fator))
      .toString(16)
      .padStart(2, '0')
  return `#${c(0)}${c(1)}${c(2)}`
}

/**
 * O fundo do círculo. Não é cor chapada: é um degradê de 140° da cor
 * escolhida para uma versão 18% mais escura.
 *
 * É CALCULADO, não escolhido — por isso não ocupa coluna no banco e vale para
 * todo mundo, inclusive para quem escolheu a cor antes de o degradê existir.
 * 18% é o ponto em que ele dá volume sem virar duas cores: acima disso o
 * círculo parece uma bola de bilhar, e a leitura do que está em cima piora.
 */
export const fundoDoAvatar = (hex: string): string =>
  `linear-gradient(140deg, ${hex} 0%, ${escurecer(hex, 0.18)} 100%)`

/* --------------------------------------------------------------------------
   MOLDURAS

   Puramente decorativas — nenhuma carrega informação, então nada se perde
   para quem não as vê. Guardadas na coluna `moldura` (migration 008) e
   validadas contra esta lista dentro da Edge Function: o `id` que chega e não
   está aqui é recusado, e é por isso que a lista tem de existir dos dois
   lados. Mexeu aqui, mexa em `MOLDURAS` na função `jogar`.

   Todas precisam ser legíveis a 1,75rem, que é o tamanho no ranking. Foi o
   que descartou o tracejado fino e a sombra suave: a 28px eles somem, e uma
   escolha que não aparece onde importa é escolha falsa.
   -------------------------------------------------------------------------- */
export interface Moldura {
  id: string
  nome: string
  /** Como descrever para quem não vê a moldura. */
  descricao: string
}

export const MOLDURAS: Moldura[] = [
  { id: 'nenhuma', nome: 'Sem moldura', descricao: 'Círculo liso, sem anel em volta' },
  { id: 'anel', nome: 'Anel', descricao: 'Um anel da sua cor, separado por um vão claro' },
  { id: 'duplo', nome: 'Anel duplo', descricao: 'Dois anéis concêntricos' },
  { id: 'solido', nome: 'Contorno', descricao: 'Um contorno escuro e grosso, colado no círculo' },
  { id: 'brilho', nome: 'Brilho', descricao: 'Um halo difuso da sua cor' },
  { id: 'quadrado', nome: 'Arredondado', descricao: 'Canto arredondado no lugar do círculo' },
]

export const MOLDURA_PADRAO = 'nenhuma'

export const ehMoldura = (v: string): boolean => MOLDURAS.some((m) => m.id === v)

/** Todos os emojis, sem grupo. */
export const EMOJIS = GRUPOS_AVATAR.flatMap((g) => g.emojis)

/* Trava de desenvolvimento para o limite de 8 unidades da Edge Function. Não
   roda em produção: `import.meta.env.DEV` vira `false` no build e o bloco
   inteiro sai junto. */
if (import.meta.env.DEV) {
  const longos = EMOJIS.filter((e) => e.length > 8)
  if (longos.length) {
    console.warn(
      `[avatares] Emojis longos demais para o limite de 8 da Edge Function, chegariam truncados: ${longos.join(' ')}`,
    )
  }
  const repetidos = EMOJIS.filter((e, i) => EMOJIS.indexOf(e) !== i)
  if (repetidos.length) {
    console.warn(`[avatares] Emojis repetidos entre grupos: ${[...new Set(repetidos)].join(' ')}`)
  }
}
