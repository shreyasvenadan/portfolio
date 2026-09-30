import { lazy, Suspense, useEffect } from 'react'
import About from './components/About'
import Contact from './components/Contact'
import DepthGauge from './components/DepthGauge'
import Experience from './components/Experience'
import Grain from './components/Grain'
import Header from './components/Header'
import Hero from './components/Hero'
import Projects from './components/Projects'
import { profile } from './data/content'
import { watchSections } from './lib/sections'

const Scene = lazy(() => import('./scene/Scene'))
const year = new Date().getFullYear()

export default function App() {
  useEffect(watchSections, [])

  return (
    <>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>

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
