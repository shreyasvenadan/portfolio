import { profile } from '../data/content'

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-svh flex-col justify-end pt-28 pb-10 md:pb-14">
      {/* Kept for screen readers and search engines; the name shows in the header. */}
      <h1 className="sr-only">{profile.name}</h1>
      {/* The tagline, said by the character standing on the island
          (Character.tsx), in a comic-strip speech balloon. */}
      <p className="balloon">
        {profile.tagline}
        <svg aria-hidden viewBox="0 0 60 60" className="balloon-tail">
          <path d="M4 0 Q20 30 52 54 Q28 30 30 0" />
        </svg>
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3 font-display [text-shadow:none]">
        <a
          href="#work"
          className="flex flex-col items-center gap-1 text-lg text-ink/80 transition hover:text-accent"
        >
          scroll to dive
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-6 w-6 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round] motion-safe:animate-[nudge_1.6s_ease-in-out_infinite]"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
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
