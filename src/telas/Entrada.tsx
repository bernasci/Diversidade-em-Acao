/* ==========================================================================
   Entrada.tsx — a porta.

   A composição vem do "Painel de Projetos" (variante "cena escura cheia"):
   cena DOME ocupando a tela toda, marca e título centrados, e o formulário
   flutuando num cartão branco. Os dois apps passam a se reconhecer no
   primeiro segundo, e a entrada deixa de parecer um formulário genérico.

   Um campo só: o e-mail corporativo. Sem senha para esquecer, sem link para
   esperar na caixa de entrada. Quem está na lista do RH entra; quem não está
   recebe uma frase que diz o que fazer — "fale com o RH" — e nunca "e-mail
   inválido", que faz a pessoa achar que digitou errado.
   ========================================================================== */

import { useState, type FormEvent } from 'react'
import { useEstado } from '../nucleo/estado'
import { emailPlausivel } from '../nucleo/sessao'
import { ErroApi } from '../nucleo/tipos'
import { CONFIGURADO, MENSAGEM_SEM_CONFIG } from '../nucleo/api'
import { Erro } from '../componentes/comuns'
import { MISSOES } from '../conteudo/missoes'

export default function Entrada() {
  const { entrar } = useEstado()
  const [email, setEmail] = useState('')
  // Se o app subiu sem conexão com o banco, o erro já nasce na tela: não
  // adianta a pessoa digitar o e-mail para descobrir isso depois de enviar.
  const [erro, setErro] = useState<string | null>(CONFIGURADO ? null : MENSAGEM_SEM_CONFIG)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!CONFIGURADO) return
    setErro(null)

    if (!emailPlausivel(email)) {
      setErro('Digite seu e-mail completo, no formato nome@empresa.com.br.')
      return
    }

    setEnviando(true)
    try {
      await entrar(email)
    } catch (e2) {
      setErro(
        e2 instanceof ErroApi ? e2.message : 'Algo deu errado do nosso lado. Tente de novo em instantes.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <section className="palco">
        <div className="palco__pilha">
          <div className="pilha-2">
            <svg
              width="44"
              height="44"
              viewBox="0 0 64 64"
              aria-hidden="true"
              style={{ margin: '0 auto' }}
            >
              <circle cx="32" cy="13" r="6" fill="#00BBDC" />
              <path
                d="M20 26h24M32 26v14M32 40h11M32 40l-9 11"
                stroke="#00BBDC"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <h1 className="palco__titulo">Diversidade em Ação</h1>
            <p className="palco__sub">
              Cinco missões sobre a inclusão de Pessoas com Deficiência no mundo do trabalho.
            </p>
          </div>

          <form className="palco__cartao pilha" onSubmit={enviar} noValidate>
            <div className="campo">
              <label htmlFor="email">E-mail corporativo</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby="ajuda-email"
                aria-invalid={erro ? true : undefined}
                disabled={enviando}
                placeholder="nome.sobrenome@empresa.com.br"
              />
              <span className="campo__ajuda" id="ajuda-email">
                Não precisa de senha. Só quem está na lista do RH consegue entrar.
              </span>
            </div>

            {erro && <Erro>{erro}</Erro>}

            <button
              className="botao botao--primario botao--largo"
              type="submit"
              disabled={enviando || !CONFIGURADO}
            >
              {enviando ? 'Verificando…' : 'Entrar no jogo'}
            </button>
          </form>

          <p className="palco__pe">
            <strong>DOME</strong> Serviços Integrados · Diversidade &amp; Inclusão
          </p>
        </div>
      </section>

      <div className="faixa pilha">
        <h2>O que você vai encontrar</h2>
        <ol className="trilha">
          {MISSOES.map((m, i) => (
            <li key={m.id} className="trilha__item">
              <span className="trilha__num" aria-hidden="true">
                {i + 1}
              </span>
              <div className="trilha__link" style={{ cursor: 'default' }}>
                <span className="trilha__nome">{m.nome}</span>
                <span className="trilha__tema">{m.tema}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="meta">
          Cada missão tem um jogo e cinco perguntas, e leva cerca de dez minutos. O jogo funciona por
          teclado e leitor de tela, tem tradução em Libras e permite ajustar o tamanho do texto e o
          contraste no botão ☰ do topo.
        </p>
      </div>
    </>
  )
}
