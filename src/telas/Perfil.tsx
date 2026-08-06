/* ==========================================================================
   Perfil.tsx — apelido, avatar e a decisão sobre o ranking.

   O cliente só altera campo cosmético. Pontos, área e progresso não estão
   aqui e não estão em lugar nenhum que o navegador alcance: quem os grava é
   a Edge Function, que roda com service_role. Isso não é só segurança — é o
   que faz o resultado de quem jogou honestamente valer alguma coisa.

   O opt-out do ranking vale nos dois lugares: quem sai do ranking também
   desaparece da busca por apelido. Opt-out que vale só num lugar não é
   opt-out.
   ========================================================================== */

import { useState } from 'react'
import { salvarPerfil } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import { useAvisos } from '../componentes/avisos'
import { Erro, GradeMedalhas } from '../componentes/comuns'
import { medalhaDe, MEDALHAS } from '../nucleo/progresso'
import { ErroApi } from '../nucleo/tipos'

const EMOJIS = ['😀', '🙂', '😎', '🤓', '🧑‍💻', '🧑‍🔧', '👷', '🦾', '🧠', '🌱', '⚓', '🚀']
const CORES = ['#004AA1', '#00BBDC', '#1E8E5A', '#B8791A', '#7C5CE0', '#C23B22']

export default function Perfil() {
  const { jogador, progresso, atualizarJogador, sair } = useEstado()
  const { avisar } = useAvisos()
  const [apelido, setApelido] = useState(jogador?.apelido ?? '')
  const [emoji, setEmoji] = useState(jogador?.emoji ?? '😀')
  const [cor, setCor] = useState(jogador?.cor ?? CORES[0])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!jogador) return null
  const medalha = medalhaDe(progresso)

  async function salvar() {
    const limpo = apelido.trim()
    if (limpo.length < 2 || limpo.length > 24) {
      setErro('O apelido precisa ter entre 2 e 24 caracteres.')
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      const r = await salvarPerfil({ apelido: limpo, emoji, cor })
      atualizarJogador(r.jogador)
      avisar('Perfil salvo.', 'ok')
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não conseguimos salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarRanking() {
    setSalvando(true)
    try {
      const r = await salvarPerfil({ opt_in: !jogador!.opt_in })
      atualizarJogador(r.jogador)
      avisar(r.jogador.opt_in ? 'Você entrou no ranking.' : 'Você saiu do ranking.', 'ok')
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não conseguimos salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="pilha--g pilha">
      <h1>Perfil</h1>

      <section className="cartao pilha" aria-labelledby="t-identidade">
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
              borderRadius: '50%',
              background: cor,
              fontSize: '2rem',
            }}
          >
            {emoji}
          </span>
          <div>
            <p style={{ fontWeight: 700 }}>{apelido || jogador.nome}</p>
            <p className="discreto">{jogador.area ?? 'Área não informada'}</p>
          </div>
        </div>

        <div className="campo">
          <label htmlFor="apelido">Apelido no ranking</label>
          <input
            id="apelido"
            value={apelido}
            maxLength={24}
            onChange={(e) => setApelido(e.target.value)}
            aria-describedby="ajuda-apelido"
          />
          <span className="campo__ajuda" id="ajuda-apelido">
            É este nome que aparece para as outras pessoas. Seu nome completo e seu e-mail nunca
            aparecem no ranking.
          </span>
        </div>

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
                style={{
                  minWidth: '3rem',
                  padding: '.4rem',
                  borderColor: emoji === e ? 'var(--dome-blue)' : undefined,
                }}
                onClick={() => setEmoji(e)}
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
                onClick={() => setCor(c)}
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

        <button type="button" className="botao botao--primario" onClick={() => void salvar()} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </section>

      <section className="cartao pilha" aria-labelledby="t-ranking">
        <h2 id="t-ranking" style={{ fontSize: '1.125rem' }}>
          Ranking público
        </h2>
        <p>
          {jogador.opt_in
            ? 'Você aparece no ranking com o apelido acima. Pode sair quando quiser — e sair vale também para a busca.'
            : 'Você não aparece no ranking. Seus pontos continuam contando; apenas ninguém vê seu nome na lista.'}
        </p>
        <button type="button" className="botao botao--secundario" onClick={() => void alternarRanking()} disabled={salvando}>
          {jogador.opt_in ? 'Sair do ranking' : 'Entrar no ranking'}
        </button>
      </section>

      <section className="cartao pilha" aria-labelledby="t-medalhas">
        <h2 id="t-medalhas" style={{ fontSize: '1.125rem' }}>
          Medalhas
        </h2>
        <GradeMedalhas atual={medalha} />
        <ul className="pilha discreto" style={{ paddingLeft: '1.125rem', gap: '.25rem' }}>
          {Object.entries(MEDALHAS).map(([id, m]) => (
            <li key={id}>
              <strong>{m.nome}</strong> — {m.comoGanhar}
            </li>
          ))}
        </ul>
      </section>

      <section className="cartao pilha" aria-labelledby="t-conta">
        <h2 id="t-conta" style={{ fontSize: '1.125rem' }}>
          Sua conta
        </h2>
        <p className="discreto">
          Você entrou como <strong>{jogador.email}</strong>.
        </p>
        <button type="button" className="botao botao--fantasma" onClick={sair}>
          Sair deste dispositivo
        </button>
      </section>
    </div>
  )
}
