import { useEffect, useRef, useState } from 'react'
import { projects } from '../data/content'
import ProjectPanel from './ProjectPanel'
import Section from './Section'

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, '')
const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// The project whose panel the address points at (…/#sealens), if any.
const fromHash = () => projects.find((p) => p.details && `#${slug(p.title)}` === window.location.hash) ?? null

export default function Projects() {
  const [open, setOpen] = useState(fromHash)
  // Whether opening the panel added a history entry, so closing can step back
  // over it rather than leave a stale #sealens behind.
  const pushed = useRef(false)

  useEffect(() => {
    const sync = () => {
      pushed.current = false
      setOpen(fromHash())
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const show = (project: (typeof projects)[number]) => {
    history.pushState(null, '', `#${slug(project.title)}`)
    pushed.current = true
    setOpen(project)
  }

  const hide = () => {
    if (pushed.current) history.back()
    else history.replaceState(null, '', window.location.pathname + window.location.search)
    pushed.current = false
    setOpen(null)
  }

  return (
    <Section id="work" title="Work">
      <ul className="space-y-16">
        {projects.map((project) => (
          <li key={project.title} data-focus className="border-t border-ink/15 pt-8">
            <h3 className="font-display text-3xl font-bold tracking-tight">{project.title}</h3>
            <p className="mt-4 text-lg leading-[1.7] text-ink/85">{project.description}</p>
            <p className="mt-4 text-muted">{project.tech.join(', ')}</p>
            {(project.details || project.demo || project.repo) && (
              <div className="mt-5 flex flex-wrap justify-center gap-6 font-display">
                {project.details && (
                  <button type="button" onClick={() => show(project)} className="text-accent underline-offset-4 hover:underline">
                    More about {project.title} →
                  </button>
                )}
                {project.demo && (
                  <a href={project.demo} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
                    Visit {hostname(project.demo)}
                  </a>
                )}
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
                    View the code
                  </a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {open && <ProjectPanel key={open.title} project={open} onClose={hide} />}
    </Section>
  )
}
