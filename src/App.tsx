/* ==========================================================================
   App.tsx — casca, rotas e o porteiro.

   Duas coisas que uma SPA quebra por padrão e que estão resolvidas aqui:

   1. FOCO NA TROCA DE TELA. Navegar sem recarregar deixa o foco onde estava —
      quem usa teclado ou leitor de tela troca de página e continua "dentro"
      do menu, sem saber que a tela mudou.
   2. TÍTULO DA PÁGINA. Também não muda sozinho, e é o que o leitor de tela
      anuncia primeiro.

   A navegação é a mesma lista nos dois tamanhos: barra inferior no celular,
   na zona do polegar, e barra no topo a partir de 48rem. Muda a posição, não
   a informação — é isso que "responsivo estrutural" quer dizer, e é o que
   evita ter duas árvores de navegação para manter.
   ========================================================================== */

import { useEffect, useRef } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Award, Map, Trophy, User } from 'lucide-react'
import { BotaoAcessibilidade } from './nucleo/acessibilidade'
import { useEstado } from './nucleo/estado'
import { Carregando } from './componentes/comuns'
import { PTS_MAX } from './conteudo/missoes'
import Entrada from './telas/Entrada'
import Inicio from './telas/Inicio'
import TelaMissao from './telas/Missao'
import Ranking from './telas/Ranking'
import Perfil from './telas/Perfil'
import Certificado from './telas/Certificado'

/* Ícones do lucide-react, importados um a um: o bundler descarta o resto da
   biblioteca, e o que sobra são quatro SVGs inline. Os glifos de texto que
   estavam aqui antes (◆ ▲ ★ ●) renderizavam diferente em cada sistema. */
const ABAS = [
  { para: '/', Ico: Map, rotulo: 'Missões' },
  { para: '/ranking', Ico: Trophy, rotulo: 'Ranking' },
  { para: '/certificado', Ico: Award, rotulo: 'Certificado' },
  { para: '/perfil', Ico: User, rotulo: 'Perfil' },
]

const TITULOS: Record<string, string> = {
  '/': 'Missões',
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

    // Na primeira renderização o foco já está onde deveria; mover de novo
    // faria o leitor de tela ler duas vezes.
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
  const { pathname } = useLocation()
  const largo = pathname === '/ranking'
  const entrando = !jogador && !carregando

  return (
    <div className="app">
      <FocoNaTela />

      {/* Na entrada o cabeçalho vira só uma faixa da própria cena: a marca já
          aparece grande no palco, e repeti-la duas vezes na mesma tela é a
          diferença entre uma composição e um empilhamento. Sobra o botão de
          acessibilidade, que precisa estar lá desde o login. */}
      <header className={`cabecalho${entrando ? ' cabecalho--palco' : ''}`}>
        <span className="marca">
          <svg width="24" height="24" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="13" r="6" fill="#00BBDC" />
            <path
              d="M20 26h24M32 26v14M32 40h11M32 40l-9 11"
              stroke="#00BBDC"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span>Diversidade em Ação</span>
        </span>

        <div className="cabecalho__acoes">
          {jogador && (
            <span className="placar">
              <b>{jogador.pts}</b>
              <span aria-hidden="true">/{PTS_MAX}</span>
              <span className="so-leitor">de {PTS_MAX} pontos</span>
            </span>
          )}
          <BotaoAcessibilidade />
        </div>
      </header>

      {jogador && (
        <nav className="nav" aria-label="Seções do jogo">
          {ABAS.map(({ para, Ico, rotulo }) => (
            <NavLink key={para} to={para} end={para === '/'} className="nav__item">
              <Ico aria-hidden="true" strokeWidth={2.25} />
              {rotulo}
            </NavLink>
          ))}
        </nav>
      )}

      {/* tabIndex={-1} existe só para receber o foco programático da troca de
          rota; não entra na ordem de tabulação.

          A entrada abre mão da coluna centrada e do respiro: a cena escura
          precisa sangrar até a borda da tela, e ela cuida do próprio
          espaçamento por dentro. */}
      <main
        className={`conteudo${largo ? ' conteudo--largo' : ''}${entrando ? ' conteudo--palco' : ''}`}
        id="conteudo"
        tabIndex={-1}
      >
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
