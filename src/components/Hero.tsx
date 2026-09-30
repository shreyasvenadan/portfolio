import { links, profile } from '../data/content'

export default function Hero() {
  return (
    <section id="top" className="flex min-h-[80vh] flex-col justify-center py-20">
      <p className="mb-4 font-mono text-sm text-accent">Hi, my name is</p>
      <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
        {profile.name}
      </h1>
      <p className="mt-3 text-2xl font-medium text-zinc-500 sm:text-3xl dark:text-zinc-400">{profile.role}</p>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">{profile.tagline}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href="#projects"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          View my work
        </a>
        {profile.resumeUrl && (
          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent dark:border-zinc-700"
          >
            Résumé
          </a>
        )}
        <a
          href={links.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent dark:border-zinc-700"
        >
          GitHub
        </a>
      </div>
    </section>
  )
}
