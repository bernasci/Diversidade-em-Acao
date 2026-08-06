/* ==========================================================================
   comuns.tsx — peças pequenas usadas em mais de uma tela.

   Regra que atravessa todas: estado nunca é comunicado só por cor. Selo tem
   texto, barra tem `aria-valuenow`, medalha travada diz como se ganha. É a
   diferença entre passar no WCAG 1.4.1 e passar de verdade.
   ========================================================================== */

import type { ReactNode } from 'react'
import { MEDALHAS, ORDEM_MEDALHA } from '../nucleo/progresso'
import type { Medalha } from '../nucleo/tipos'

export function Barra({ pct, rotulo }: { pct: number; rotulo: string }) {
  const v = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div
      className="progresso"
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
    >
      <div className="progresso__barra" style={{ width: `${v}%` }} />
    </div>
  )
}

export function Selo({ estado, children }: { estado: 'ok' | 'pendente' | 'neutro'; children: ReactNode }) {
  return (
    <span className={`selo selo--${estado}`}>
      <i aria-hidden="true">{estado === 'ok' ? '✓' : estado === 'pendente' ? '○' : '·'}</i>
      {children}
    </span>
  )
}

export function GradeMedalhas({ atual }: { atual: Medalha | null }) {
  const alcance = atual ? ORDEM_MEDALHA.indexOf(atual) : -1
  return (
    <ul className="medalhas">
      {ORDEM_MEDALHA.map((m, i) => {
        const conquistada = i <= alcance
        return (
          <li key={m}>
            <span className={`medalha medalha--${conquistada ? m : 'travada'}`}>
              <i aria-hidden="true">{MEDALHAS[m].ico}</i>
              {MEDALHAS[m].nome}
              {!conquistada && <span className="so-leitor"> — ainda não conquistada. {MEDALHAS[m].comoGanhar}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* Esqueleto no lugar de spinner: a tela já mostra onde a informação vai
   cair, em vez de um círculo girando no meio do nada. */
export function Carregando({ texto = 'Carregando…', linhas = 3 }: { texto?: string; linhas?: number }) {
  return (
    <div className="esqueleto" role="status" aria-live="polite">
      <span className="so-leitor">{texto}</span>
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} aria-hidden="true" />
      ))}
    </div>
  )
}

/** Bloco de destaque: explicação, aviso, resultado. Ícone + fundo tonalizado,
    nunca faixa colorida na borda. */
export function Nota({
  tipo = 'info',
  ico,
  children,
  vivo,
}: {
  tipo?: 'info' | 'ok' | 'erro' | 'atencao'
  ico?: string
  children: ReactNode
  vivo?: boolean
}) {
  const padrao = tipo === 'ok' ? '✓' : tipo === 'erro' ? '✕' : tipo === 'atencao' ? '!' : 'i'
  return (
    <div
      className={`nota${tipo === 'info' ? '' : ` nota--${tipo}`}`}
      role={vivo ? 'status' : undefined}
      aria-live={vivo ? 'polite' : undefined}
    >
      <span className="nota__ico" aria-hidden="true">
        {ico ?? padrao}
      </span>
      <div>{children}</div>
    </div>
  )
}

/** Erro de formulário. `role="alert"` porque a pessoa precisa ouvir na hora —
    e o texto sempre diz o que fazer, nunca só o que deu errado. */
export function Erro({ children }: { children: ReactNode }) {
  return (
    <div className="nota nota--erro" role="alert">
      <span className="nota__ico" aria-hidden="true">
        !
      </span>
      <div>{children}</div>
    </div>
  )
}

/** Estado vazio que ensina a interface em vez de dizer "nada aqui". */
export function Vazio({ ico, children }: { ico: string; children: ReactNode }) {
  return (
    <div className="vazio">
      <span className="vazio__ico" aria-hidden="true">
        {ico}
      </span>
      <div className="prosa">{children}</div>
    </div>
  )
}
