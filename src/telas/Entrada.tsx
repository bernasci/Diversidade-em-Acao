/* ==========================================================================
   Entrada.tsx — a porta.

   Um campo só: o e-mail corporativo. Sem senha para esquecer, sem link para
   esperar na caixa de entrada, sem código para digitar. Quem está na lista do
   RH entra; quem não está recebe uma frase que diz o que fazer — "fale com o
   RH" — e nunca "e-mail inválido", que faz a pessoa achar que digitou errado.

   O formulário vem PRIMEIRO, antes da explicação do que é o jogo. Quem já
   sabe do que se trata (todo mundo, depois do e-mail do RH) não deveria
   rolar a tela para achar o campo.
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
    <div className="pilha-g">
      <div className="heroi">
        <h1>Diversidade em Ação</h1>
        <p>
          Cinco missões sobre a inclusão de Pessoas com Deficiência no mundo do trabalho. Cada uma tem
          um jogo e um quiz, e leva cerca de dez minutos.
        </p>
      </div>

      <form className="painel pilha" onSubmit={enviar} noValidate>
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
            Use o mesmo e-mail que você usa na empresa. Não precisa de senha.
          </span>
        </div>

        {erro && <Erro>{erro}</Erro>}

        <button
          className="botao botao--primario botao--largo"
          type="submit"
          disabled={enviando || !CONFIGURADO}
        >
          {enviando ? 'Verificando…' : 'Entrar'}
        </button>
      </form>

      <section className="pilha-2" aria-labelledby="t-jornada">
        <h2 id="t-jornada">O que você vai encontrar</h2>
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
          O jogo funciona por teclado e leitor de tela, tem tradução em Libras e permite ajustar o
          tamanho do texto e o contraste no botão ☰ do topo.
        </p>
      </section>
    </div>
  )
}
