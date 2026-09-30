import { links, profile } from '../data/content'

export default function Hero() {
  const [first, ...rest] = profile.name.split(' ')
  return (
    <section id="top" className="flex min-h-svh flex-col justify-end pt-28 pb-16 md:pb-24">
      <h1 className="display text-[clamp(4.5rem,15vw,11rem)] font-extrabold">
        {first}
        <br />
        {rest.join(' ')}
      </h1>
      <p className="mt-8 max-w-md text-xl leading-relaxed text-ink/85 md:text-2xl">{profile.tagline}</p>
      <div className="mt-10 flex flex-wrap gap-3 font-display">
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
