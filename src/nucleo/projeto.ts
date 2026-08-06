/* ==========================================================================
   projeto.ts — a que banco este app se conecta.

   POR QUE ESTES VALORES ESTÃO NO CÓDIGO, e não só em variável de ambiente:

   Os dois são públicos por construção. A URL é o endereço do projeto, e a
   anon key é uma chave que não abre nada — todas as tabelas têm RLS ligado e
   NENHUMA policy (ver `supabase/migrations/003_seguranca.sql`), então com ela
   na mão o máximo que se consegue é ler a view do ranking, que já é pública
   de propósito. Quem grava qualquer coisa é a Edge Function, com a
   service_role, e essa nunca sai do servidor.

   Qualquer pessoa com o DevTools aberto veria estes dois valores de qualquer
   forma: variável `VITE_*` é substituída no momento do build e vai inteira
   para dentro do JavaScript que o navegador baixa. Guardá-los em painel de
   hospedagem dá a sensação de segredo sem entregar nenhum.

   O que se ganha deixando aqui: o app funciona ao clonar e ao publicar, sem
   configuração de ambiente em lugar nenhum. É a mesma decisão do CRM DOME
   (`index.html:503`).

   O `.env` continua funcionando e TEM PRIORIDADE sobre isto — é assim que se
   aponta o app para um banco de homologação sem tocar no código.

   O QUE NUNCA PODE ENTRAR AQUI: a service_role key. Ela ignora RLS e é a
   única credencial de verdade do sistema. Vive no `.env` (fora do Git) e nas
   Edge Functions.
   ========================================================================== */

export const SUPABASE_URL_PADRAO = 'https://ngputsdhyxomawogeool.supabase.co'

export const SUPABASE_ANON_PADRAO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncHV0c2RoeXhvbWF3b2dlb29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzAyMzAsImV4cCI6MjEwMTYwNjIzMH0.nfXb-oxF0dfK6-ZHURRyjp6_2WeswyEdXbd233o1G9Y'
