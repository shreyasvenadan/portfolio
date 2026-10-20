import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SeaLens from './components/SeaLens.tsx'
import { restoreNight } from './lib/night'

restoreNight()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SeaLens />
  </StrictMode>,
)
