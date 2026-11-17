import type { Project } from '../data/content'
import { lockOn } from '../lib/lockOn'

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, '')
// A project with a longer story has its own page, at /portfolio/<its name>/.
export const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const page = (title: string) => `${import.meta.env.BASE_URL}${slug(title)}/`

export default function ProjectCard({ project, className = '' }: { project: Project; className?: string }) {
  return (
    <li id={slug(project.title)} data-focus className={`scroll-mt-24 ${className}`}>
      {project.logo && <img src={project.logo} alt="" className="mx-auto mb-3 size-10 rounded-[0.6rem]" />}
      {project.period && <p className="mb-2 font-display text-muted tabular-nums">{project.period}</p>}
      <h3 className="font-display text-3xl font-bold tracking-tight">{project.title}</h3>
      {project.role && <p className="mt-1 text-lg text-ink/85">{project.role}</p>}
      {project.location && <p className="text-muted">{project.location}</p>}
      <p className="mt-4 text-lg leading-[1.7] text-ink/85">{project.description}</p>
      <p className="mt-4 text-muted">{project.tech.join(', ')}</p>
      {(project.details || project.demo || project.app || project.repo) && (
        <div className="mt-5 flex flex-wrap justify-center gap-6 font-display">
          {project.details && (
            <a
              href={page(project.title)}
              onClick={(e) => {
                // SeaLens locks on to the card and takes them there;
                // new-tab clicks just open.
                if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                e.preventDefault()
                lockOn(page(project.title), e.currentTarget.closest('li')!, project.title.toLowerCase())
              }}
              className="text-accent underline-offset-4 hover:underline"
            >
              More about {project.title} →
            </a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
              Visit {hostname(project.demo)}
            </a>
          )}
          {project.app && (
            <a href={project.app} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
              Mac App Store
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
  )
}
