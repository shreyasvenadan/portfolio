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
import Character from './components/Character'
import { profile } from './data/content'
import { watchFocus } from './lib/focus'
import { watchSections } from './lib/sections'
import { watchWorld } from './lib/world'

const year = new Date().getFullYear()

export default function App() {
  useEffect(watchSections, [])
  useEffect(watchWorld, [])
  useEffect(watchFocus, [])

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
      <Character />
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
