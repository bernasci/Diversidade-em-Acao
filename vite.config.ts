import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    open: true,
    watch: {
      /* Este projeto vive dentro de uma pasta do OneDrive. Quando o OneDrive
         baixa um "arquivo sob demanda" que estava só na nuvem, ele o mantém
         travado por um instante — e o watcher do Vite morre com EBUSY,
         derrubando o servidor inteiro. Já aconteceu com três .skill largados
         na raiz.

         Nada fora de `src/`, `index.html` e dos arquivos de configuração
         precisa ser observado, então é barato ignorar o resto. */
      ignored: ['**/*.skill', '**/.git/**', '**/dist/**', '**/node_modules/**', '**/*.csv', '**/*.xlsx'],
    },
  },
  build: {
    target: 'es2020',
    // Um chunk por mini-game: quem abre a Missão 1 no 4G não baixa o
    // quebra-cabeça da Missão 3. São 5 telas pesadas que quase nunca
    // aparecem juntas.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/jogos/')) return 'jogos'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
