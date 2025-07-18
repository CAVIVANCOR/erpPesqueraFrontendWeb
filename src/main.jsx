import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Importa los estilos de PrimeReact y su tema recomendado para que todos los componentes se visualicen correctamente
import './primereact-theme.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
