import { experience } from '../data/content'
import Section from './Section'

export default function Experience() {
  return (
    <Section id="experience" title="Experience">
      <ol className="space-y-10 border-l border-zinc-200 dark:border-zinc-800">
        {experience.map((item) => (
          <li key={`${item.role}-${item.org}`} className="relative pl-8">
            <span className="absolute top-2 -left-[5px] h-2.5 w-2.5 rounded-full bg-accent" />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {item.role} <span className="text-accent">@ {item.org}</span>
              </h3>
              <span className="font-mono text-sm text-zinc-500">{item.period}</span>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-zinc-600 marker:text-zinc-400 dark:text-zinc-400">
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  )
}
