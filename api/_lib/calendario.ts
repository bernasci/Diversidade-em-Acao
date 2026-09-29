/* ==========================================================================
   calendario.ts — quando cada missão abre.

   UMA LISTA SÓ, lida pelos dois lados. A Vercel Function `jogar` a usa para
   RECUSAR resposta de quiz e conclusão de jogo de missão fechada; a tela a
   usa para mostrar o cadeado e a data. Fica em `api/_lib/` e sem nenhum
   import porque é o único lugar que os dois mundos alcançam: a função não
   empacota nada de fora de `api/`, e o Vite importa daqui sem reclamar.

   QUEM DECIDE É O SERVIDOR, com o relógio dele. A tela usa o relógio do
   aparelho, que pode estar adiantado — nesse caso ela mostra a missão aberta
   e o servidor recusa o crédito com a mensagem de quando abre. É o preço de
   não bloquear a tela esperando o servidor dizer que horas são, e é barato:
   só acontece com relógio errado, e ninguém perde ponto por isso.

   As datas são MEIA-NOITE DE BRASÍLIA, escritas com o fuso explícito. Sem o
   `-03:00`, "2026-09-30" seria meia-noite UTC — nove da noite da véspera no
   Brasil, e a missão abriria antes do combinado para quem jogasse à noite.

   Depois da última data esta lista não bloqueia mais nada e pode ficar como
   está: `null` e data passada dão no mesmo.
   ========================================================================== */

const ABERTURA: Record<string, string | null> = {
  m1: null, // Entender — aberta desde o lançamento
  m2: '2026-09-30T00:00:00-03:00', // Desaprender — quarta-feira
  m3: '2026-10-01T00:00:00-03:00', // Agir — quinta-feira
}

/** Instante em que a missão abre, ou null se ela nunca esteve fechada. */
export function abreEm(missao: string): Date | null {
  const d = ABERTURA[missao]
  return d ? new Date(d) : null
}

export function estaAberta(missao: string, agora: number = Date.now()): boolean {
  const d = abreEm(missao)
  return !d || agora >= d.getTime()
}

/**
 * "quarta, 30/09" — curto o bastante para caber num selo da trilha.
 *
 * O fuso vai explícito também na formatação: sem ele, quem abre o app com o
 * celular num fuso diferente veria o dia errado na tela, ainda que o
 * bloqueio em si acontecesse na hora certa.
 */
export function rotuloAbertura(missao: string): string {
  const d = abreEm(missao)
  if (!d) return ''
  const dia = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    timeZone: 'America/Sao_Paulo',
  })
    .format(d)
    .replace('-feira', '')
  const data = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(d)
  return `${dia}, ${data}`
}

/** O próximo instante em que alguma missão abre, para a tela saber quando se
    redesenhar sozinha. Null quando não falta abrir mais nada. */
export function proximaAbertura(agora: number = Date.now()): number | null {
  const futuras = Object.keys(ABERTURA)
    .map((m) => abreEm(m)?.getTime() ?? 0)
    .filter((t) => t > agora)
  return futuras.length ? Math.min(...futuras) : null
}
