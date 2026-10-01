import { useEffect, useMemo, useRef } from 'react'
import { isNight, toggleNight } from '../lib/night'
import { prefersReducedMotion, sectionProgress } from '../lib/sections'
import { dropCoconut } from '../lib/coconut'
import { shipHorn } from '../lib/sound'
import { zap } from '../lib/zap'
import Surface from '../world/Surface'
import Sealife from '../world/Sealife'
import Underwater from '../world/Underwater'

// The world behind the page: an island at the surface, then the ocean below,
// getting darker with depth. It is five screens tall and scrolls one screen
// per page section, so each section sits in its own depth zone.
const WATER = `linear-gradient(to bottom,
  transparent 0, transparent 100vh,
  #2b93a6 100vh, #1f7497 170vh, #16507c 250vh,
  #0d2d52 340vh, #07162c 420vh, #040a16 500vh)`

// Text colours at the surface and in the deep; the page fades from one to the
// other as it goes underwater so copy stays readable.
const SURFACE_TONE = { ink: '#141911', muted: '#2f382a', accent: '#5a1f2e', bone: '#f4efe0', halo: [227, 215, 191] }
const DEEP_TONE = { ink: '#eef6f4', muted: '#b9d3d8', accent: '#ffab7a', bone: '#0c2233', halo: [6, 24, 44] }

const mix = (a: string, b: string, t: number) => {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`
}

function applyTone(t: number) {
  const root = document.documentElement.style
  for (const key of ['ink', 'muted', 'accent', 'bone'] as const) root.setProperty(`--color-${key}`, mix(SURFACE_TONE[key], DEEP_TONE[key], t))
  root.setProperty('--halo', SURFACE_TONE.halo.map((v, i) => Math.round(v + (DEEP_TONE.halo[i] - v) * t)).join(' '))
}

export default function Backdrop() {
  const world = useRef<HTMLDivElement>(null)
  const front = useRef<HTMLDivElement>(null)
  const surface = useRef<SVGSVGElement>(null)
  const animate = useMemo(() => !prefersReducedMotion(), [])

  useEffect(() => {
    // --s: screen pixels per unit of the 1600×900 surface drawing, so the
    // island's underwater base can match its width at any screen size.
    const size = () => world.current?.style.setProperty('--s', String(Math.max(window.innerWidth / 1600, window.innerHeight / 900)))
    size()
    window.addEventListener('resize', size)

    // The sun and moon sit behind the page content, so clicks are hit-tested by
    // position: clicking whichever one is up switches between day and night.
    const overSky = (x: number, y: number) => {
      const body = surface.current?.querySelector(`[data-sky="${isNight() ? 'moon' : 'sun'}"]`)
      if (!body) return false
      const r = body.getBoundingClientRect()
      return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < r.width / 2 + 12
    }
    // Jellyfish are hit-tested the same way; touching one (tentacles too) stings.
    const overJelly = (x: number, y: number) => {
      for (const jelly of world.current?.querySelectorAll('[data-jelly]') ?? []) {
        const r = jelly.getBoundingClientRect()
        if (x > r.left - 4 && x < r.right + 4 && y > r.top - 4 && y < r.bottom + 4) return jelly
      }
    }
    // ...as are the coconuts on the palms and the shipwreck.
    const overCoconut = (x: number, y: number) => {
      for (const nut of surface.current?.querySelectorAll<SVGCircleElement>('[data-coconut]:not([data-fallen])') ?? []) {
        const r = nut.getBoundingClientRect()
        if (Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < r.width / 2 + 6) return nut
      }
    }
    const overShip = (x: number, y: number) => {
      const ship = world.current?.querySelector('[data-ship]')
      const r = ship?.getBoundingClientRect()
      return r && x > r.left && x < r.right && y > r.top + r.height * 0.15 && y < r.bottom ? ship : undefined
    }
    const click = (e: MouseEvent) => {
      if ((e.target as Element).closest('a, button')) return
      const [x, y] = [e.clientX, e.clientY]
      const jelly = overJelly(x, y)
      const nut = overCoconut(x, y)
      const ship = overShip(x, y)
      if (jelly) zap(x, y, jelly.getAttribute('data-jelly')!, jelly)
      else if (nut) dropCoconut(nut)
      else if (ship) {
        shipHorn()
        ship.classList.remove('honk')
        void ship.getBoundingClientRect()
        ship.classList.add('honk')
      } else if (overSky(x, y)) toggleNight()
    }
    const hover = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button')) return
      const [x, y] = [e.clientX, e.clientY]
      document.body.style.cursor = overJelly(x, y) || overCoconut(x, y) || overShip(x, y) || overSky(x, y) ? 'pointer' : ''
    }
    window.addEventListener('click', click)
    window.addEventListener('pointermove', hover)

    let frame = 0
    let paused = false
    let tone = -1
    let night = isNight() ? 1 : 0
    const tick = () => {
      const p = sectionProgress()
      // Snapped to whole device pixels so the surface and underwater layers meet
      // exactly; a fractional offset leaves a hairline between their night tints.
      const dpr = window.devicePixelRatio || 1
      const shift = `translate3d(0, ${Math.round(-p * window.innerHeight * dpr) / dpr}px, 0)`
      if (world.current) world.current.style.transform = shift
      if (front.current) front.current.style.transform = shift

      // Stop the surface animations once the island has scrolled out of view.
      const offscreen = p > 1.1
      if (surface.current && offscreen !== paused) {
        if (offscreen) surface.current.pauseAnimations()
        else surface.current.unpauseAnimations()
        paused = offscreen
      }

      // Light text once underwater, or all the way up at night (eased when toggled).
      night += ((isNight() ? 1 : 0) - night) * 0.08
      const depth = Math.min(1, Math.max(0, (p - 0.4) / 0.5))
      const next = Math.round(Math.max(depth, night) * 40) / 40
      if (next !== tone) {
        tone = next
        applyTone(tone)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', size)
      window.removeEventListener('click', click)
      window.removeEventListener('pointermove', hover)
    }
  }, [])

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div ref={world} className="absolute inset-x-0 top-0 h-[500vh] will-change-transform" style={{ background: WATER }}>
          <Surface ref={surface} animate={animate} />
          <Underwater />
          {/* At night the shallow water darkens too; the deep is dark already. */}
          <div
            className="night-tint absolute inset-x-0"
            style={{ top: '100vh', height: '250vh', background: 'linear-gradient(to bottom, #27346e, transparent)' }}
          />
        </div>
      </div>
      {/* Everything that swims sits above the page text and scrolls with the world. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[15] overflow-hidden">
        <div ref={front} className="swimmers absolute inset-x-0 top-0 h-[500vh] will-change-transform">
          <Sealife />
        </div>
      </div>
    </>
  )
}
