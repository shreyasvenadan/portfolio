import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Program from './components/Program.tsx'
import { restoreNight } from './lib/night'

restoreNight()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Program id="rmit" />
  </StrictMode>,
)
