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
   ========================================================================== */

import { useState } from 'react'
import { nomeCurto, salvarPerfil } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import { useAvisos } from '../componentes/avisos'
import { Erro, GradeMedalhas, Nota } from '../componentes/comuns'
import { medalhaDe, MEDALHAS } from '../nucleo/progresso'
import { ErroApi } from '../nucleo/tipos'

const EMOJIS = ['😀', '🙂', '😎', '🤓', '🧑‍💻', '🧑‍🔧', '👷', '🦾', '🧠', '🌱', '⚓', '🚀']
const CORES = ['#004AA1', '#00BBDC', '#1E8E5A', '#B8791A', '#7C5CE0', '#C23B22']

export default function Perfil() {
  const { jogador, progresso, atualizarJogador, sair } = useEstado()
  const { avisar } = useAvisos()
  const [emoji, setEmoji] = useState(jogador?.emoji ?? '😀')
  const [cor, setCor] = useState(jogador?.cor ?? CORES[0])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!jogador) return null

  const medalha = medalhaDe(progresso)
  const origem = [jogador.area, jogador.empresa].filter(Boolean).join(' · ')

  /* Salva na hora, sem botão "Salvar": são três escolhas de um toque cada, e
     um formulário com botão faria a pessoa achar que precisa confirmar. */
  async function salvar(mudanca: { emoji?: string; cor?: string; opt_in?: boolean }, aviso: string) {
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
        <h2 id="t-identidade" style={{ fontSize: '1.125rem' }}>
          Como você aparece
        </h2>

        <div className="linha">
          <span
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '4rem',
              height: '4rem',
              flex: 'none',
              borderRadius: '50%',
              background: cor,
              fontSize: '2rem',
            }}
          >
            {emoji}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 'var(--t-md)' }}>{nomeCurto(jogador.nome)}</p>
            <p className="meta">{origem || 'Área e empresa não informadas'}</p>
          </div>
        </div>

        <p className="meta">
          Nome, área e empresa vêm da lista do RH e não se editam aqui. Se algo estiver errado, fale
          com o RH — a correção aparece no seu próximo acesso.
        </p>

        <fieldset style={{ border: 0, padding: 0 }}>
          <legend style={{ fontWeight: 600, fontSize: '.9375rem', marginBottom: '.375rem' }}>Ícone</legend>
          <div className="linha" style={{ gap: '.375rem' }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="botao botao--secundario"
                aria-pressed={emoji === e}
                aria-label={`Ícone ${e}`}
                style={{ minWidth: '3rem', padding: '.4rem' }}
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

        <fieldset style={{ border: 0, padding: 0 }}>
          <legend style={{ fontWeight: 600, fontSize: '.9375rem', marginBottom: '.375rem' }}>Cor</legend>
          <div className="linha" style={{ gap: '.375rem' }}>
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cor === c}
                aria-label={`Cor ${c}`}
                disabled={salvando}
                onClick={() => {
                  setCor(c)
                  void salvar({ cor: c }, 'Cor salva.')
                }}
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: '50%',
                  background: c,
                  border: cor === c ? '3px solid var(--ink)' : '1px solid var(--linha)',
                  cursor: 'pointer',
                }}
              >
                {cor === c && <span className="so-leitor">selecionada</span>}
              </button>
            ))}
          </div>
        </fieldset>

        {erro && <Erro>{erro}</Erro>}
      </section>

      <section className="painel pilha" aria-labelledby="t-ranking">
        <h2 id="t-ranking" style={{ fontSize: '1.125rem' }}>
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
        <h2 id="t-medalhas" style={{ fontSize: '1.125rem' }}>
          Medalhas
        </h2>
        <GradeMedalhas atual={medalha} />
        <ul className="pilha-2 meta" style={{ paddingLeft: '1.125rem' }}>
          {Object.entries(MEDALHAS).map(([id, m]) => (
            <li key={id}>
              <strong>{m.nome}</strong> — {m.comoGanhar}
            </li>
          ))}
        </ul>
      </section>

      <section className="painel pilha" aria-labelledby="t-conta">
        <h2 id="t-conta" style={{ fontSize: '1.125rem' }}>
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
