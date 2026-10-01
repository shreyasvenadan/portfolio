import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://shreyasvenadan.github.io/portfolio/
  base: '/portfolio/',
  plugins: [react(), tailwindcss()],
  build: {
    // A second page, so /portfolio/resume/ works on GitHub Pages without a router.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        resume: fileURLToPath(new URL('resume/index.html', import.meta.url)),
      },
    },
  },
})
