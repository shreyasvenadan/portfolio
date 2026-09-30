import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://shreyasvenadan.github.io/portfolio/
  base: '/portfolio/',
  plugins: [react(), tailwindcss()],
  // three.js is large; it loads in its own lazy chunk after the page renders.
  build: { chunkSizeWarningLimit: 1200 },
})
