import { profile } from '../data/content'
import Section from './Section'

export default function About() {
  return (
    <Section id="about" title="About">
      <div className="space-y-6 text-xl leading-[1.7] text-ink/90">
        {profile.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <dl className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {Object.entries(profile.skills).map(([group, skills]) => (
          <div key={group}>
            <dt className="font-display text-lg font-semibold text-accent">{group}</dt>
            <dd className="mt-2 leading-relaxed text-muted">{skills.join(', ')}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
