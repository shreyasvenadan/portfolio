import { useState, useSyncExternalStore } from 'react'
import { links, profile } from '../data/content'
import { isNight, subscribeNight, toggleNight } from '../lib/night'

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-[1em] w-[1em] fill-current">
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </svg>
)

const SunIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-[1em] w-[1em] fill-current stroke-current" strokeWidth={2.2} strokeLinecap="round">
    <circle cx={12} cy={12} r={4.5} />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" fill="none" />
  </svg>
)

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
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
  const night = useSyncExternalStore(subscribeNight, isNight)
  // Right after a click the preview stays off until the pointer leaves, so it
  // doesn't flip straight back to suggesting the mode just left.
  const [justSwitched, setJustSwitched] = useState(false)
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
      {/* Clicking the name switches between day and night. Hovering previews the
          other mode: a night-blue pill with a moon by day, a sunset pill with a
          sun by night. */}
      <button
        type="button"
        onClick={() => {
          toggleNight()
          setJustSwitched(true)
        }}
        onPointerLeave={() => setJustSwitched(false)}
        onBlur={() => setJustSwitched(false)}
        aria-pressed={night}
        className={`group -mx-3 inline-flex cursor-pointer items-center rounded-full px-3 py-1 font-name text-lg font-bold tracking-tight whitespace-nowrap transition-colors duration-300 md:text-xl ${
          justSwitched
            ? ''
            : night
              ? 'hover:bg-[#f3b872] hover:text-[#4a2410] focus-visible:bg-[#f3b872] focus-visible:text-[#4a2410]'
              : 'hover:bg-[#27346e] hover:text-[#f4f1d8] focus-visible:bg-[#27346e] focus-visible:text-[#f4f1d8]'
        }`}
      >
        <span
          className={`inline-flex w-0 overflow-hidden opacity-0 transition-all duration-300 ${
            justSwitched ? '' : 'group-hover:mr-2 group-hover:w-[1em] group-hover:opacity-100 group-focus-visible:mr-2 group-focus-visible:w-[1em] group-focus-visible:opacity-100'
          }`}
        >
          {night ? <SunIcon /> : <MoonIcon />}
        </span>
        {profile.name}
      </button>
      <nav aria-label="Profiles" className="flex shrink-0 gap-2">
        <a
          href={`${import.meta.env.BASE_URL}resume/`}
          title="Resume"
          className="grid h-8 place-items-center rounded-full bg-ink/85 px-3 text-xs font-semibold tracking-wide text-bone transition hover:bg-accent"
        >
          resume
        </a>
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
          href={links.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          title="LinkedIn"
          className="grid h-8 w-8 place-items-center rounded-full bg-ink/85 text-bone transition hover:bg-accent"
        >
          <LinkedinIcon />
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
