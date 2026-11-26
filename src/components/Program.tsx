// A page for one program: /portfolio/rmit/ (RMIT University),
// /portfolio/academy/ (the Apple Developer Academy @ BINUS) or
// /portfolio/institute/ (the Apple Developer Institute for Entrepreneurship). Built on the SeaLens page's layout (.dive-*): its
// 3D scene fills the window (scene3d/program.ts: Swanston Street, the
// Academy's reception or the Institute's graduation room), with the story beside it, or below it on phones.
import { useEffect, useRef, useState } from 'react'
import { programs, type Program as ProgramData } from '../data/apple'
import NightSwitch, { useNight } from './NightSwitch'
import { prefersReducedMotion } from '../lib/sections'
import { createProgramScene } from '../scene3d/program'
import { slug } from './ProjectCard'
import Grain from './Grain'
import PhotoViewer, { type ViewerPhoto } from './PhotoViewer'

const base = import.meta.env.BASE_URL

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

// Back to the main page. Come from there, it's a step back in history, so
// the browser puts them back exactly where they were.
function backToSea(e: React.MouseEvent) {
  const home = new URL(base, window.location.href)
  const from = document.referrer && new URL(document.referrer)
  if (from && from.origin === home.origin && from.pathname === home.pathname && history.length > 1) {
    e.preventDefault()
    history.back()
  }
}

// A slight, steady tilt for each polaroid, as on the football page.
const tilt = (i: number) => [-2.4, 1.8, -1.2, 2.6, -2, 1.1, -2.8][i % 7]

// A section's photos as taped polaroids that open into the viewer. Two sit
// side by side, each column as wide as its photo's shape so they come out the
// same height; more are dealt into two columns, each to whichever is shorter.
function Photos({ photos }: { photos: ViewerPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const polaroid = (p: ViewerPhoto, i: number) => (
    <button
      key={p.full}
      type="button"
      className="polaroid"
      onClick={() => setOpen(i)}
      aria-label={`Open photo: ${p.caption}`}
      style={{ '--tilt': `${tilt(i)}deg` } as React.CSSProperties}
    >
      <span className="polaroid-tape" aria-hidden />
      <span className="polaroid-photo" style={{ aspectRatio: String(p.ratio) }}>
        <img src={p.thumb} alt={p.alt ?? p.caption} loading="lazy" decoding="async" />
      </span>
      <span className="polaroid-caption font-display">{p.caption}</span>
    </button>
  )
  let wall
  if (photos.length <= 2) {
    wall = (
      <div className="pitch-wall apple-photos" style={{ '--columns': photos.map((p) => `${p.ratio}fr`).join(' ') } as React.CSSProperties}>
        {photos.map(polaroid)}
      </div>
    )
  } else {
    const cols: { p: ViewerPhoto; i: number }[][] = [[], []]
    const height = [0, 0]
    photos.forEach((p, i) => {
      const c = height[0] <= height[1] ? 0 : 1
      cols[c].push({ p, i })
      height[c] += 1 / p.ratio
    })
    wall = (
      <div className="pitch-wall apple-photos" style={{ '--columns': '1fr 1fr' } as React.CSSProperties}>
        {cols.map((col, c) => (
          <div key={c} className="apple-photo-column">
            {col.map(({ p, i }) => polaroid(p, i))}
          </div>
        ))}
      </div>
    )
  }
  return (
    <>
      {wall}
      {open !== null && <PhotoViewer items={photos} index={open} setIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  )
}

// How long the scene takes to turn from day to night, or back, in ms.
const FADE = 3500

export default function Program({ id }: { id: ProgramData['id'] }) {
  // The pages before and after this one, in the order they happened.
  const at = programs.findIndex((p) => p.id === id)
  const program = programs[at]
  const before = programs[at - 1]
  const next = programs[at + 1]
  const holder = useRef<HTMLDivElement>(null)
  // Only RMIT's street is outdoors; the Academy and the Institute are rooms,
  // the same by day or night, so they're always lit as by day and have no
  // switch.
  const outdoors = id === 'rmit'
  const nightOut = useNight()
  const night = outdoors && nightOut
  // The scene's canvases: usually one, but two for a moment when switching
  // between day and night, the new one fading in over the old.
  const layers = useRef<{ drop: () => void; time: () => number }[]>([])

  useEffect(
    () => () => {
      layers.current.forEach((layer) => layer.drop())
      layers.current = []
    },
    [],
  )

  useEffect(() => {
    if (!hasWebGL()) return
    const canvas = document.createElement('canvas')
    canvas.className = 'apple-canvas'
    const under = layers.current
    const fading = under.length > 0 && !prefersReducedMotion()
    if (fading) canvas.style.opacity = '0'
    holder.current!.append(canvas)
    // Picking up where the one underneath had got to, so only the light
    // changes as it fades in.
    const scene = createProgramScene(canvas, { kind: id, still: prefersReducedMotion(), night, from: under.at(-1)?.time() ?? 0 })
    let timer = 0
    let dropped = false
    const layer = {
      time: scene.time,
      drop: () => {
        if (dropped) return
        dropped = true
        clearTimeout(timer)
        scene.dispose()
        canvas.remove()
      },
    }
    layers.current = [...under, layer]
    const clearUnder = () => {
      under.forEach((old) => old.drop())
      layers.current = layers.current.filter((l) => !under.includes(l))
    }
    if (!fading) clearUnder()
    else {
      // Day turns to night (or back) slowly, like dusk coming on.
      canvas.getBoundingClientRect()
      canvas.style.transition = `opacity ${FADE}ms ease-in-out`
      canvas.style.opacity = '1'
      timer = window.setTimeout(clearUnder, FADE)
    }
  }, [id, night])

  return (
    <>
      {/* The backdrop's colours show until the scene draws, or without WebGL. */}
      <div className={`apple-scene apple-scene-${id}`} aria-hidden />
      <div ref={holder} aria-hidden />
      <a href={`${base}#experience`} onClick={backToSea} className={`dive-back apple-back-${id} font-display`}>
        ← back to the sea
      </a>
      {outdoors && <NightSwitch />}

      <main className="dive-copy">
        <img src={program.logo} alt="" className="apple-logo" />
        <p className="dive-kicker font-display">
          {program.role} · {program.location} · {program.period}
        </p>
        <h1 className="apple-name font-display">{program.name}</h1>
        <p className="dive-lead">{program.lead}</p>

        <div className="dive-sections">
          {program.sections.map((section) => (
            <section key={section.heading} className="dive-section">
              <h2 className="dive-heading font-display">{section.heading}</h2>
              {section.body && <p>{section.body}</p>}
              {section.points && (
                <ul className="dive-points">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              {section.photos && <Photos photos={section.photos} />}
            </section>
          ))}

          {program.posts && program.posts.length > 0 && (
          <section className="dive-section">
            <h2 className="dive-heading font-display">On LinkedIn</h2>
            <ul className="dive-points">
              {program.posts.map((post) => (
                <li key={post.href}>
                  <a href={post.href} target="_blank" rel="noreferrer" className="dive-link">
                    {post.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
          )}
        </div>

        <div className="dive-links font-display">
          {before && <a href={`${base}${before.id}/`}>Before this: {before.short} →</a>}
          {next && <a href={`${base}${next.id}/`}>Next: {next.short} →</a>}
          {program.seaLens && <a href={`${base}${slug('SeaLens')}/`}>More about SeaLens →</a>}
        </div>
      </main>
      <Grain />
    </>
  )
}
