/* ==========================================================================
   estado.tsx — o estado do jogador, em um lugar só.

   Regra herdada do DOME GAMES (`app/js/creditos.js`), e é a razão de o placar
   nunca divergir: quando o servidor devolve um total, o cliente ADOTA o
   total. Nunca soma o delta por conta própria. Se as duas contas discordarem,
   a divergência aparece na hora — em vez de acumular em silêncio até alguém
   reclamar do ranking.
   ========================================================================== */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buscarEstado, entrar as apiEntrar, pedirBonus } from './api'
import { apagarToken, guardarToken, normalizarEmail, temSessao } from './sessao'
import { ErroApi, type IdMissao, type Jogador, type LinhaProgresso, type Tarefa } from './tipos'
import { fezBonus, tudoCompleto } from './progresso'

interface Contexto {
  carregando: boolean
  jogador: Jogador | null
  progresso: LinhaProgresso[]
  entrar: (email: string) => Promise<void>
  sair: () => void
  /** Registra localmente o que o servidor acabou de creditar. */
  registrar: (missao: IdMissao | 'geral', tarefa: Tarefa, pontos: number, total: number) => void
  atualizarJogador: (j: Jogador) => void
  recarregar: () => Promise<void>
}

const Ctx = createContext<Contexto | null>(null)

export function ProvedorEstado({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(temSessao())
  const [jogador, setJogador] = useState<Jogador | null>(null)
  const [progresso, setProgresso] = useState<LinhaProgresso[]>([])

  const recarregar = useCallback(async () => {
    if (!temSessao()) {
      setCarregando(false)
      return
    }
    setCarregando(true)
    try {
      const r = await buscarEstado()
      setJogador(r.jogador)
      setProgresso(r.progresso)
    } catch (e) {
      // Sessão morta (token expirado ou tabela limpa): volta para a entrada em
      // vez de deixar a pessoa numa tela vazia sem explicação.
      if (e instanceof ErroApi && e.codigo === 'sessao-invalida') {
        apagarToken()
        setJogador(null)
        setProgresso([])
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const entrar = useCallback(async (email: string) => {
    const r = await apiEntrar(normalizarEmail(email))
    guardarToken(r.token)
    setJogador(r.jogador)
    setProgresso(r.progresso)
    setCarregando(false)
  }, [])

  const sair = useCallback(() => {
    apagarToken()
    setJogador(null)
    setProgresso([])
  }, [])

  const registrar = useCallback(
    (missao: IdMissao | 'geral', tarefa: Tarefa, pontos: number, total: number) => {
      setProgresso((antes) =>
        antes.some((l) => l.missao === missao && l.tarefa === tarefa)
          ? antes
          : [...antes, { missao, tarefa, pontos, detalhe: null }],
      )
      // O total vem do servidor e substitui o local. Ver o comentário do topo.
      setJogador((j) => (j ? { ...j, pts: total } : j))
    },
    [],
  )

  /* O bônus não é decidido pelo cliente: a Edge Function relê `progresso` e
     confere as cinco missões. Aqui só perguntamos, depois de cada crédito.
     Se ela disser que não, ficamos quietos — não é erro do usuário. */
  useEffect(() => {
    if (!jogador || !tudoCompleto(progresso) || fezBonus(progresso)) return
    let vivo = true
    void (async () => {
      try {
        const r = await pedirBonus()
        if (!vivo) return
        // `pontos: 0` e `ja: false` juntos significam "o servidor não
        // concorda que a jornada acabou". Nesse caso não marcamos nada —
        // marcar esconderia a divergência em vez de deixá-la aparecer.
        if (r.ja || r.pontos > 0) registrar('geral', 'bonus', r.pontos, r.total)
      } catch {
        /* servidor discorda ou está fora: tenta de novo na próxima ação */
      }
    })()
    return () => {
      vivo = false
    }
  }, [jogador, progresso, registrar])

  const valor = useMemo<Contexto>(
    () => ({ carregando, jogador, progresso, entrar, sair, registrar, atualizarJogador: setJogador, recarregar }),
    [carregando, jogador, progresso, entrar, sair, registrar, recarregar],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useEstado(): Contexto {
  const c = useContext(Ctx)
  if (!c) throw new Error('useEstado precisa estar dentro de <ProvedorEstado>')
  return c
}
