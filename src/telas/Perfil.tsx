/* ==========================================================================
   Perfil.tsx — quem você é, e a decisão sobre aparecer.

   NOME, ÁREA E EMPRESA NÃO SE EDITAM AQUI. Vêm da lista do RH e são
   reespelhados a cada acesso. Antes existia um apelido editável, e era ele
   que o ranking mostrava; agora mostra o nome real, e é isso que faz a lista
   pública valer como registro do evento — apelido escolhido por quem joga
   não serve de registro de nada.

   O que sobra para o jogador escolher é o avatar e, principalmente, SE quer
   aparecer. Com nome real em jogo, o texto do opt-in tem de dizer exatamente
   o que fica visível — e é o que ele faz, listando os campos um a um.

   TRÊS ESCOLHAS, TRÊS NATUREZAS DIFERENTES, e é isso que organiza a tela: o
   ÍCONE é uma entre dezenas de opções mais uma alternativa (as iniciais), a
   COR é uma entre dez, e a MOLDURA é decoração. Por isso só o ícone ganha
   filtro por grupo — os oitenta e dois empilhados seriam uma tela inteira de
   rolagem antes de a cor aparecer —, enquanto cor e moldura cabem inteiras de
   uma vez.

   A PRÉVIA existe porque escolher avatar olhando um círculo de 4rem é
   escolher no lugar errado: ele vai ser visto numa lista, com 1,75rem, ao
   lado do nome e dos pontos. Ela mostra a linha do ranking de verdade, com o
   texto mudando conforme a pessoa esteja dentro ou fora dele — "é assim que
   você aparece" e "é assim que você apareceria" não são a mesma frase, e a
   diferença entre elas é a decisão que esta tela pede.

   Os estilos saíram do JSX e foram para `componentes.css`. Não é preferência:
   `style` inline não responde a media query, então a tela ficava fora do tema
   de alto contraste e do `prefers-reduced-motion` que o resto do app respeita.
   O que sobrou inline é dado — a cor escolhida —, não formatação.
   ========================================================================== */

import { useState } from 'react'
import { nomeCurto, salvarPerfil } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import { useAvisos } from '../componentes/avisos'
import Avatar from '../componentes/Avatar'
import { Erro, GradeMedalhas, Nota } from '../componentes/comuns'
import { medalhaDe, MEDALHAS } from '../nucleo/progresso'
import { ErroApi } from '../nucleo/tipos'
import {
  COR_PADRAO,
  CORES_AVATAR,
  EMOJI_PADRAO,
  GRUPOS_AVATAR,
  INICIAIS,
  MOLDURA_PADRAO,
  MOLDURAS,
  corDeContraste,
  iniciaisDe,
} from '../conteudo/avatares'

