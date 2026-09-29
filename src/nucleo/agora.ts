/* ==========================================================================
   agora.ts — o relógio que a tela usa para saber o que está aberto.

   Devolve o instante atual e agenda um redesenho para o próximo momento em
   que alguma missão abre. Sem isto, quem deixasse o app aberto na virada da
   meia-noite continuaria vendo o cadeado até recarregar a página — e a
   campanha manda o lembrete justamente nessa hora.

   Um `setTimeout` só, até a próxima abertura, e não um relógio batendo a cada
   minuto: não há nada para atualizar entre uma data e outra, e um intervalo
   perpétuo redesenharia a trilha 1.440 vezes por dia para nada.
   ========================================================================== */

import { useEffect, useState } from 'react'
import { proximaAbertura } from '../../api/_lib/calendario'

export function useAgora(): number {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const alvo = proximaAbertura(agora)
    if (alvo === null) return
    // +1s de folga: disparar no milissegundo exato pode cair um tique antes
    // da data, e a missão continuaria fechada até a próxima renderização.
    const t = window.setTimeout(() => setAgora(Date.now()), alvo - agora + 1000)
    return () => window.clearTimeout(t)
  }, [agora])

  return agora
}
