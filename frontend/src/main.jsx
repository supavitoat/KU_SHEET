import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Disable non-error console logs globally only in production (keep console.error)
if (import.meta.env.PROD && typeof window !== 'undefined' && typeof console !== 'undefined') {
  ['log', 'info', 'debug', 'warn', 'trace'].forEach(fn => {
    try {
      console[fn] = () => {};
    } catch {
      // ignore
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
