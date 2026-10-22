import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { DISCOVERIES, foundDiscoveries, latestDiscovery, subscribeDiscoveries } from '../lib/discoveries'

// "discoveries 3/16" in the corner while the island's in view: how many of
// its secrets have been found (src/lib/discoveries.ts). Opens into the list,
// with a hint for each one still to find, and pops up a note as each is found.
// Fixed colours, like the speech balloon, so it reads the same day and night.
export default function Discoveries() {
  const found = useSyncExternalStore(subscribeDiscoveries, foundDiscoveries)
  const latest = useSyncExternalStore(subscribeDiscoveries, latestDiscovery)
  const [opened, setOpen] = useState(false)
  const [onIsland, setOnIsland] = useState(true)
  // When the last "found:" note was put away.
  const [dismissed, setDismissed] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const open = opened && onIsland
  const toast = latest && latest.at !== dismissed ? DISCOVERIES.find((d) => d.id === latest.id)!.name : null

  // Only while the island is in view: they're all up there.
  useEffect(() => {
    const check = () => setOnIsland(window.scrollY < window.innerHeight * 0.6)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])
  useEffect(() => {
    if (!latest) return
    const timer = window.setTimeout(() => setDismissed(latest.at), 3200)
    return () => window.clearTimeout(timer)
  }, [latest])

  // Closes on Escape or a click anywhere else.
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', key)
    window.addEventListener('pointerdown', away)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('pointerdown', away)
    }
  }, [open])

  return (
    <div
      ref={root}
      data-ui
      className={`fixed right-4 bottom-4 z-30 font-display text-[#141911] transition-opacity duration-300 md:right-6 md:bottom-6 ${onIsland ? '' : 'pointer-events-none opacity-0'}`}
    >
      {open && (
        <div
          id="discoveries-list"
          className="absolute right-0 bottom-full mb-3 w-72 rounded-2xl border-[3px] border-[#120d0a] bg-[#fffdf6] p-4 shadow-[4px_5px_0_rgb(18_13_10/0.18)]"
        >
          <p className="mb-2 text-lg">
            {found.size === DISCOVERIES.length ? 'You found them all!' : 'Things to find on the island'}
          </p>
          <ul className="max-h-[50svh] space-y-1 overflow-y-auto font-sans text-sm">
            {DISCOVERIES.map((d) =>
              found.has(d.id) ? (
                <li key={d.id} className="flex items-baseline gap-2">
                  <span aria-hidden className="text-[#2f7a44]">✓</span>
                  {d.name}
                </li>
              ) : (
                <li key={d.id} className="flex items-baseline gap-2 text-[#5c5a52] italic">
                  <span aria-hidden>?</span>
                  {d.hint}
                </li>
              ),
            )}
          </ul>
        </div>
      )}
      {toast && !open && (
        <p
          role="status"
          className="discovery-toast absolute right-0 bottom-full mb-3 rounded-xl border-[3px] border-[#120d0a] bg-[#fffdf6] px-3 py-1.5 text-base whitespace-nowrap shadow-[4px_5px_0_rgb(18_13_10/0.18)]"
        >
          found: {toast}
        </p>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="discoveries-list"
        onClick={() => setOpen(!open)}
        className="rounded-full border-[3px] border-[#120d0a] bg-[#fffdf6] px-4 py-1.5 text-base shadow-[4px_5px_0_rgb(18_13_10/0.18)] transition hover:-translate-y-0.5"
      >
        discoveries{' '}
        <span className="tabular-nums">
          {found.size}/{DISCOVERIES.length}
        </span>
      </button>
    </div>
  )
}
