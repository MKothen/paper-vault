import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/paper-vault/", 
  optimizeDeps: {
    // Ensure pdfjs-dist is processed correctly by Vite's dev server
    include: ['pdfjs-dist'],
    esbuildOptions: {
      target: 'esnext' // Allow modern features
    }
  },
  build: {
    target: 'esnext' // Allow modern features
  }
})