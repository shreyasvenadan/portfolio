import { links } from '../data/content'
import Section from './Section'

export default function Contact() {
  return (
    <Section id="contact" title="Contact">
      <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        I’m open to new opportunities and always happy to chat. The best way to reach me is by email.
      </p>
      <a
        href={`mailto:${links.email}`}
        className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        Say hello
      </a>
      <div className="mt-8 flex gap-6 text-sm text-zinc-500">
        <a href={links.github} target="_blank" rel="noreferrer" className="hover:text-accent">
          GitHub
        </a>
        <a href={links.linkedin} target="_blank" rel="noreferrer" className="hover:text-accent">
          LinkedIn
        </a>
      </div>
    </Section>
  )
}
