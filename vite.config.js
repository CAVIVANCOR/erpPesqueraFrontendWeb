import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000,
    // Eliminar manualChunks - dejar que Vite lo maneje automáticamente
  },
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})