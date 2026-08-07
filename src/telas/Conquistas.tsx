/* ==========================================================================
   Conquistas.tsx — o que a pessoa já ganhou, e o que falta.

   Esta aba existia como "Certificado", e passava a campanha inteira dizendo
   "ainda não": 25% da navegação ocupada por uma tela vazia durante quatro das
   cinco missões. Agora ela cresce desde a primeira missão — pontos, medalhas,
   desempenho por missão — e o certificado é o último bloco, com a distância
   até ele em número.

   É a regra do "faltam 25 em vez de botão cinza": impedimento se explica e se
   quantifica, e a distância até a próxima coisa é o que faz voltar amanhã.
   ========================================================================== */

import { Link } from 'react-router-dom'
import Certificado from '../componentes/Certificado'
import { Barra, GradeMedalhas, Selo } from '../componentes/comuns'
import { MISSOES, PERGUNTAS_POR_MISSAO, PTS_MAX } from '../conteudo/missoes'
import { useEstado } from '../nucleo/estado'
import {
  acertos,
  acertosTotais,
  fezJogo,
  medalhaDe,
  MEDALHAS,
  missaoCompleta,
  missoesCompletas,
  ORDEM_MEDALHA,
  percentual,
  quizCompleto,
  respondidas,
  tudoCompleto,
} from '../nucleo/progresso'

export default function Conquistas() {
  const { jogador, progresso } = useEstado()
  if (!jogador) return null

  const completo = tudoCompleto(progresso)
  const completas = missoesCompletas(progresso)
  const faltam = MISSOES.length - completas
  const medalha = medalhaDe(progresso)
  const pct = percentual(progresso)
  const totalPerguntas = MISSOES.length * PERGUNTAS_POR_MISSAO

  /* A próxima medalha, e o que falta para ela. Sem isso, a fileira de medalhas
     é só decoração: mostra o que existe, não o que fazer a seguir. */
  const proximaMedalha = ORDEM_MEDALHA.find(
    (m) => !medalha || ORDEM_MEDALHA.indexOf(m) > ORDEM_MEDALHA.indexOf(medalha),
  )

  return (
    <div className="pilha-g">
      <h1>Conquistas</h1>

      <section className="painel pilha" aria-labelledby="t-pontos">
        <h2 id="t-pontos" className="so-leitor">
          Pontos
        </h2>
        {/* Mesma regra do Início: o número é ponto, a barra é jornada. Uma
            porcentagem só no app inteiro — duas bases diferentes com o mesmo
            símbolo é o jeito de a tela parecer errada sem estar. */}
        <div className="heroi__pontos" style={{ color: 'var(--navy)' }}>
          <b>{jogador.pts}</b>
          <span className="meta">de {PTS_MAX} pontos</span>
        </div>
        <Barra pct={pct} rotulo={`Progresso da jornada: ${pct} por cento`} />
        <p className="meta">
          {pct}% da jornada · {acertosTotais(progresso)} de {totalPerguntas} perguntas certas ·{' '}
          {completas} de {MISSOES.length} missões
        </p>
      </section>

      <section className="pilha" aria-labelledby="t-medalhas">
        <h2 id="t-medalhas">Medalhas</h2>
        <GradeMedalhas atual={medalha} />
        {proximaMedalha && (
          <p className="meta">
            Próxima: <strong>{MEDALHAS[proximaMedalha].nome}</strong> — {MEDALHAS[proximaMedalha].comoGanhar}.
          </p>
        )}
      </section>

      <section className="pilha" aria-labelledby="t-missoes">
        <h2 id="t-missoes">Por missão</h2>
        <ul className="pilha-2 sem-lista">
          {MISSOES.map((m, i) => {
            const feita = missaoCompleta(progresso, m.id)
            return (
              <li key={m.id} className="painel" style={{ padding: 'var(--e-4)' }}>
                <div className="linha" style={{ justifyContent: 'space-between' }}>
                  <Link to={`/missao/${m.id}`} style={{ fontWeight: 700, textDecoration: 'none' }}>
                    {i + 1}. {m.nome}
                  </Link>
                  <Selo estado={feita ? 'ok' : 'pendente'}>{feita ? 'Concluída' : 'Em aberto'}</Selo>
                </div>
                <p className="meta" style={{ marginTop: 'var(--e-1)' }}>
                  {m.tema}
                </p>
                <div className="linha" style={{ marginTop: 'var(--e-2)' }}>
                  <Selo estado={fezJogo(progresso, m.id) ? 'ok' : 'neutro'}>{m.jogoNome}</Selo>
                  <Selo estado={quizCompleto(progresso, m.id) ? 'ok' : 'neutro'}>
                    Quiz {respondidas(progresso, m.id)}/{PERGUNTAS_POR_MISSAO} ·{' '}
                    {acertos(progresso, m.id)} {acertos(progresso, m.id) === 1 ? 'acerto' : 'acertos'}
                  </Selo>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="pilha" aria-labelledby="t-certificado">
        <h2 id="t-certificado">Certificado</h2>

        {completo ? (
          <Certificado />
        ) : (
          <div className="painel pilha">
            <p className="prosa">
              Falta{faltam === 1 ? '' : 'm'} <strong>{faltam}</strong>{' '}
              {faltam === 1 ? 'missão' : 'missões'} para o certificado liberar. Cada missão precisa do
              jogo e das {PERGUNTAS_POR_MISSAO} perguntas.
            </p>
            <Barra
              pct={(completas / MISSOES.length) * 100}
              rotulo={`${completas} de ${MISSOES.length} missões concluídas`}
            />
            <p className="meta">
              {completas} de {MISSOES.length} concluídas
            </p>
            <div className="acoes">
              <Link className="botao botao--primario" to="/">
                Continuar a jornada →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
