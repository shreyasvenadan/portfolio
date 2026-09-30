import { projects } from '../data/content'
import Section from './Section'

export default function Projects() {
  return (
    <Section id="projects" title="Projects">
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.title}
            className="flex flex-col rounded-xl border border-zinc-200 p-6 transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg dark:border-zinc-800"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{project.title}</h3>
            <p className="mt-2 flex-1 leading-relaxed text-zinc-600 dark:text-zinc-400">{project.description}</p>
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-zinc-500">
              {project.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="mt-5 flex gap-4 text-sm font-medium">
              {project.repo && (
                <a href={project.repo} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  Code →
                </a>
              )}
              {project.demo && (
                <a href={project.demo} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  Live demo →
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
