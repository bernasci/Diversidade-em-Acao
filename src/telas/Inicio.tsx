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
  quizCompleto,
  respondidas,
} from '../nucleo/progresso'
import { Barra, GradeMedalhas, Selo } from '../componentes/comuns'

export default function Inicio() {
  const { jogador, progresso } = useEstado()
  if (!jogador) return null

  const pct = percentual(progresso)
  const completas = missoesCompletas(progresso)
  const faltam = MISSOES.length - completas
  const primeiroNome = (jogador.nome || jogador.apelido || '').split(' ')[0]
  const proxima = MISSOES.find((m) => !missaoCompleta(progresso, m.id))

  return (
    <div className="pilha-g">
      <section className="painel painel--destaque pilha" aria-labelledby="t-resumo">
        <h1 id="t-resumo">{primeiroNome ? `Olá, ${primeiroNome}` : 'Sua jornada'}</h1>

        <p className="prosa">
          {completas === 0 && (
            <>
              Cinco missões sobre a inclusão de Pessoas com Deficiência no trabalho. Cada uma tem um
              jogo e cinco perguntas, e leva cerca de dez minutos.
            </>
          )}
          {completas > 0 && faltam > 0 && (
            <>
              Você concluiu <strong>{completas}</strong> de <strong>{MISSOES.length}</strong> missões.
              Faltam <strong>{faltam}</strong> para liberar o certificado.
            </>
          )}
          {faltam === 0 && (
            <>
              Jornada completa. Seu certificado está pronto em <Link to="/certificado">Certificado</Link>.
            </>
          )}
        </p>

        <Barra pct={pct} rotulo={`Progresso da jornada: ${pct} por cento`} />
        <p className="meta">
          {pct}% concluído · {jogador.pts} de {PTS_MAX} pontos
        </p>

        <GradeMedalhas atual={medalhaDe(progresso)} />

        {proxima && (
          <div className="acoes">
            <Link className="botao botao--primario" to={`/missao/${proxima.id}`}>
              {completas === 0 ? 'Começar a primeira missão' : 'Continuar de onde parei'}
            </Link>
          </div>
        )}
      </section>

      <section className="pilha" aria-labelledby="t-missoes">
        <h2 id="t-missoes">A jornada</h2>

        <ol className="trilha">
          {MISSOES.map((m, i) => {
            const completa = missaoCompleta(progresso, m.id)
            const feitas = respondidas(progresso, m.id)

            return (
              <li key={m.id} className={`trilha__item${completa ? ' trilha__item--feito' : ''}`}>
                <span className="trilha__num" aria-hidden="true">
                  {completa ? '✓' : i + 1}
                </span>

                <Link to={`/missao/${m.id}`} className="trilha__link">
                  <span className="trilha__nome">{m.nome}</span>
                  <span className="trilha__tema">{m.tema}</span>
                  <span className="trilha__linha">{m.tagline}</span>

                  <span className="trilha__selos">
                    <Selo estado={fezJogo(progresso, m.id) ? 'ok' : 'pendente'}>{m.jogoNome}</Selo>
                    <Selo estado={quizCompleto(progresso, m.id) ? 'ok' : 'pendente'}>
                      Quiz {feitas}/{PERGUNTAS_POR_MISSAO}
                      {quizCompleto(progresso, m.id) && ` · ${acertos(progresso, m.id)} acertos`}
                    </Selo>
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
