/* ==========================================================================
   comuns.tsx — peças pequenas usadas em mais de uma tela.

   Regra que atravessa todas: estado nunca é comunicado só por cor. Selo tem
   texto, barra tem `aria-valuenow`, medalha bloqueada diz "Bloqueada". É a
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
  const classe = estado === 'ok' ? 'selo selo--ok' : estado === 'pendente' ? 'selo selo--pendente' : 'selo'
  return (
    <span className={classe}>
      <span aria-hidden="true">{estado === 'ok' ? '✓' : estado === 'pendente' ? '○' : '•'}</span>
      {children}
    </span>
  )
}

export function ChipMedalha({ medalha, conquistada }: { medalha: Medalha; conquistada: boolean }) {
  const m = MEDALHAS[medalha]
  return (
    <span className={`medalha medalha--${conquistada ? medalha : 'bloqueada'}`}>
      <span aria-hidden="true">{m.ico}</span>
      {m.nome}
      {!conquistada && <span className="so-leitor"> — bloqueada. {m.comoGanhar}</span>}
    </span>
  )
}

export function GradeMedalhas({ atual }: { atual: Medalha | null }) {
  const alcance = atual ? ORDEM_MEDALHA.indexOf(atual) : -1
  return (
    <ul className="linha" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {ORDEM_MEDALHA.map((m, i) => (
        <li key={m} title={MEDALHAS[m].comoGanhar}>
          <ChipMedalha medalha={m} conquistada={i <= alcance} />
        </li>
      ))}
    </ul>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <p className="centro discreto" role="status" aria-live="polite" style={{ padding: '3rem 0' }}>
      {texto}
    </p>
  )
}

/** Erro de formulário. `role="alert"` porque a pessoa precisa ouvir na hora —
    e o texto sempre diz o que fazer, nunca só o que deu errado. */
export function Erro({ children }: { children: ReactNode }) {
  return (
    <p className="campo__erro" role="alert">
      <span aria-hidden="true">⚠</span>
      <span>{children}</span>
    </p>
  )
}
