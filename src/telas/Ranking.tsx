/* ==========================================================================
   Ranking.tsx — quem quis aparecer.

   Duas decisões que valem o comentário:

   1. É OPT-IN, e desligado por padrão. Num jogo sobre inclusão, expor o nome
      e a pontuação de 5.602 pessoas sem que elas tenham pedido seria estranho
      no mínimo. Quem não optou não aparece — e pode sair depois, no Perfil.

   2. SEM POLLING. A lista é buscada uma vez, ao abrir, e tem um botão de
      atualizar. O DOME GAMES consulta o ranking a cada 15 segundos; com 5.602
      pessoas isso sozinho consome os 5 GB de egress do plano Free do Supabase
      antes do fim da campanha.

   A leitura vem da view materializada `ranking_publico`, atualizada a cada
   cinco minutos. Ela expõe apelido, área e pontos — nunca e-mail, nome
   completo ou id.
   ========================================================================== */

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { buscarRanking } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import { Carregando } from '../componentes/comuns'
import type { LinhaRanking } from '../nucleo/tipos'

export default function Ranking() {
  const { jogador } = useEstado()
  const [linhas, setLinhas] = useState<LinhaRanking[] | null>(null)
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setLinhas(null)
    setLinhas(await buscarRanking(100))
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const filtradas = (linhas ?? []).filter(
    (l) =>
      !busca.trim() ||
      `${l.apelido} ${l.area ?? ''}`.toLowerCase().includes(busca.trim().toLowerCase()),
  )

  return (
    <div className="pilha--g pilha">
      <header className="pilha">
        <h1>Ranking</h1>
        <p style={{ color: 'var(--ink-2)' }}>
          Aparecem aqui apenas as pessoas que escolheram participar do ranking. A lista é atualizada a
          cada poucos minutos.
        </p>
      </header>

      {jogador && !jogador.opt_in && (
        <div className="cartao pilha">
          <p>
            <strong>Você não está no ranking.</strong> Seus pontos e seu progresso continuam contando
            normalmente — o ranking é só a parte pública.
          </p>
          <p>
            <Link to="/perfil">Entrar no ranking pelo Perfil →</Link>
          </p>
        </div>
      )}

      <div className="linha">
        <div className="campo" style={{ flex: 1, minWidth: '14rem' }}>
          <label htmlFor="busca-ranking">Buscar por apelido ou área</label>
          <input
            id="busca-ranking"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: Operações"
          />
        </div>
        <button type="button" className="botao botao--secundario" onClick={() => void carregar()}>
          Atualizar
        </button>
      </div>

      {linhas === null ? (
        <Carregando texto="Buscando o ranking…" />
      ) : filtradas.length === 0 ? (
        <p className="cartao centro discreto">
          {linhas.length === 0
            ? 'Ninguém entrou no ranking ainda. Que tal ser a primeira pessoa?'
            : 'Nenhum resultado para essa busca.'}
        </p>
      ) : (
        <div className="cartao" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <caption className="so-leitor">
              Ranking geral, ordenado por pontos, com {filtradas.length} participantes listados
            </caption>
            <thead>
              <tr>
                <th scope="col" style={celulaCabecalho}>
                  #
                </th>
                <th scope="col" style={celulaCabecalho}>
                  Participante
                </th>
                <th scope="col" style={celulaCabecalho}>
                  Área
                </th>
                <th scope="col" style={{ ...celulaCabecalho, textAlign: 'right' }}>
                  Pontos
                </th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((l) => {
                const eu = jogador?.opt_in && jogador.apelido === l.apelido
                return (
                  <tr key={`${l.posicao}-${l.apelido}`} style={eu ? { background: 'var(--dome-cyan-050)' } : undefined}>
                    <td style={{ ...celula, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                      {l.posicao}
                    </td>
                    <td style={celula}>
                      {l.apelido}
                      {eu && <strong> · você</strong>}
                    </td>
                    <td style={{ ...celula, color: 'var(--ink-3)' }}>{l.area ?? '—'}</td>
                    <td style={{ ...celula, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {l.pts}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const celulaCabecalho: CSSProperties = {
  textAlign: 'left',
  padding: '.75rem 1rem',
  borderBottom: '1px solid var(--linha)',
  fontSize: '.8125rem',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  color: 'var(--ink-3)',
}

const celula: CSSProperties = {
  padding: '.75rem 1rem',
  borderBottom: '1px solid var(--linha)',
}
