import { lazy, Suspense, useEffect } from 'react'
import About from './components/About'
import Contact from './components/Contact'
import DepthGauge from './components/DepthGauge'
import Experience from './components/Experience'
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
      {/* Darken the text side of the screen so copy stays readable over the scene. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-abyss/55 md:bg-transparent md:bg-linear-to-r md:from-abyss/85 md:via-abyss/45 md:to-transparent"
      />

      <Header />
      <DepthGauge />

      <main className="relative z-10 px-5 md:px-10 lg:pl-60">
        <div className="max-w-[40rem]">
          <Hero />
          <About />
          <Projects />
          <Experience />
          <Contact />
        </div>
      </main>
      <footer className="relative z-10 px-5 pb-10 text-sm text-silt md:px-10 lg:pl-60">
        © {year} {profile.name}
      </footer>
    </>
  )
}
