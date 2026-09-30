import { links, profile } from '../data/content'

export default function Hero() {
  const [first, ...rest] = profile.name.split(' ')
  return (
    <section id="top" className="flex min-h-svh flex-col justify-end pt-28 pb-10 md:pb-14">
      <h1 className="display text-[clamp(2.5rem,9vw,7.5rem)] font-extrabold whitespace-nowrap">
        {first} {rest.join(' ')}
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-ink/85 md:text-xl">{profile.tagline}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3 font-display [text-shadow:none]">
        <a
          href="#work"
          className="rounded-full bg-accent px-6 py-3 font-semibold text-bone transition hover:bg-ink hover:text-bone"
        >
          See my work
        </a>
        <a
          href={links.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-ink/30 px-6 py-3 transition hover:border-accent hover:text-accent"
        >
          GitHub
        </a>
        {profile.resumeUrl && (
          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-ink/30 px-6 py-3 transition hover:border-accent hover:text-accent"
          >
            Résumé
          </a>
        )}
      </div>
    </section>
  )
}
