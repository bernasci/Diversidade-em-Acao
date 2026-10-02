/* ==========================================================================
   Vencedores.tsx — o anúncio do resultado, depois do encerramento.

   Mostra os cinco, com pontos e tempo, e diz EM TEXTO como cada empate foi
   decidido: "15,05s à frente do 2º". Não basta o número de segundos na
   linha — sem a diferença escrita, quem empatou em pontos precisa fazer a
   conta de cabeça para entender por que ficou atrás, e é exatamente essa a
   pergunta que vai chegar ao RH.

   Empate é informação, e não uma nota de rodapé: só ganha a linha de
   desempate quem tem alguém com os mesmos pontos logo abaixo.
   ========================================================================== */

import { REFERENCIA, VENCEDORES, type Colocado } from '../conteudo/vencedores'

const segundos = (s: number) =>
  `${s.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}s`

/** Quem vem logo abaixo, se empatou em pontos — inclusive o 6º, para o 5º. */
function proximoEmpatado(c: Colocado, i: number): Colocado | null {
  const seguinte = VENCEDORES[i + 1] ?? REFERENCIA
  return seguinte.pts === c.pts ? seguinte : null
}

export default function Vencedores() {
  return (
    <section className="painel pilha vencedores" aria-labelledby="t-vencedores">
      <div className="pilha-2">
        <p className="vencedores__selo">🏆 Resultado final</p>
        <h2 id="t-vencedores">Os vencedores da jornada</h2>
        <p className="prosa">
          Obrigado a todo mundo que jogou. Estes são os cinco primeiros colocados. Todos concluíram as
          três missões; no empate em pontos, venceu quem fez os mini-games em menos tempo.
        </p>
      </div>

      <ol className="vencedores__lista">
        {VENCEDORES.map((c, i) => {
          const empatado = proximoEmpatado(c, i)
          return (
            <li key={c.posicao} className="vencedores__item" data-primeiro={c.posicao === 1 ? 'sim' : undefined}>
              <span className="vencedores__pos" aria-hidden="true">
                {c.posicao}º
              </span>
              <span className="vencedores__quem">
                <span className="vencedores__nome">
                  <span className="so-leitor">{c.posicao}º lugar: </span>
                  {c.nome}
                </span>
                <span className="meta">{c.area}</span>
                {empatado && (
                  <span className="vencedores__desempate">
                    Desempate: {segundos(empatado.segundos - c.segundos)} à frente do {empatado.posicao}º
                  </span>
                )}
              </span>
              <span className="vencedores__numeros">
                <b>{c.pts} pts</b>
                <span className="meta">{segundos(c.segundos)}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <p className="meta">
        Tempo = soma dos três mini-games, medida pelo servidor do toque em "Começar" até a conclusão.
      </p>
    </section>
  )
}
