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

   As missões não se travam UMA PELA OUTRA: quem só tem alguns minutos
   consegue fechar a que quiser, entre as abertas. O que as trava é o
   CALENDÁRIO da campanha — uma etapa por dia, datas em
   `api/_lib/calendario.ts`. Missão fechada aparece na trilha com a data em
   que abre, e não some: saber o que vem amanhã é parte do motivo para voltar.
   ========================================================================== */

import { Link } from 'react-router-dom'
import { useEstado } from '../nucleo/estado'
import { MISSOES, PERGUNTAS_POR_MISSAO, PTS_MAX } from '../conteudo/missoes'
import {
  acertos,
  fezJogo,
  jogosFeitos,
  medalhaDe,
  missaoCompleta,
  missoesCompletas,
  percentual,
  respondidas,
} from '../nucleo/progresso'
import { Barra, GradeMedalhas, Selo } from '../componentes/comuns'
import { useAgora } from '../nucleo/agora'
import { encerrado, estaAberta, rotuloAbertura, rotuloEncerramento } from '../../api/_lib/calendario'
import Certificado from '../componentes/Certificado'

export default function Inicio() {
  const { jogador, progresso } = useEstado()
  const agora = useAgora()
  if (!jogador) return null

  const pct = percentual(progresso)
  const completas = missoesCompletas(progresso)
  const faltam = MISSOES.length - completas
  const primeiroNome = (jogador.nome || '').trim().split(/\s+/)[0]
  /* A "próxima" é a primeira pendente ENTRE AS ABERTAS. Uma pendente fechada
     não pode ser a missão da vez: o botão "Continuar" levaria a um cadeado. */
  const fim = encerrado(agora)
  const proxima = fim
    ? undefined
    : MISSOES.find((m) => !missaoCompleta(progresso, m.id) && estaAberta(m.id, agora))
  const aEspera = MISSOES.find((m) => !missaoCompleta(progresso, m.id) && !estaAberta(m.id, agora))

  return (
    <div className="pilha-g">
      <section className="heroi" aria-labelledby="t-resumo">
        <div className="pilha-2">
          <h1 id="t-resumo">{primeiroNome ? `Olá, ${primeiroNome}` : 'Sua jornada'}</h1>
          {/* Sem frase para quem ainda não começou: o botão logo abaixo já diz o
              que fazer, e a saudação sozinha basta. O parágrafo só aparece
              quando há progresso para contar. */}
          {completas > 0 && (
            <p>
              {faltam > 0 ? (
                <>
                  <strong>{completas}</strong> de <strong>{MISSOES.length}</strong> missões concluídas.
                  Faltam {faltam} para o certificado.
                </>
              ) : (
                'Jornada completa. Seu certificado está pronto.'
              )}
            </p>
          )}
        </div>

        {/* O número é PONTO; a barra e a porcentagem são JORNADA. Antes os dois
            vinham na mesma frase — "22 de 120 pontos · 30%" — e liam como se
            22/120 desse 30%, o que é falso: 30% eram as tarefas feitas. Uma
            conta por linha. */}
        <div className="heroi__pontos">
          <b>{jogador.pts}</b>
          <span className="meta">de {PTS_MAX} pontos</span>
        </div>

        <Barra pct={pct} rotulo={`Progresso da jornada: ${pct} por cento`} />
        <p className="meta">
          {pct}% da jornada · {completas} de {MISSOES.length} missões
        </p>

        <div className="acoes">
          {proxima ? (
            <Link className="botao botao--primario" to={`/missao/${proxima.id}`}>
              {completas === 0 ? 'Começar a Missão 1 →' : 'Continuar de onde parei →'}
            </Link>
          ) : fim && faltam > 0 ? (
            <p className="heroi__espera">
              O jogo foi encerrado às {rotuloEncerramento()}. Obrigado por participar — seus{' '}
              <strong>{jogador.pts} pontos</strong> estão garantidos no ranking.
            </p>
          ) : aEspera ? (
            /* Fez tudo o que estava aberto. Não é botão: não há para onde ir
               hoje, e um botão desabilitado pareceria defeito. */
            <p className="heroi__espera">
              Você concluiu o que estava aberto. A próxima etapa, <strong>{aEspera.nome}</strong>,
              abre na {rotuloAbertura(aEspera.id)}.
            </p>
          ) : (
            /* Âncora, não rota: o certificado está nesta mesma tela, no fim.
               Mandar para outra rota seria fingir que ele mora em outro lugar. */
            <a className="botao botao--primario" href="#certificado">
              Ver meu certificado ↓
            </a>
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
            const daVez = !completa && proxima?.id === m.id
            const feitas = respondidas(progresso, m.id)

            /* FECHADA: o card continua na trilha, com nome e tema, mas não é
               link — é um <div>, e não um <a> desabilitado, porque não há
               destino. O cadeado vai no nó e a data num selo, em texto: a
               informação nunca fica só no ícone. */
            /* Depois do ENCERRAMENTO todas viram cartão fechado, inclusive as
               concluídas: não há mais o que fazer em nenhuma, e um link para um
               jogo que não pontua seria convite à frustração. */
            if (fim || !estaAberta(m.id, agora)) {
              return (
                <li key={m.id} className="trilha__item trilha__item--fechado">
                  <span className="trilha__num" aria-hidden="true">
                    {fim && completa ? '✓' : '🔒'}
                  </span>
                  <div className="trilha__link">
                    <span className="trilha__nome">{m.nome}</span>
                    <span className="trilha__tema">{m.tema}</span>
                    <span className="trilha__selos">
                      {fim && completa ? (
                        <Selo estado="ok">
                          Concluída · {acertos(progresso, m.id)}/{PERGUNTAS_POR_MISSAO} acertos
                        </Selo>
                      ) : fim ? (
                        <Selo estado="neutro">Encerrada</Selo>
                      ) : (
                        <Selo estado="neutro">Abre na {rotuloAbertura(m.id)}</Selo>
                      )}
                    </span>
                  </div>
                </li>
              )
            }

            const estado = completa ? ' trilha__item--feito' : daVez ? ' trilha__item--agora' : ''

            return (
              <li key={m.id} className={`trilha__item${estado}`}>
                <span className="trilha__num" aria-hidden="true">
                  {completa ? '✓' : i + 1}
                </span>

                <Link to={`/missao/${m.id}`} className="trilha__link">
                  {daVez && <span className="trilha__agora">AGORA</span>}
                  <span className="trilha__nome">{m.nome}</span>
                  <span className="trilha__tema">{m.tema}</span>

                  {/* A frase de chamada só aparece na missão da vez. Nas
                      outras ela viraria cinco parágrafos numa lista que a
                      pessoa está percorrendo com o polegar — e some a
                      hierarquia que diz onde ela parou. */}
                  {daVez && <span className="trilha__linha">{m.tagline}</span>}

                  <span className="trilha__selos">
                    {completa ? (
                      <Selo estado="ok">
                        Concluída · {acertos(progresso, m.id)}/{PERGUNTAS_POR_MISSAO} acertos
                      </Selo>
                    ) : (
                      <>
                        {/* Com um jogo só, o selo diz o nome dele; com dois,
                            vira contagem. Dois nomes longos lado a lado
                            quebravam a linha do card no celular. */}
                        {m.jogos.length === 1 ? (
                          <Selo estado={fezJogo(progresso, m.id, m.jogos[0].tipo) ? 'ok' : 'pendente'}>
                            {m.jogos[0].nome}
                          </Selo>
                        ) : (
                          <Selo
                            estado={
                              jogosFeitos(progresso, m.id) === m.jogos.length ? 'ok' : 'pendente'
                            }
                          >
                            Jogos {jogosFeitos(progresso, m.id)}/{m.jogos.length}
                          </Selo>
                        )}
                        <Selo estado={feitas === PERGUNTAS_POR_MISSAO ? 'ok' : 'pendente'}>
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

      {/* O CERTIFICADO FECHA A TRILHA, logo depois da quinta missão.

          Ele já foi aba própria, duas vezes, e nas duas era um lugar para onde
          a pessoa não tinha motivo de ir enquanto não terminasse. Aqui ele é a
          consequência visível das três missões: quem rola a lista até o fim
          encontra o que ganha ao chegar lá — e quanto falta. */}
      <section className="pilha" id="certificado" aria-labelledby="t-certificado">
        <h2 id="t-certificado">Certificado</h2>

        {faltam === 0 ? (
          <Certificado />
        ) : (
          <div className="painel pilha">
            <p className="prosa">
              Falta{faltam === 1 ? '' : 'm'} <strong>{faltam}</strong>{' '}
              {faltam === 1 ? 'missão' : 'missões'}. Cada uma precisa dos jogos e das{' '}
              {PERGUNTAS_POR_MISSAO} perguntas.
            </p>
            <Barra
              pct={(completas / MISSOES.length) * 100}
              rotulo={`${completas} de ${MISSOES.length} missões concluídas`}
            />
            <p className="meta">
              {completas} de {MISSOES.length} concluídas
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
