// The SeaLens page: Shreyas diving and filming on the reef (scene3d/dive.ts),
// with the longer story of SeaLens beside him, or below him on phones.
import { useEffect, useRef } from 'react'
import { projects } from '../data/content'
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

export default function SeaLens() {
  const scene = useRef<HTMLCanvasElement>(null)
  const boxes = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!hasWebGL()) return
    const dive = createDive(scene.current!, boxes.current!, { still: prefersReducedMotion(), night: isNight() })
    return () => dive.dispose()
  }, [])

  return (
    <>
      <canvas ref={scene} className="dive-scene" aria-hidden />
      <canvas ref={boxes} className="dive-boxes" aria-hidden />
      <a href={`${import.meta.env.BASE_URL}#work`} className="dive-back font-display">
        ← back to the sea
      </a>

      <main className="dive-copy">
        <p className="dive-kicker font-display">Co-founder · Tech and marketing lead</p>
        <h1 className="dive-title font-display">{project.title}</h1>
        <p className="dive-lead">{project.description}</p>

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
          </section>
        ))}

        <section className="dive-section">
          <h2 className="dive-heading font-display">Built with</h2>
          <p>{project.tech.join(', ')}</p>
        </section>

        {(project.demo || project.repo) && (
          <div className="dive-links font-display">
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noreferrer">
                Visit {hostname(project.demo)}
              </a>
            )}
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noreferrer">
                View the code
              </a>
            )}
          </div>
        )}
      </main>
    </>
  )
}
