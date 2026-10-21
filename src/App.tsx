import { useEffect } from 'react'
import About from './components/About'
import Backdrop from './components/Backdrop'
import Contact from './components/Contact'
import DepthGauge from './components/DepthGauge'
import Experience from './components/Experience'
import Grain from './components/Grain'
import Header from './components/Header'
import Hero from './components/Hero'
import Projects from './components/Projects'
import { profile } from './data/content'
import { watchFocus } from './lib/focus'
import { watchSections } from './lib/sections'
import { watchWorld } from './lib/world'

const year = new Date().getFullYear()

export default function App() {
  useEffect(watchSections, [])
  useEffect(watchWorld, [])
  useEffect(watchFocus, [])
  // Arriving at a #section (e.g. "back to the sea" from a project's page),
  // go there. The browser looks before React has drawn it, finds nothing,
  // and stays at the top.
  useEffect(() => {
    document.getElementById(location.hash.slice(1))?.scrollIntoView()
  }, [])
  // Coming back (the back button, or "back to the sea"), pick up where they
  // left off. Safari reloads the page rather than keeping it, and puts the
  // scroll back before React has drawn anything, so it lands at the top;
  // leaving, the page notes the spot on its history entry instead.
  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const y = history.state?.scrollY
    if (nav?.type === 'back_forward' && typeof y === 'number') window.scrollTo(0, y)
    const note = () => history.replaceState({ ...history.state, scrollY: window.scrollY }, '')
    window.addEventListener('pagehide', note)
    return () => window.removeEventListener('pagehide', note)
  }, [])

  return (
    <>
      <Backdrop />

      {/* Roughens heading edges like ink bleeding into cheap paper. */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id="rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
      </svg>
      <Grain />

      <Header />
      <DepthGauge />

      <main className="halo relative z-10 px-5 md:px-10">
        <div className="text-center">
          <Hero />
        </div>
        <div className="mx-auto max-w-[42rem] text-center">
          <About />
          <Projects />
          <Experience />
          <Contact />
        </div>
      </main>
      <footer className="halo relative z-10 px-5 pb-10 text-center text-sm text-muted md:px-10">
        © {year} {profile.name}
      </footer>
    </>
  )
}
