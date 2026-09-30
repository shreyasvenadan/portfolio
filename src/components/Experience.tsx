import { experience } from '../data/content'
import Section from './Section'

export default function Experience() {
  return (
    <Section id="experience" title="Experience">
      <ol className="space-y-14">
        {experience.map((item) => (
          <li key={`${item.role}-${item.org}`} className="grid gap-2 md:grid-cols-[9rem_1fr] md:gap-8">
            <p className="font-display text-muted tabular-nums">{item.period}</p>
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight">{item.org}</h3>
              <p className="mt-1 text-lg text-ink/85">{item.role}</p>
              {item.location && <p className="text-muted">{item.location}</p>}
              {item.points.length > 0 && (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-lg leading-relaxed text-ink/85 marker:text-accent">
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
