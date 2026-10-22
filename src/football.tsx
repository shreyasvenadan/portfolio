import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Football from './components/Football.tsx'
import { restoreNight } from './lib/night'
import { ballOff } from './lib/kick'

restoreNight()
ballOff()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Football />
  </StrictMode>,
)
