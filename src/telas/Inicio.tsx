/* ==========================================================================
   Inicio.tsx — o mapa da jornada.

   As missões são uma TRILHA VERTICAL numerada, não uma grade de cards
   iguais. Dois motivos, e o segundo é o que pesa:

   1. A grade de cards com ícone, título e texto repetida cinco vezes é o
      arranjo que faz qualquer produto parecer template. Cinco caixas
      idênticas não dizem nada sobre a relação entre elas.
   2. As missões SÃO uma sequência — do conceito à liderança, do "o que é" ao
      "o que eu faço na segunda-feira". A trilha mostra isso; a grade
      esconde. É também o que numera com honestidade: o número aqui carrega
      informação, não é enfeite de seção.

   As missões não se travam entre si de propósito: quem só tem cinco minutos
   consegue fechar uma, na ordem que quiser.
   ========================================================================== */

import { Link } from 'react-router-dom'
import { useEstado } from '../nucleo/estado'
import { MISSOES, PERGUNTAS_POR_MISSAO, PTS_MAX } from '../conteudo/missoes'
import {
  acertos,
  fezJogo,
  medalhaDe,
  missaoCompleta,
  missoesCompletas,
  percentual,
  respondidas,
} from '../nucleo/progresso'
import { Barra, GradeMedalhas, Selo } from '../componentes/comuns'

export default function Inicio() {
  const { jogador, progresso } = useEstado()
  if (!jogador) return null

  const pct = percentual(progresso)
  const completas = missoesCompletas(progresso)
  const faltam = MISSOES.length - completas
  const primeiroNome = (jogador.nome || '').trim().split(/\s+/)[0]
  const proxima = MISSOES.find((m) => !missaoCompleta(progresso, m.id))

  return (
    <div className="pilha-g">
      <section className="heroi" aria-labelledby="t-resumo">
        <div className="pilha-2">
          <h1 id="t-resumo">{primeiroNome ? `Olá, ${primeiroNome}` : 'Sua jornada'}</h1>
          <p>
            {completas === 0 && 'Cinco missões, cerca de dez minutos cada. Comece por onde quiser.'}
            {completas > 0 && faltam > 0 && (
              <>
                <strong>{completas}</strong> de <strong>{MISSOES.length}</strong> missões concluídas.
                Faltam {faltam} para o certificado.
              </>
            )}
            {faltam === 0 && 'Jornada completa. Seu certificado está pronto.'}
          </p>
        </div>

        <div className="heroi__pontos">
          <b>{jogador.pts}</b>
          <span className="meta">de {PTS_MAX} pontos · {pct}%</span>
        </div>

        <Barra pct={pct} rotulo={`Progresso da jornada: ${pct} por cento`} />

        <div className="acoes">
          {proxima ? (
            <Link className="botao botao--primario" to={`/missao/${proxima.id}`}>
              {completas === 0 ? 'Começar a Missão 1 →' : 'Continuar de onde parei →'}
            </Link>
          ) : (
            <Link className="botao botao--primario" to="/certificado">
              Ver meu certificado →
            </Link>
          )}
        </div>
      </section>

      <section className="pilha-2" aria-labelledby="t-medalhas">
        <h2 id="t-medalhas">Medalhas</h2>
        <GradeMedalhas atual={medalhaDe(progresso)} />
      </section>

      <section className="pilha" aria-labelledby="t-missoes">
        <h2 id="t-missoes">A jornada</h2>

        <ol className="trilha">
          {MISSOES.map((m, i) => {
            const completa = missaoCompleta(progresso, m.id)
            const agora = !completa && proxima?.id === m.id
            const feitas = respondidas(progresso, m.id)
            const estado = completa ? ' trilha__item--feito' : agora ? ' trilha__item--agora' : ''

            return (
              <li key={m.id} className={`trilha__item${estado}`}>
                <span className="trilha__num" aria-hidden="true">
                  {completa ? '✓' : i + 1}
                </span>

                <Link to={`/missao/${m.id}`} className="trilha__link">
                  {agora && <span className="trilha__agora">AGORA</span>}
                  <span className="trilha__nome">{m.nome}</span>
                  <span className="trilha__tema">{m.tema}</span>

                  {/* A frase de chamada só aparece na missão da vez. Nas
                      outras ela viraria cinco parágrafos numa lista que a
                      pessoa está percorrendo com o polegar — e some a
                      hierarquia que diz onde ela parou. */}
                  {agora && <span className="trilha__linha">{m.tagline}</span>}

                  <span className="trilha__selos">
                    {completa ? (
                      <Selo estado="ok">
                        Concluída · {acertos(progresso, m.id)}/{PERGUNTAS_POR_MISSAO} acertos
                      </Selo>
                    ) : (
                      <>
                        <Selo estado={fezJogo(progresso, m.id) ? 'ok' : 'pendente'}>{m.jogoNome}</Selo>
                        <Selo estado="pendente">
                          Quiz {feitas}/{PERGUNTAS_POR_MISSAO}
                        </Selo>
                      </>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
