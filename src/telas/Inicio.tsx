/* ==========================================================================
   Inicio.tsx — o mapa da jornada.

   O princípio aqui é "faltam 25 em vez de botão cinza": nada fica bloqueado
   sem dizer o quê e quanto falta. As missões não travam umas às outras de
   propósito — a pessoa faz na ordem que quiser, e quem só tem cinco minutos
   consegue fechar uma.
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
  const medalha = medalhaDe(progresso)
  const primeiroNome = (jogador.nome || jogador.apelido || '').split(' ')[0]

  return (
    <div className="pilha--g pilha">
      <section className="cartao pilha" aria-labelledby="t-resumo">
        <h1 id="t-resumo" style={{ fontSize: '1.5rem' }}>
          {primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'}
        </h1>

        <p style={{ color: 'var(--ink-2)' }}>
          {completas === 0 && 'Sua jornada começa agora. Escolha qualquer missão para abrir.'}
          {completas > 0 && completas < MISSOES.length && (
            <>
              Você concluiu <strong>{completas}</strong> de <strong>{MISSOES.length}</strong> missões.
              Faltam <strong>{MISSOES.length - completas}</strong> para liberar o certificado.
            </>
          )}
          {completas === MISSOES.length && (
            <>
              Jornada completa. Seu certificado está pronto em{' '}
              <Link to="/certificado">Certificado</Link>.
            </>
          )}
        </p>

        <Barra pct={pct} rotulo={`Progresso da jornada: ${pct} por cento`} />
        <p className="discreto">
          {pct}% concluído · {jogador.pts} de {PTS_MAX} pontos
        </p>

        <GradeMedalhas atual={medalha} />
      </section>

      <section className="pilha" aria-labelledby="t-missoes">
        <h2 id="t-missoes">Missões</h2>

        <ul className="grade-missoes" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {MISSOES.map((m) => {
            const completa = missaoCompleta(progresso, m.id)
            const jogoFeito = fezJogo(progresso, m.id)
            const quizFeito = quizCompleto(progresso, m.id)
            const feitas = respondidas(progresso, m.id)

            return (
              <li key={m.id}>
                <Link
                  to={`/missao/${m.id}`}
                  className={`missao-cartao${completa ? ' missao-cartao--concluida' : ''}`}
                >
                  <span className="missao-cartao__ordem">
                    <span aria-hidden="true">{m.ico} </span>
                    {m.ordem}
                  </span>
                  <span className="missao-cartao__nome">{m.nome}</span>
                  <span style={{ color: 'var(--ink-2)', fontSize: '.9375rem' }}>{m.tagline}</span>

                  <span className="missao-cartao__tarefas">
                    <Selo estado={jogoFeito ? 'ok' : 'pendente'}>{m.jogoNome}</Selo>
                    <Selo estado={quizFeito ? 'ok' : 'pendente'}>
                      Quiz {feitas}/{PERGUNTAS_POR_MISSAO}
                      {quizFeito && ` · ${acertos(progresso, m.id)} acertos`}
                    </Selo>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
