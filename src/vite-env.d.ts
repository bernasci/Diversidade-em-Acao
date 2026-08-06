/// <reference types="vite/client" />

/* Arquivo global (sem import/export de propósito): declarar um módulo aqui
   faria as interfaces abaixo deixarem de valer para o projeto inteiro. */

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
