import { experience } from '../data/content'
import Section from './Section'

export default function Experience() {
  return (
    <Section id="experience" title="Experience">
      <ol className="space-y-14">
        {experience.map((item) => (
          <li key={`${item.role}-${item.org}`} data-focus>
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
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
