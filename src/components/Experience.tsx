import { experience, projects } from '../data/content'
import ProjectCard from './ProjectCard'
import Section from './Section'

export default function Experience() {
  return (
    <Section id="experience" title="Experience">
      <ol className="space-y-12">
        {/* Projects that are also roles (SeaLens, MyKaleidoscope) lead the section, as their full card. */}
        {projects
          .filter((project) => project.inExperience)
          .map((project) => (
            <ProjectCard key={project.title} project={project} className="border-t border-ink/15 pt-12" />
          ))}
        {experience.map((item) => (
          <li key={`${item.role}-${item.org}`} data-focus className="border-t border-ink/15 pt-12">
            {item.logo && <img src={item.logo} alt="" className={`mx-auto mb-3 w-auto ${item.logoClass ?? 'h-10'}`} />}
            <p className="font-display text-muted tabular-nums">{item.period}</p>
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight">{item.org}</h3>
              <p className="mt-1 text-lg text-ink/85">{item.role}</p>
              {item.location && <p className="text-muted">{item.location}</p>}
              {item.points.length > 0 && (
                <ul className="mt-4 space-y-2 text-lg leading-relaxed text-ink/85">
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              {item.page && (
                <a href={item.page} className="mt-5 inline-block font-display text-accent underline-offset-4 hover:underline">
                  More about {item.org.startsWith('Apple Developer Academy') ? 'the Academy' : 'the Institute'} →
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
