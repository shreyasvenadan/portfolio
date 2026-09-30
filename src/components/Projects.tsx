import { projects } from '../data/content'
import Section from './Section'

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, '')

export default function Projects() {
  return (
    <Section id="work" title="Work">
      <ul className="space-y-16">
        {projects.map((project) => (
          <li key={project.title} className="border-t border-foam/15 pt-8">
            <h3 className="font-display text-3xl font-bold tracking-tight">{project.title}</h3>
            <p className="mt-4 text-lg leading-[1.7] text-foam/85">{project.description}</p>
            <p className="mt-4 text-silt">{project.tech.join(', ')}</p>
            {(project.demo || project.repo) && (
              <div className="mt-5 flex flex-wrap gap-6 font-display">
                {project.demo && (
                  <a href={project.demo} target="_blank" rel="noreferrer" className="text-glow underline-offset-4 hover:underline">
                    Visit {hostname(project.demo)}
                  </a>
                )}
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer" className="text-glow underline-offset-4 hover:underline">
                    View the code
                  </a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}
