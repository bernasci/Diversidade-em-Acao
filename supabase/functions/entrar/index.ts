/* ==========================================================================
   entrar — a porta do jogo.

   POST { email } →
     200 { token, jogador, progresso }
     403 { erro: 'nao-elegivel' }      e-mail fora da lista do RH
     429 { erro: 'muitas-tentativas' }

   Não manda e-mail, não cria usuário no GoTrue, não pede senha. O login é
   "este e-mail está na lista que o RH mandou?" — e a resposta dessa pergunta
   é um token opaco de 32 bytes, cujo hash fica em `sessoes`.

   Por que não magic link: o SMTP nativo do Supabase entrega 2 e-mails por
   hora. Para 5.602 pessoas, seria preciso montar SMTP próprio e ainda assim
   torcer para nada cair em spam corporativo no dia do lançamento.

   Consequência assumida: quem souber o e-mail de um colega entra no lugar
   dele. Aceitável enquanto a premiação for simbólica e o ranking, opt-in. O
   upgrade já está preparado — `elegiveis.matricula` existe e virar segundo
   fator custa a checagem comentada lá embaixo.

   Deploy:  supabase functions deploy entrar --no-verify-jwt
   (`--no-verify-jwt` porque quem chega aqui ainda não tem sessão nenhuma.)
   ========================================================================== */

import {
  CORS,
  CAMPOS_JOGADOR,
  admin,
  erro,
  hashDoToken,
  normalizarEmail,
  novoToken,
  responder,
  type Jogador,
} from '../_compartilhado/comum.ts'

const DIAS_DE_SESSAO = 30
const MAX_ENTRADAS_POR_HORA = 10

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return erro('metodo', 'Use POST.', 405)

  let corpo: { email?: string; matricula?: string }
  try {
    corpo = await req.json()
  } catch {
    return erro('dados-invalidos', 'Corpo da requisição inválido.')
  }

  const email = normalizarEmail(corpo.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return erro('dados-invalidos', 'Digite seu e-mail completo, no formato nome@empresa.com.br.')
  }

  const sb = admin()

  /* ---------------------------------------------------------------- lista */
  const { data: elegivel, error: erroLista } = await sb
    .from('elegiveis')
    .select('email, nome, area, empresa, matricula')
    .eq('email', email)
    .maybeSingle()

  if (erroLista) return erro('desconhecido', 'Não conseguimos consultar a lista agora.', 500)

  if (!elegivel) {
    // A mensagem diz o que fazer e não culpa quem digitou. Ela também não
    // revela se o e-mail existe na empresa — só que não está nesta campanha.
    return erro(
      'nao-elegivel',
      'Esse e-mail não está na lista de participantes. Fale com o RH para ser incluído.',
      403,
    )
  }

  /* Segundo fator, pronto para ser ligado quando a premiação deixar de ser
     simbólica. Basta pedir a matrícula na tela de entrada e descomentar:

     if (elegivel.matricula) {
       const m = String(corpo.matricula ?? '').replace(/\D/g, '')
       if (m !== String(elegivel.matricula).replace(/\D/g, '')) {
         return erro('nao-elegivel', 'E-mail e matrícula não conferem. Confira com o RH.', 403)
       }
     }
  */

  /* -------------------------------------------------------------- jogador */
  let { data: jogador } = await sb
    .from('jogadores')
    .select(CAMPOS_JOGADOR)
    .eq('email', email)
    .maybeSingle<Jogador>()

  if (!jogador) {
    // Nome, área e empresa vêm da lista do RH e o jogador não os edita: é o
    // que faz o ranking dizer a verdade sobre quem é quem.
    const { data: criado, error: erroCriar } = await sb
      .from('jogadores')
      .insert({
        email,
        nome: String(elegivel.nome ?? '').trim(),
        area: elegivel.area ?? null,
        empresa: elegivel.empresa ?? null,
      })
      .select(CAMPOS_JOGADOR)
      .single<Jogador>()

    if (erroCriar || !criado) return erro('desconhecido', 'Não conseguimos criar seu perfil.', 500)
    jogador = criado
  } else {
    /* Reespelha nome, área e empresa da lista a cada acesso. O RH sempre
       manda a planilha corrigida depois do primeiro lote — sem isto, quem
       entrou antes da correção ficaria com o nome errado no ranking para
       sempre, e ninguém saberia por quê. */
    const { data: atualizado } = await sb
      .from('jogadores')
      .update({
        ultimo_acesso: new Date().toISOString(),
        nome: String(elegivel.nome ?? '').trim() || jogador.nome,
        area: elegivel.area ?? jogador.area,
        empresa: elegivel.empresa ?? jogador.empresa,
      })
      .eq('id', jogador.id)
      .select(CAMPOS_JOGADOR)
      .maybeSingle<Jogador>()
    if (atualizado) jogador = atualizado
  }

  /* --------------------------------------------------------- limite de uso
     Freio contra alguém varrendo a lista de e-mails da empresa: dez sessões
     por hora por pessoa. Um humano trocando de celular não chega perto. */
  const umaHoraAtras = new Date(Date.now() - 3_600_000).toISOString()
  const { count } = await sb
    .from('sessoes')
    .select('token_hash', { count: 'exact', head: true })
    .eq('jogador', jogador.id)
    .gte('criado_em', umaHoraAtras)

  if ((count ?? 0) >= MAX_ENTRADAS_POR_HORA) {
    return erro('muitas-tentativas', 'Muitas entradas seguidas. Espere alguns minutos e tente de novo.', 429)
  }

  /* --------------------------------------------------------------- sessão */
  const token = novoToken()
  const expira = new Date(Date.now() + DIAS_DE_SESSAO * 86_400_000).toISOString()

  const { error: erroSessao } = await sb.from('sessoes').insert({
    token_hash: await hashDoToken(token),
    jogador: jogador.id,
    expira_em: expira,
  })
  if (erroSessao) return erro('desconhecido', 'Não conseguimos abrir sua sessão.', 500)

  // Faxina oportunista: uma vez a cada ~20 entradas, sem travar a resposta.
  if (Math.random() < 0.05) void sb.rpc('limpar_sessoes')

  const { data: progresso } = await sb
    .from('progresso')
    .select('missao, tarefa, pontos, detalhe')
    .eq('jogador', jogador.id)

  return responder({ token, jogador, progresso: progresso ?? [] })
})
