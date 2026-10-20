// The longer story of a project, in a parchment panel that slides in from
// the right (up from the bottom on phones) over the scene. The page behind
// holds still while it's open; Esc, the close button or a click outside
// slides it away again.
import { useEffect, useRef, useState } from 'react'
import type { Project } from '../data/content'
import { prefersReducedMotion } from '../lib/sections'
import { lenis } from '../lib/smoothScroll'

type Props = {
  project: Project
  onClose: () => void
}

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, '')

export default function ProjectPanel({ project, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    dialog.current?.showModal()
    lenis?.stop()
    return () => lenis?.start()
  }, [])

  const close = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, prefersReducedMotion() ? 0 : 260)
  }

  return (
    <dialog
      ref={dialog}
      className={`panel${closing ? ' closing' : ''}`}
      aria-labelledby="panel-title"
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      // A click on the dialog itself, not its contents, is a click on the backdrop.
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="panel-paper">
        <button type="button" className="panel-close" aria-label="Close" onClick={close}>
          ×
        </button>
        <h2 id="panel-title" className="panel-title font-display">
          {project.title}
        </h2>
        <p className="panel-lead">{project.description}</p>

        {project.details?.map((section) => (
          <section key={section.heading} className="panel-section">
            <h3 className="panel-heading font-display">{section.heading}</h3>
            {section.body && <p>{section.body}</p>}
            {section.points && (
              <ul className="panel-points">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="panel-section">
          <h3 className="panel-heading font-display">Built with</h3>
          <p>{project.tech.join(', ')}</p>
        </section>

        {(project.demo || project.repo) && (
          <div className="panel-links font-display">
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
      </div>
    </dialog>
  )
}
