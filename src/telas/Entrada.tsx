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
    <section className="palco">
        <div className="palco__pilha">
          <div className="pilha-2">
            <img src="/marca.svg" alt="" width="64" height="64" className="palco__marca" />
            <h1 className="palco__titulo">Diversidade em Ação</h1>
            <p className="palco__sub">Gamificação da Semana da Diversidade</p>
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
                aria-invalid={erro ? true : undefined}
                disabled={enviando}
                placeholder="nome.sobrenome@empresa.com.br"
              />
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

          {/* A assinatura da empresa fecha a cena, como no Painel de Projetos:
              o jogo é da DOME, e é a última coisa que a pessoa vê antes de
              entrar. */}
          <p className="palco__pe">
            <img src="/dome-branca.png" alt="DOME" />
            <span>Serviços Integrados · Diversidade &amp; Inclusão</span>
          </p>
        </div>
    </section>
  )
}
