/* ==========================================================================
   Entrada.tsx — a porta.

   Um campo só: o e-mail corporativo. Sem senha para esquecer, sem link para
   esperar na caixa de entrada, sem código para digitar. Quem está na lista do
   RH entra; quem não está recebe uma frase que diz o que fazer — "fale com o
   RH" — e nunca "e-mail inválido", que faz a pessoa achar que digitou errado.
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
  // Se o app subiu sem as variáveis do Supabase, o erro já nasce na tela: não
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
        e2 instanceof ErroApi
          ? e2.message
          : 'Algo deu errado do nosso lado. Tente de novo em instantes.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pilha--g pilha" style={{ maxWidth: '34rem', marginInline: 'auto' }}>
      <div className="centro pilha">
        <h1>Diversidade em Ação</h1>
        <p style={{ fontSize: '1.0625rem', color: 'var(--ink-2)' }}>
          Uma jornada de {MISSOES.length} missões sobre a inclusão de Pessoas com Deficiência no mundo do
          trabalho. Cada missão tem um jogo e um quiz — e leva cerca de 10 minutos.
        </p>
      </div>

      <form className="cartao pilha" onSubmit={enviar} noValidate>
        <h2 style={{ fontSize: '1.125rem' }}>Entrar</h2>

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
            disabled={enviando}
          />
          <span className="campo__ajuda" id="ajuda-email">
            Use o mesmo e-mail que você usa na empresa. Só quem está na lista do RH consegue participar.
          </span>
        </div>

        {/* Um erro por vez. Antes, um app sem configuração mostrava dois avisos
            empilhados: o do estado e o da checagem de ambiente, dizendo a mesma
            coisa com palavras diferentes. */}
        {erro && <Erro>{erro}</Erro>}

        <button
          className="botao botao--primario botao--largo"
          type="submit"
          disabled={enviando || !CONFIGURADO}
        >
          {enviando ? 'Verificando…' : 'Começar'}
        </button>
      </form>

      <section className="cartao pilha" aria-labelledby="t-jornada">
        <h2 id="t-jornada" style={{ fontSize: '1.125rem' }}>
          O que você vai encontrar
        </h2>
        <ol className="pilha" style={{ paddingLeft: '1.25rem', gap: '.5rem' }}>
          {MISSOES.map((m) => (
            <li key={m.id}>
              <strong>{m.nome}</strong> — {m.tema}
            </li>
          ))}
        </ol>
        <p className="discreto">
          O jogo é acessível por teclado e leitor de tela, tem tradução em Libras e permite ajustar o
          tamanho do texto e o contraste na barra do topo.
        </p>
      </section>
    </div>
  )
}