export default function Perfil() {
  const { jogador, progresso, atualizarJogador, sair } = useEstado()
  const { avisar } = useAvisos()
  const [emoji, setEmoji] = useState(jogador?.emoji ?? EMOJI_PADRAO)
  const [cor, setCor] = useState(jogador?.cor ?? COR_PADRAO)
  const [moldura, setMoldura] = useState(jogador?.moldura || MOLDURA_PADRAO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  /* Abre no grupo do ícone atual, e não no primeiro: quem já escolheu um
     bicho e volta para trocar deve encontrar a escolha na tela, não procurá-la
     em sete pastilhas. */
  const [grupo, setGrupo] = useState(
    () => GRUPOS_AVATAR.find((g) => g.emojis.includes(jogador?.emoji ?? ''))?.id ?? GRUPOS_AVATAR[0].id,
  )

  if (!jogador) return null

  const medalha = medalhaDe(progresso)
  const origem = [jogador.area, jogador.empresa].filter(Boolean).join(' · ')
  const grupoAtual = GRUPOS_AVATAR.find((g) => g.id === grupo) ?? GRUPOS_AVATAR[0]

  /* A paleta trocou de seis cores para dez, e duas das antigas — o âmbar
     #B8791A e o vermelho #C23B22 — não sobreviveram à troca. Quem as tinha
     escolhido abriria esta tela com o avatar numa cor e a paleta inteira sem
     nada marcado, sem entender por quê. A cor atual entra na lista quando não
     estiver nela: some sozinha assim que a pessoa escolher outra, e some do
     código no dia em que ninguém mais tiver uma cor fora da paleta. */
  const paleta = CORES_AVATAR.some((c) => c.hex.toLowerCase() === cor.toLowerCase())
    ? CORES_AVATAR
    : [{ hex: cor, nome: 'Sua cor atual' }, ...CORES_AVATAR]

  /* Salva na hora, sem botão "Salvar": são escolhas de um toque cada, e um
     formulário com botão faria a pessoa achar que precisa confirmar. */
  async function salvar(
    mudanca: { emoji?: string; cor?: string; moldura?: string; opt_in?: boolean },
    aviso: string,
  ) {
    setErro(null)
    setSalvando(true)
    try {
      const r = await salvarPerfil(mudanca)
      atualizarJogador(r.jogador)
      avisar(aviso, 'ok')
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não conseguimos salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="pilha-g">
      <h1>Perfil</h1>

      <section className="painel pilha" aria-labelledby="t-identidade">
        <h2 id="t-identidade" className="painel__titulo">
          Como você aparece
        </h2>

        <div className="perfil__identidade">
          <Avatar emoji={emoji} cor={cor} moldura={moldura} nome={jogador.nome} />
          <div className="perfil__quem">
            <p className="perfil__nome">{nomeCurto(jogador.nome)}</p>
            <p className="meta">{origem || 'Área e empresa não informadas'}</p>
          </div>
        </div>

        <p className="meta">
          Nome, área e empresa vêm da lista do RH e não se editam aqui. Se algo estiver errado, fale
          com o RH — a correção aparece no seu próximo acesso.
        </p>

        {/* ------------------------------------------------------- ÍCONE -- */}
        <fieldset className="campo pilha-2">
          <legend className="campo__legenda">Ícone</legend>

          <button
            type="button"
            className="opcao-iniciais"
            aria-pressed={emoji === INICIAIS}
            disabled={salvando}
            onClick={() => {
              setEmoji(INICIAIS)
              void salvar({ emoji: INICIAIS }, 'Agora seu avatar mostra suas iniciais.')
            }}
          >
            <Avatar emoji={INICIAIS} cor={cor} moldura={moldura} nome={jogador.nome} tamanho="m" />
            Usar minhas iniciais ({iniciaisDe(jogador.nome)})
          </button>

          {/* Botões com `aria-pressed`, e não um `tablist`: trocar de grupo
              filtra uma lista, não navega para outro painel. O rótulo da grade
              abaixo nomeia o grupo aberto, então quem usa leitor de tela não
              depende de enxergar a pastilha destacada. */}
          <div className="grupos" role="group" aria-label="Grupos de ícones">
            {GRUPOS_AVATAR.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={grupo === g.id}
                onClick={() => setGrupo(g.id)}
              >
                {g.titulo}
              </button>
            ))}
          </div>

          <div className="opcoes" role="group" aria-label={`Ícones do grupo ${grupoAtual.titulo}`}>
            {grupoAtual.emojis.map((e) => (
              <button
                key={e}
                type="button"
                className="opcao-avatar"
                aria-pressed={emoji === e}
                aria-label={`Ícone ${e}`}
                disabled={salvando}
                onClick={() => {
                  setEmoji(e)
                  void salvar({ emoji: e }, 'Ícone salvo.')
                }}
              >
                <span aria-hidden="true">{e}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* --------------------------------------------------------- COR -- */}
        <fieldset className="campo">
          <legend className="campo__legenda">Cor</legend>
          <div className="cores">
            {paleta.map((c) => (
              <button
                key={c.hex}
                type="button"
                className="cor"
                aria-pressed={cor === c.hex}
                aria-label={c.nome}
                disabled={salvando}
                style={{ background: c.hex, color: corDeContraste(c.hex) }}
                onClick={() => {
                  setCor(c.hex)
                  void salvar({ cor: c.hex }, `Cor ${c.nome.toLowerCase()} salva.`)
                }}
              >
                <span aria-hidden="true">{cor === c.hex ? '✓' : ''}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* ----------------------------------------------------- MOLDURA -- */}
        <fieldset className="campo">
          <legend className="campo__legenda">Moldura</legend>
          {/* Cada botão é o próprio avatar com a moldura aplicada: a diferença
              entre "anel" e "anel duplo" é visual, e um rótulo sozinho não a
              comunica. O nome vai junto, para quem não vê a diferença. */}
          <div className="molduras">
            {MOLDURAS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="moldura-opcao"
                aria-pressed={moldura === m.id}
                aria-label={`${m.nome}. ${m.descricao}`}
                disabled={salvando}
                onClick={() => {
                  setMoldura(m.id)
                  void salvar({ moldura: m.id }, `Moldura: ${m.nome.toLowerCase()}.`)
                }}
              >
                <Avatar emoji={emoji} cor={cor} moldura={m.id} nome={jogador.nome} tamanho="m" />
                <span aria-hidden="true">{m.nome}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* ------------------------------------------------------ PRÉVIA -- */}
        <div className="pilha-2">
          <p className="meta">
            {jogador.opt_in
              ? 'É assim que você aparece na lista pública:'
              : 'É assim que você apareceria, se entrasse no ranking:'}
          </p>
          <div className="previa">
            <Avatar emoji={emoji} cor={cor} moldura={moldura} nome={jogador.nome} tamanho="m" />
            <span className="previa__quem">
              <span className="previa__nome">{nomeCurto(jogador.nome)}</span>
              <span className="previa__origem meta">{origem || '—'}</span>
            </span>
            <span className="previa__pts">{jogador.pts}</span>
          </div>
        </div>

        {erro && <Erro>{erro}</Erro>}
      </section>

      <section className="painel pilha" aria-labelledby="t-ranking">
        <h2 id="t-ranking" className="painel__titulo">
          Ranking público
        </h2>

        {jogador.opt_in ? (
          <Nota tipo="atencao">
            <b>Você está no ranking.</b>
            Os outros participantes veem <strong>{nomeCurto(jogador.nome)}</strong>
            {origem ? `, ${origem}` : ''} e seus pontos. Seu e-mail e seu nome completo não aparecem.
          </Nota>
        ) : (
          <p className="prosa">
            Você <strong>não</strong> aparece no ranking. Seus pontos e seu certificado contam
            normalmente — o ranking é só a parte pública.
          </p>
        )}

        <div className="acoes">
          <button
            type="button"
            className={`botao ${jogador.opt_in ? 'botao--secundario' : 'botao--primario'}`}
            disabled={salvando}
            onClick={() =>
              void salvar(
                { opt_in: !jogador.opt_in },
                jogador.opt_in ? 'Você saiu do ranking.' : 'Você entrou no ranking.',
              )
            }
          >
            {jogador.opt_in ? 'Sair do ranking' : 'Entrar no ranking'}
          </button>
        </div>
      </section>

      <section className="painel pilha" aria-labelledby="t-medalhas">
        <h2 id="t-medalhas" className="painel__titulo">
          Medalhas
        </h2>
        <GradeMedalhas atual={medalha} />
        <ul className="pilha-2 meta lista-medalhas">
          {Object.entries(MEDALHAS).map(([id, m]) => (
            <li key={id}>
              <strong>{m.nome}</strong> — {m.comoGanhar}
            </li>
          ))}
        </ul>
      </section>

      <section className="painel pilha" aria-labelledby="t-conta">
        <h2 id="t-conta" className="painel__titulo">
          Sua conta
        </h2>
        <p className="meta">
          Você entrou como <strong>{jogador.email}</strong>.
        </p>
        <div className="acoes">
          <button type="button" className="botao botao--fantasma" onClick={sair}>
            Sair deste dispositivo
          </button>
        </div>
      </section>
    </div>
  )
}
