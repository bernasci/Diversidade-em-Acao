/* ==========================================================================
   Ranking.tsx — quem quis aparecer.

   Três decisões que valem o comentário:

   1. É OPT-IN, desligado por padrão. Num jogo sobre inclusão, expor nome e
      pontuação de 5.602 pessoas sem que elas tenham pedido seria estranho no
      mínimo. Quem não optou não aparece, e pode sair depois no Perfil.

   2. SEM POLLING. A lista é buscada ao abrir e tem um botão de atualizar. O
      DOME GAMES consulta o ranking a cada 15 segundos; com 5.602 pessoas isso
      sozinho consome os 5 GB de egress do plano Free antes do fim da campanha.

   3. NO CELULAR A TABELA VIRA LISTA. Cada linha é um bloco com posição, nome,
      área e pontos — em vez de uma tabela com rolagem lateral, que é o mesmo
      que esconder metade das colunas. A transformação é só CSS: o HTML
      continua sendo uma <table> de verdade, com cabeçalho e <caption>, que é
      o que o leitor de tela precisa para navegar por coluna.

   A leitura vem da view materializada `ranking_publico`, que expõe o nome curto,
   área e pontos — nunca e-mail, nome completo ou id.
   ========================================================================== */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarRanking, nomeCurto } from '../nucleo/api'
import { useEstado } from '../nucleo/estado'
import Avatar from '../componentes/Avatar'
import { Carregando, Nota, Vazio } from '../componentes/comuns'
import type { LinhaRanking } from '../nucleo/tipos'

export default function Ranking() {
  const { jogador } = useEstado()
  const [linhas, setLinhas] = useState<LinhaRanking[] | null>(null)
  const [busca, setBusca] = useState('')

  /* Uma leitura por montagem da tela, e mais nenhuma. Sem botão de atualizar
     e sem `setInterval`: com 554 pessoas convidadas, um polling de 15s como o
     do DOME GAMES estoura sozinho os 5 GB de egress do plano Free. */
  useEffect(() => {
    let vivo = true
    void (async () => {
      const r = await buscarRanking(100)
      if (vivo) setLinhas(r)
    })()
    return () => {
      vivo = false
    }
  }, [])

  const filtradas = (linhas ?? []).filter(
    (l) =>
      !busca.trim() ||
      `${l.nome} ${l.area ?? ''} ${l.empresa ?? ''}`.toLowerCase().includes(busca.trim().toLowerCase()),
  )

  return (
    <div className="pilha-g">
      <div className="pilha-2">
        <h1>Ranking</h1>
        <p className="prosa">
          Aparecem aqui apenas as pessoas que escolheram participar. A lista é atualizada a cada
          poucos minutos.
        </p>
      </div>

      {jogador && !jogador.opt_in && (
        <Nota tipo="info">
          <b>Você não está no ranking.</b>
          Seus pontos e seu progresso continuam contando normalmente — o ranking é só a parte
          pública. <Link to="/perfil">Entrar no ranking →</Link>
        </Nota>
      )}

      <div className="campo">
        <label htmlFor="busca-ranking">Buscar por nome, área ou empresa</label>
        <input
          id="busca-ranking"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Ex.: Operações"
        />
      </div>

      {linhas === null ? (
        <Carregando texto="Buscando o ranking…" linhas={5} />
      ) : filtradas.length === 0 ? (
        <Vazio ico={linhas.length === 0 ? '🏁' : '🔍'}>
          {linhas.length === 0 ? (
            <>
              <strong>O ranking ainda está vazio.</strong> Ele mostra quem optou por aparecer — dá
              para ser a primeira pessoa da lista ativando a opção no <Link to="/perfil">Perfil</Link>.
            </>
          ) : (
            <>
              Nenhum resultado para <strong>{busca}</strong>. Tente parte do nome, da área ou da empresa.
            </>
          )}
        </Vazio>
      ) : (
        <>
          <table className="tabela">
            <caption className="so-leitor">
              Ranking geral por pontos, com {filtradas.length} participantes
            </caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Participante</th>
                <th scope="col">Área e empresa</th>
                <th scope="col">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((l) => {
                /* "você" sai do nome já encurtado pela view, comparado com o
                   mesmo encurtamento feito aqui — os dois usam a mesma regra
                   (primeiro + último), então batem. */
                const eu = Boolean(jogador?.opt_in && nomeCurto(jogador.nome) === l.nome)
                const origem = [l.area, l.empresa].filter(Boolean).join(' · ')
                return (
                  <tr key={`${l.posicao}-${l.nome}`} data-eu={eu ? 'sim' : undefined}>
                    <td className="col-pos">{l.posicao}</td>
                    <td className="col-nome">
                      <Avatar emoji={l.emoji} cor={l.cor} moldura={l.moldura} tamanho="m" />
                      {l.nome}
                      {eu && <strong> · você</strong>}
                    </td>
                    <td className="col-area">{origem || '—'}</td>
                    <td className="col-pts">{l.pts}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* NÃO EXISTE BOTÃO DE ATUALIZAR AQUI, e a ausência é deliberada.

              Ele existia e foi removido: um botão de recarregar ao pé de uma
              lista é um convite a apertar de novo, e apertar de novo é uma
              leitura da view a cada toque. Com 554 pessoas convidadas, um
              punhado delas cutucando o botão enquanto o ranking não muda
              basta para consumir o egress do plano Free — e o teto, quando
              estoura, derruba o app inteiro, não só o ranking.

              O que a pessoa perde: nada que ela não tenha. O ranking é
              materializado e atualiza a cada cinco minutos, então apertar o
              botão nos primeiros quatro minutos e cinquenta e nove segundos
              devolvia exatamente a mesma lista — um gasto certo por uma
              novidade improvável. Quem quiser ver de novo troca de aba e
              volta, ou recarrega a página, que é o gesto que todo mundo já
              conhece. */}
        </>
      )}
    </div>
  )
}
