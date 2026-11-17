import { projects } from '../data/content'
import ProjectCard from './ProjectCard'
import Section from './Section'

export default function Projects() {
  return (
    <Section id="projects" title="Projects">
      <ul className="space-y-12">
        {projects
          .filter((project) => !project.inExperience)
          .map((project) => (
            <ProjectCard key={project.title} project={project} className="border-t border-ink/15 pt-12" />
          ))}
      </ul>
    </Section>
  )
}
