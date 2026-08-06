/* ==========================================================================
   App.tsx — casca, rotas e o porteiro.

   Duas coisas que uma SPA quebra por padrão e que estão resolvidas aqui:

   1. FOCO NA TROCA DE TELA. Navegar sem recarregar deixa o foco onde estava —
      quem usa teclado ou leitor de tela troca de página e continua "dentro" do
      menu, sem saber que a tela mudou. `FocoNaTela` move o foco para o
      conteúdo a cada mudança de rota.
   2. TÍTULO DA PÁGINA. Também não muda sozinho, e é o que o leitor de tela
      anuncia primeiro.
   ========================================================================== */

import { useEffect, useRef } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BarraAcessibilidade } from './nucleo/acessibilidade'
import { useEstado } from './nucleo/estado'
import { Carregando } from './componentes/comuns'
import { PTS_MAX } from './conteudo/missoes'
import Entrada from './telas/Entrada'
import Inicio from './telas/Inicio'
import TelaMissao from './telas/Missao'
import Ranking from './telas/Ranking'
import Perfil from './telas/Perfil'
import Certificado from './telas/Certificado'

const ABAS = [
  { para: '/', ico: '🏠', rotulo: 'Início' },
  { para: '/ranking', ico: '🏆', rotulo: 'Ranking' },
  { para: '/certificado', ico: '📜', rotulo: 'Certificado' },
  { para: '/perfil', ico: '👤', rotulo: 'Perfil' },
]

const TITULOS: Record<string, string> = {
  '/': 'Início',
  '/ranking': 'Ranking',
  '/certificado': 'Certificado',
  '/perfil': 'Perfil',
}

function FocoNaTela() {
  const { pathname } = useLocation()
  const primeira = useRef(true)

  useEffect(() => {
    const base = TITULOS[pathname] ?? (pathname.startsWith('/missao/') ? 'Missão' : 'Diversidade em Ação')
    document.title = `${base} · Diversidade em Ação`

    // Na primeira renderização o foco já está onde deveria (topo da página);
    // mover de novo faria o leitor de tela ler duas vezes.
    if (primeira.current) {
      primeira.current = false
      return
    }
    const alvo = document.getElementById('conteudo')
    if (alvo) {
      alvo.focus({ preventScroll: true })
      window.scrollTo({ top: 0 })
    }
  }, [pathname])

  return null
}

export default function App() {
  const { carregando, jogador } = useEstado()

  return (
    <div className="app">
      <FocoNaTela />
      <BarraAcessibilidade />

      <header className="cabecalho">
        <span className="cabecalho__marca">
          <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="14" r="6" fill="#00BBDC" />
            <path
              d="M20 26h24M32 26v14M32 40h11M32 40l-9 11"
              stroke="#00BBDC"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          Diversidade em Ação
        </span>

        {jogador && (
          <span className="cabecalho__pontos">
            <span aria-hidden="true">⭐</span>
            <span>
              {jogador.pts}
              <span className="so-leitor"> de {PTS_MAX} pontos</span>
              <span aria-hidden="true">/{PTS_MAX}</span>
            </span>
          </span>
        )}
      </header>

      {jogador && (
        <nav className="navegacao" aria-label="Seções do jogo">
          {ABAS.map((a) => (
            <NavLink key={a.para} to={a.para} end={a.para === '/'} className="navegacao__item">
              <span aria-hidden="true">{a.ico}</span>
              {a.rotulo}
            </NavLink>
          ))}
        </nav>
      )}

      {/* tabIndex={-1} existe só para receber o foco programático da troca de
          rota; não entra na ordem de tabulação. */}
      <main className="conteudo" id="conteudo" tabIndex={-1}>
        {carregando ? (
          <Carregando texto="Carregando sua jornada…" />
        ) : !jogador ? (
          <Entrada />
        ) : (
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/missao/:id" element={<TelaMissao />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/certificado" element={<Certificado />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}
