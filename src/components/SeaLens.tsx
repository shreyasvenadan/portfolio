// The SeaLens page: Shreyas diving and filming on the reef (scene3d/dive.ts),
// with the longer story of SeaLens beside him, or below him on phones.
import { useEffect, useRef } from 'react'
import { projects } from '../data/content'
import { pageReady } from '../lib/lockOn'
import { isNight } from '../lib/night'
import { prefersReducedMotion } from '../lib/sections'
import { createDive } from '../scene3d/dive'

const project = projects.find((p) => p.title === 'SeaLens')!
const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, '')

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

// Back to the main page. Come from there, it's a step back in history, so
// the browser puts them back exactly where they were; otherwise the link
// takes them to SeaLens in the work section.
function backToSea(e: React.MouseEvent) {
  const home = new URL(import.meta.env.BASE_URL, window.location.href)
  const from = document.referrer && new URL(document.referrer)
  if (from && from.origin === home.origin && from.pathname === home.pathname && history.length > 1) {
    e.preventDefault()
    history.back()
  }
}

// The website first, then the Mac app; at the top of the story and again at the end.
function Links() {
  return (
    <div className="dive-links font-display">
      {project.demo && (
        <a href={project.demo} target="_blank" rel="noreferrer">
          Visit {hostname(project.demo)}
        </a>
      )}
      {project.app && (
        <a href={project.app} target="_blank" rel="noreferrer">
          Get it on the Mac App Store
        </a>
      )}
      {project.repo && (
        <a href={project.repo} target="_blank" rel="noreferrer">
          View the code
        </a>
      )}
    </div>
  )
}

export default function SeaLens() {
  const scene = useRef<HTMLCanvasElement>(null)
  const boxes = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!hasWebGL()) return pageReady()
    const dive = createDive(scene.current!, boxes.current!, { still: prefersReducedMotion(), night: isNight(), onReady: pageReady })
    return () => dive.dispose()
  }, [])

  return (
    <>
      <canvas ref={scene} className="dive-scene" aria-hidden />
      <canvas ref={boxes} className="dive-boxes" aria-hidden />
      <a href={`${import.meta.env.BASE_URL}#sealens`} onClick={backToSea} className="dive-back font-display">
        ← back to the sea
      </a>

      <main className="dive-copy">
        <p className="dive-kicker font-display">Co-founder · Tech and marketing lead</p>
        <h1 className="dive-title font-display">
          {project.logo && <img src={project.logo} alt="" className="dive-logo" />}
          {project.title}
        </h1>
        <p className="dive-lead">{project.description}</p>
        <Links />

        {project.details?.map((section) => (
          <section key={section.heading} className="dive-section">
            <h2 className="dive-heading font-display">{section.heading}</h2>
            {section.body && <p>{section.body}</p>}
            {section.points && (
              <ul className="dive-points">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
            {section.links && (
              <ul className="dive-points">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noreferrer" className="dive-link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="dive-section">
          <h2 className="dive-heading font-display">Built with</h2>
          <p>{project.tech.join(', ')}</p>
        </section>

        <Links />
      </main>
    </>
  )
}
