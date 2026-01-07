// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/paper-vault/", 
  build: {
    target: 'esnext'
  },
  // FIX: This forces Vite to process react-window correctly for named imports
  optimizeDeps: {
    include: ['react-window']
  }
})