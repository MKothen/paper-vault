import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/paper-vault/", 
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext' // Allow modern features
    }
  },
  build: {
    target: 'esnext' // Allow modern features
  }
})