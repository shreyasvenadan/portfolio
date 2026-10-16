import { profile } from '../data/content'
import Section from './Section'

export default function About() {
  return (
    <Section id="about" title="About">
      <div className="space-y-6 text-xl leading-[1.7] text-ink/90">
        {profile.about.map((paragraph) => (
          <p key={paragraph} data-focus>
            {paragraph}
          </p>
        ))}
      </div>
      <dl className="mt-16 space-y-10">
        {Object.entries(profile.skills).map(([group, skills]) => (
          <div key={group} data-focus>
            <dt className="font-display text-2xl font-semibold text-accent">{group}</dt>
            <dd className="mt-2 text-xl leading-[1.7] text-muted">{skills.join(', ')}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
