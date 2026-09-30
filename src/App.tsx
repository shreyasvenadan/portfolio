import About from './components/About'
import Contact from './components/Contact'
import Experience from './components/Experience'
import Hero from './components/Hero'
import Nav from './components/Nav'
import Projects from './components/Projects'
import { profile } from './data/content'

const year = new Date().getFullYear()

export default function App() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6">
        <Hero />
        <About />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <footer className="py-10 text-center font-mono text-xs text-zinc-500">
        © {year} {profile.name} · Built with React &amp; Vite
      </footer>
    </>
  )
}
