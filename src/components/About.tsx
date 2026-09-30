import { profile } from '../data/content'
import Section from './Section'

export default function About() {
  return (
    <Section id="about" title="About">
      <div className="space-y-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        {profile.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <h3 className="mt-10 mb-4 text-sm font-medium tracking-wide text-zinc-500 uppercase">Tech I work with</h3>
      <ul className="flex flex-wrap gap-2">
        {profile.skills.map((skill) => (
          <li
            key={skill}
            className="rounded-md bg-zinc-100 px-3 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {skill}
          </li>
        ))}
      </ul>
    </Section>
  )
}
