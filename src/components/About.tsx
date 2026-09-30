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
      <div className="mt-10 space-y-6">
        {Object.entries(profile.skills).map(([group, skills]) => (
          <div key={group}>
            <h3 className="mb-3 text-sm font-medium tracking-wide text-zinc-500 uppercase">{group}</h3>
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-md bg-zinc-100 px-3 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
