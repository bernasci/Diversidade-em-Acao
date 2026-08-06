/* ==========================================================================
   acessibilidade.tsx — as preferências de leitura, e a barra que as controla.

   Três controles, e são os três que mais mudam a vida de quem precisa:
   tamanho da fonte, contraste e movimento. Todos escrevem em atributo do
   <html> ou em uma variável CSS — nenhum componente do app sabe que estes
   modos existem, e é por isso que nenhum deles pode quebrar por causa deles.

   Ficam numa barra fixa e visível, não escondidos no perfil. Configuração de
   acessibilidade que exige três cliques para ser encontrada é configuração
   que não existe para quem chegou pela primeira vez.
   ========================================================================== */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Movimento = 'auto' | 'sim' | 'nao'

interface Preferencias {
  escala: number
  contraste: boolean
  movimento: Movimento
}

const PADRAO: Preferencias = { escala: 1, contraste: false, movimento: 'auto' }
const CHAVE = 'diversidade_a11y_v1'
const ESCALAS = [0.9, 1, 1.15, 1.3, 1.5]

interface Contexto extends Preferencias {
  aumentar: () => void
  diminuir: () => void
  alternarContraste: () => void
  alternarMovimento: () => void
  restaurar: () => void
}

const Ctx = createContext<Contexto | null>(null)

function ler(): Preferencias {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return PADRAO
    return { ...PADRAO, ...(JSON.parse(bruto) as Partial<Preferencias>) }
  } catch {
    return PADRAO
  }
}

export function ProvedorAcessibilidade({ children }: { children: ReactNode }) {
  const [pref, setPref] = useState<Preferencias>(ler)

  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.setProperty('--escala', String(pref.escala))
    if (pref.contraste) raiz.setAttribute('data-contraste', 'alto')
    else raiz.removeAttribute('data-contraste')
    if (pref.movimento === 'auto') raiz.removeAttribute('data-movimento')
    else raiz.setAttribute('data-movimento', pref.movimento)
    try {
      localStorage.setItem(CHAVE, JSON.stringify(pref))
    } catch {
      /* storage bloqueado: vale só nesta sessão */
    }
  }, [pref])

  const mover = useCallback((passo: number) => {
    setPref((p) => {
      const i = ESCALAS.indexOf(p.escala)
      const j = Math.min(ESCALAS.length - 1, Math.max(0, (i === -1 ? 1 : i) + passo))
      return { ...p, escala: ESCALAS[j] }
    })
  }, [])

  const valor = useMemo<Contexto>(
    () => ({
      ...pref,
      aumentar: () => mover(1),
      diminuir: () => mover(-1),
      alternarContraste: () => setPref((p) => ({ ...p, contraste: !p.contraste })),
      // 'auto' respeita o sistema. O botão alterna entre "com movimento" e
      // "sem movimento" de forma explícita, para quem não sabe que a
      // preferência do sistema existe.
      alternarMovimento: () =>
        setPref((p) => ({ ...p, movimento: p.movimento === 'nao' ? 'sim' : 'nao' })),
      restaurar: () => setPref(PADRAO),
    }),
    [pref, mover],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAcessibilidade(): Contexto {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAcessibilidade precisa estar dentro de <ProvedorAcessibilidade>')
  return c
}

/* ------------------------------- A BARRA -------------------------------- */

export function BarraAcessibilidade() {
  const a = useAcessibilidade()
  const semMovimento = a.movimento === 'nao'

  return (
    <div className="barra-a11y" role="region" aria-label="Preferências de acessibilidade">
      <span className="barra-a11y__titulo" aria-hidden="true">
        Acessibilidade
      </span>

      <button type="button" onClick={a.diminuir} disabled={a.escala <= ESCALAS[0]}>
        A<span aria-hidden="true">−</span>
        <span className="so-leitor">Diminuir o tamanho do texto</span>
      </button>

      <span aria-live="polite" className="so-leitor">
        Texto em {Math.round(a.escala * 100)}%
      </span>

      <button type="button" onClick={a.aumentar} disabled={a.escala >= ESCALAS[ESCALAS.length - 1]}>
        A<span aria-hidden="true">+</span>
        <span className="so-leitor">Aumentar o tamanho do texto</span>
      </button>

      <button type="button" aria-pressed={a.contraste} onClick={a.alternarContraste}>
        <span aria-hidden="true">◐</span> Alto contraste
      </button>

      <button type="button" aria-pressed={semMovimento} onClick={a.alternarMovimento}>
        <span aria-hidden="true">⏸</span> Sem animação
      </button>

      <button type="button" onClick={a.restaurar}>
        Restaurar
      </button>
    </div>
  )
}
