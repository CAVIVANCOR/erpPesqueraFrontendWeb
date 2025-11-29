import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000, // Aumentar límite para evitar warnings
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separar node_modules en chunks específicos
          if (id.includes('node_modules')) {
            // PrimeReact en su propio chunk
            if (id.includes('primereact')) {
              return 'primereact';
            }
            // Chart.js y Quill en chunk separado
            if (id.includes('chart.js') || id.includes('quill')) {
              return 'charts-editors';
            }
            // React y librerías core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Axios y librerías de HTTP
            if (id.includes('axios')) {
              return 'vendor-http';
            }
            // Zustand y librerías de estado
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
            // Resto de node_modules
            return 'vendor-other';
          }
        }
      }
    }
  },
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})