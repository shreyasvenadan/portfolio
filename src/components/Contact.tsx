import { links } from '../data/content'

export default function Contact() {
  return (
    <section id="contact" className="flex min-h-svh flex-col items-center justify-end pt-28 pb-16">
      <h2 className="display text-5xl font-extrabold md:text-7xl">Get in touch</h2>
      <p data-focus className="mt-6 max-w-md text-xl leading-relaxed text-ink/85">
        I’m graduating in 2026 and looking for software engineering roles. Email is the fastest way to reach me.
      </p>
      <a
        href={`mailto:${links.email}`}
        className="mt-10 font-display text-2xl font-semibold break-all text-accent underline-offset-8 hover:underline md:text-4xl"
      >
        {links.email}
      </a>
      <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 font-display text-muted">
        <a href={`${import.meta.env.BASE_URL}resume/`} className="hover:text-ink">
          Resume
        </a>
        <a href={links.github} target="_blank" rel="noreferrer" className="hover:text-ink">
          GitHub
        </a>
        <a href={links.linkedin} target="_blank" rel="noreferrer" className="hover:text-ink">
          LinkedIn
        </a>
        <a href={links.youtube} target="_blank" rel="noreferrer" className="hover:text-ink">
          YouTube
        </a>
      </div>
    </section>
  )
}
