import { links, profile } from '../data/content'

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
)

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
    <path
      className="fill-current"
      d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z"
    />
    <path className="fill-ink transition group-hover:fill-accent" d="M9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  </svg>
)

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
      <a href="#top" className="font-display text-lg font-bold tracking-tight whitespace-nowrap md:text-xl">
        {profile.name}
      </a>
      <nav aria-label="Profiles" className="flex shrink-0 gap-2">
        <a
          href={links.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          title="GitHub"
          className="grid h-8 w-8 place-items-center rounded-full bg-ink/85 text-bone transition hover:bg-accent"
        >
          <GithubIcon />
        </a>
        <a
          href={links.youtube}
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
          title="YouTube"
          className="group grid h-8 w-8 place-items-center rounded-full bg-ink/85 text-bone transition hover:bg-accent"
        >
          <YoutubeIcon />
        </a>
      </nav>
    </header>
  )
}
