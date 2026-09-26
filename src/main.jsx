import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import performanceIcon from './assets/performance.png'

document.querySelector('link[rel="icon"]').href = performanceIcon

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
