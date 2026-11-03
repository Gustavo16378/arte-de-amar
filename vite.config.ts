import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
    rollupOptions: {
      // o site e o painel da diretoria (/admin) saem do mesmo build
      input: {
        site: 'index.html',
        admin: 'admin.html',
      },
      output: {
        /*
         * Separa as bibliotecas do código do site. Elas quase não mudam, e
         * assim o cache do visitante sobrevive a cada publicação. De quebra,
         * o relatório do build mostra quanto é nosso e quanto é do GSAP.
         */
        manualChunks(id: string) {
          if (id.includes('node_modules/gsap')) return 'gsap'
          if (id.includes('node_modules/lenis')) return 'lenis'
          if (id.includes('node_modules/react')) return 'react'
          if (id.includes('node_modules/scheduler')) return 'react'
        },
      },
    },
  },
})
