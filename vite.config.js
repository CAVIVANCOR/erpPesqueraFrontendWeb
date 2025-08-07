import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acceso desde cualquier IP
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app'
    ], // Permite ngrok y localhost específicamente  ngrok config add-authtoken 2qOwzneoBrKTL8b210332fP2KzN_5vc7sa7csfpPyCEfWztwc
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})