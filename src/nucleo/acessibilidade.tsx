/* ==========================================================================
   acessibilidade.tsx — tamanho do texto, contraste e movimento.

   ANTES isto era uma faixa fixa no topo de toda tela, com cinco botões
   sempre visíveis. Ocupava a primeira linha de um app cuja tela útil é a de
   um celular, e era a primeira coisa que aparecia — antes do nome do jogo.
   Virou um botão no cabeçalho que abre um painel.

   O que NÃO mudou, e por quê: os controles continuam alcançáveis já na tela
   de login. Num jogo sobre inclusão de PcD, quem precisa de texto maior
   precisa dele para ler o formulário de entrada — mandar essa pessoa
   "entrar primeiro e ajustar no perfil depois" seria pedir que ela leia o
   que não consegue ler.

   Os três controles escrevem em atributo do <html> ou numa variável CSS.
   Nenhum componente do app sabe que estes modos existem, e é por isso que
   nenhum deles pode quebrar por causa deles.
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

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

/* ------------------------------ O CONTROLE ------------------------------ */

export function BotaoAcessibilidade() {
  const a = useAcessibilidade()
  const [aberto, setAberto] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)
  const botao = useRef<HTMLButtonElement>(null)

  /* Fechar com Esc e com clique fora. Sem isso, um painel aberto no celular
     só fecha voltando ao botão — e quem abriu por engano fica preso. */
  useEffect(() => {
    if (!aberto) return

    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false)
        botao.current?.focus()
      }
    }
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (!caixa.current?.contains(alvo) && !botao.current?.contains(alvo)) setAberto(false)
    }

    document.addEventListener('keydown', tecla)
    document.addEventListener('mousedown', fora)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('mousedown', fora)
    }
  }, [aberto])

  const semMovimento = a.movimento === 'nao'

  return (
    <>
      <button
        ref={botao}
        type="button"
        className="botao-icone"
        aria-expanded={aberto}
        aria-label="Preferências de acessibilidade"
        onClick={() => setAberto((v) => !v)}
      >
        <span aria-hidden="true">☰</span>
      </button>

      {aberto && (
        <div ref={caixa} className="a11y" role="dialog" aria-label="Preferências de acessibilidade">
          <p className="a11y__titulo">Acessibilidade</p>

          <div className="a11y__grupo">
            <span>Tamanho do texto</span>
            <button
              type="button"
              className="a11y__botao"
              onClick={a.diminuir}
              disabled={a.escala <= ESCALAS[0]}
            >
              <span aria-hidden="true">A−</span>
              <span className="so-leitor">Diminuir o texto</span>
            </button>
            <button
              type="button"
              className="a11y__botao"
              onClick={a.aumentar}
              disabled={a.escala >= ESCALAS[ESCALAS.length - 1]}
            >
              <span aria-hidden="true">A+</span>
              <span className="so-leitor">Aumentar o texto</span>
            </button>
          </div>

          <p aria-live="polite" className="so-leitor">
            Texto em {Math.round(a.escala * 100)} por cento
          </p>

          <div className="a11y__grupo">
            <span>Alto contraste</span>
            <button
              type="button"
              className="a11y__botao"
              aria-pressed={a.contraste}
              onClick={a.alternarContraste}
            >
              {a.contraste ? 'Ligado' : 'Desligado'}
            </button>
          </div>

          <div className="a11y__grupo">
            <span>Animações</span>
            <button
              type="button"
              className="a11y__botao"
              aria-pressed={semMovimento}
              onClick={a.alternarMovimento}
            >
              {semMovimento ? 'Desligadas' : 'Ligadas'}
            </button>
          </div>

          <button type="button" className="botao botao--fantasma" onClick={a.restaurar}>
            Restaurar o padrão
          </button>
        </div>
      )}
    </>
  )
}
