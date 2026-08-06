/* ==========================================================================
   avisos.tsx — toast e confete.

   O confete só aparece em conclusão de missão, medalha e fim da jornada. É a
   regra de marca do DOME GAMES que vale aqui também: se tudo comemora, nada
   comemora. E ele respeita `prefers-reduced-motion` — na prática, se o
   movimento estiver desligado, o confete simplesmente não é criado, em vez de
   ser criado e escondido.
   ========================================================================== */

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type Tipo = 'neutro' | 'ok' | 'erro'
interface Aviso {
  id: number
  texto: string
  tipo: Tipo
}

interface Contexto {
  avisar: (texto: string, tipo?: Tipo) => void
  comemorar: (quantidade?: number) => void
}

const Ctx = createContext<Contexto | null>(null)

const CORES = ['#00BBDC', '#004AA1', '#E8B33C', '#83D2E4', '#1E8E5A']

function movimentoLigado(): boolean {
  const attr = document.documentElement.getAttribute('data-movimento')
  if (attr === 'nao') return false
  if (attr === 'sim') return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ProvedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [confete, setConfete] = useState<number[]>([])
  const proximo = useRef(1)

  const avisar = useCallback((texto: string, tipo: Tipo = 'neutro') => {
    const id = proximo.current++
    setAvisos((a) => [...a, { id, texto, tipo }])
    window.setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4200)
  }, [])

  const comemorar = useCallback((quantidade = 40) => {
    if (!movimentoLigado()) return
    const inicio = proximo.current
    proximo.current += quantidade
    setConfete(Array.from({ length: quantidade }, (_, i) => inicio + i))
    window.setTimeout(() => setConfete([]), 2400)
  }, [])

  const valor = useMemo(() => ({ avisar, comemorar }), [avisar, comemorar])

  return (
    <Ctx.Provider value={valor}>
      {children}

      {/* role="status" + aria-live: o leitor de tela anuncia sem roubar o foco
          de onde a pessoa está. Toast que rouba foco interrompe o jogo. */}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso${a.tipo === 'erro' ? ' aviso--erro' : a.tipo === 'ok' ? ' aviso--ok' : ''}`}>
            {a.texto}
          </div>
        ))}
      </div>

      {confete.length > 0 && (
        <div className="confete" aria-hidden="true">
          {confete.map((id, i) => (
            <i
              key={id}
              style={{
                left: `${(i * 97) % 100}%`,
                top: '-5vh',
                background: CORES[i % CORES.length],
                animationDelay: `${(i % 12) * 60}ms`,
              }}
            />
          ))}
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useAvisos(): Contexto {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAvisos precisa estar dentro de <ProvedorAvisos>')
  return c
}
