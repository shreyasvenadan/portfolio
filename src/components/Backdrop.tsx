import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { isNight } from '../lib/night'
import { prefersReducedMotion, sectionProgress } from '../lib/sections'
import { wy } from '../lib/world'
import World3D, { type WorldHandle } from '../world/World3D'

// The world behind the page: an island at the surface, then the ocean below,
// getting darker with depth, with each section in its own depth zone
// (src/lib/world.ts). It's 3D (World3D); without WebGL, the drawn version.
const Flat = lazy(() => import('../world/Flat'))

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

// Behind the 3D world while it loads: the sky's colours, then the water's.
const PLACEHOLDER = `linear-gradient(to bottom,
  #f0a865 0, #fbe2b4 ${wy(70)}, #35a2b1 ${wy(100)}, #1f7497 ${wy(170)}, #16507c ${wy(250)},
  #0d2d52 ${wy(340)}, #07162c ${wy(420)}, #040a16 ${wy(500)})`

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
  const [webgl] = useState(hasWebGL)
  const world = useRef<WorldHandle>(null)
  const still = useMemo(() => prefersReducedMotion(), [])

  useEffect(() => {
    // The world sits behind the page content, so clicks are hit-tested by
    // position, and the cursor shows what can be clicked.
    const ignore = (e: Event) => !!(e.target as Element).closest('a, button, dialog')
    const point = (e: MouseEvent) => {
      document.body.style.cursor = world.current?.over(e.clientX, e.clientY) ? 'var(--cursor-pointer)' : ''
    }
    const click = (e: MouseEvent) => {
      if (ignore(e)) return
      world.current?.click(e.clientX, e.clientY)
      point(e)
    }
    const hover = (e: PointerEvent) => {
      if (!ignore(e)) point(e)
    }
    if (webgl) {
      window.addEventListener('click', click)
      window.addEventListener('pointermove', hover)
    }

    let frame = 0
    let tone = -1
    let night = isNight() ? 1 : 0
    const tick = () => {
      const p = sectionProgress()
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
      window.removeEventListener('click', click)
      window.removeEventListener('pointermove', hover)
    }
  }, [webgl])

  if (!webgl)
    return (
      <Suspense>
        <Flat />
      </Suspense>
    )
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0" style={{ height: wy(500), background: PLACEHOLDER }} />
      <World3D ref={world} still={still} />
    </>
  )
}
