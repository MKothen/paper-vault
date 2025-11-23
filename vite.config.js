import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/paper-vault/',
  server: {
    hmr: {
      clientPort: 5173,
      protocol: 'ws',
      host: 'localhost'
    }
  }
})
