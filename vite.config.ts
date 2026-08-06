import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5180, open: true },
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
