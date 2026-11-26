// The football page, opened by Shreyas kicking the ball off the island at
// the screen (src/lib/kick.ts). Like the SeaLens page: a 3D scene fills the
// window (scene3d/pitch.ts, him doing keepy-uppies at golden hour, click to
// shoot), with the story beside it, or below it on phones: the highlights
// video and a wall of polaroids that open into a viewer.
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, full, photos, thumb, video, type Category, type Photo } from '../data/football'
import NightSwitch, { useNight } from './NightSwitch'
import { prefersReducedMotion } from '../lib/sections'
import { createPitch, type Pitch, type PitchStats } from '../scene3d/pitch'
import Grain from './Grain'
import PhotoViewer from './PhotoViewer'

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

// Back to the island. Come from there, it's a step back in history, so the
// browser puts them back where they were.
function backToIsland(e: React.MouseEvent) {
  const home = new URL(import.meta.env.BASE_URL, window.location.href)
  const from = document.referrer && new URL(document.referrer)
  if (from && from.origin === home.origin && from.pathname === home.pathname && history.length > 1) {
    e.preventDefault()
    history.back()
  }
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.1-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
    </svg>
  )
}

function Highlights() {
  const player = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  return (
    <section className="dive-section">
      <h2 className="dive-heading font-display">highlights</h2>
      <p>Matchday footage. Sound on.</p>
      <div className="pitch-video">
        <video
          ref={player}
          src={video.src}
          poster={video.poster}
          controls={started}
          playsInline
          preload="metadata"
          onPlay={() => setStarted(true)}
        />
        {!started && (
          <button type="button" className="pitch-play" onClick={() => player.current?.play()} aria-label="Play highlights">
            <span className="pitch-play-button">
              <PlayIcon className="ml-1 h-8 w-8" />
            </span>
            <span className="pitch-play-time font-display">{video.length}</span>
          </button>
        )}
      </div>
    </section>
  )
}

type Filter = 'all' | Category

// A slight, steady tilt for each polaroid, so the wall looks pinned up by hand.
const tilt = (i: number) => [-2.4, 1.8, -1.2, 2.6, -2, 1.1, -2.8, 1.6, -1.5, 2.2, -0.9][i % 11]

// Deals the photos into two columns, each to whichever is shorter so far
// (by height at equal width), keeping each one's place in the list.
function columns(items: Photo[], n: number) {
  const cols: { photo: Photo; i: number }[][] = Array.from({ length: n }, () => [])
  const height: number[] = Array(n).fill(0)
  items.forEach((photo, i) => {
    const c = height.indexOf(Math.min(...height))
    cols[c].push({ photo, i })
    height[c] += 1 / photo.ratio
  })
  return cols
}

// How many columns of polaroids fit: two on phones and laptops, more when
// the panel is wide.
function useColumns(wall: React.RefObject<HTMLElement | null>) {
  const [n, setN] = useState(2)
  useEffect(() => {
    const el = wall.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setN(Math.max(2, Math.min(4, Math.floor(entry.contentRect.width / 280)))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [wall])
  return n
}

function Gallery({ onOpen, shown, filter, setFilter }: {
  onOpen: (i: number) => void
  shown: Photo[]
  filter: Filter
  setFilter: (f: Filter) => void
}) {
  const count = (f: Filter) => (f === 'all' ? photos.length : photos.filter((p) => p.category === f).length)
  const wall = useRef<HTMLDivElement>(null)
  const n = useColumns(wall)
  return (
    <section className="dive-section pitch-gallery">
      <h2 className="dive-heading font-display">on and off the pitch</h2>
      <p>Tap a photo to have a closer look.</p>
      <div className="pitch-chips font-display" role="group" aria-label="Filter photos">
        {(['all', ...categories] as Filter[]).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className="pitch-chip">
            {f} <span className="pitch-chip-count">{count(f)}</span>
          </button>
        ))}
      </div>
      {/* Two columns, each photo going to the shorter one, so the wall stays
          even and the photos drop in row by row, left then right. Keyed by
          filter so they drop back in on every change. */}
      <div ref={wall} className="pitch-wall" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {columns(shown, n).map((column, c) => (
          <ul key={`${filter}-${c}`}>
            {column.map(({ photo: p, i }) => (
              <li key={p.name} style={{ '--tilt': `${tilt(photos.indexOf(p))}deg`, animationDelay: `${i * 50}ms` } as React.CSSProperties}>
                <button type="button" className="polaroid" onClick={() => onOpen(i)} aria-label={`Open photo: ${p.caption}`}>
                  <span className="polaroid-tape" aria-hidden />
                  <span className="polaroid-photo" style={{ aspectRatio: String(p.ratio) }}>
                    <img src={thumb(p)} alt={p.caption} loading="lazy" decoding="async" />
                  </span>
                  <span className="polaroid-caption font-display">{p.caption}</span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}

export default function Football() {
  const scene = useRef<HTMLCanvasElement>(null)
  const pitch = useRef<Pitch | null>(null)
  const [stats, setStats] = useState<PitchStats>({ juggles: 0, goals: 0 })
  const [live, setLive] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<number | null>(null)
  const shown = useMemo(() => (filter === 'all' ? photos : photos.filter((p) => p.category === filter)), [filter])
  const viewerItems = useMemo(() => shown.map((p) => ({ full: full(p), thumb: thumb(p), caption: p.caption, ratio: p.ratio })), [shown])

  const night = useNight()

  useEffect(() => {
    if (!hasWebGL()) return
    const still = prefersReducedMotion()
    pitch.current = createPitch(scene.current!, { still, night, onStats: setStats, onReady: () => setLive(!still) })
    return () => {
      pitch.current?.dispose()
      pitch.current = null
    }
  }, [night])

  return (
    <>
      <canvas ref={scene} className="dive-scene pitch-scene" aria-hidden />
      <a href={import.meta.env.BASE_URL} onClick={backToIsland} className="dive-back font-display">
        ← back to the island
      </a>
      <NightSwitch />
      {live && (
        <div className="pitch-score font-display">
          <span>
            keepy-uppies <b>{stats.juggles}</b>
          </span>
          <span>
            goals <b>{stats.goals}</b>
          </span>
          <button type="button" onClick={() => pitch.current?.shoot()} className="pitch-shoot">
            shoot!
          </button>
        </div>
      )}

      <main className="dive-copy pitch-copy">
        {/* The intro and the highlights, side by side when the panel is wide. */}
        <div className="pitch-top">
          <header>
            <p className="dive-kicker font-display">player · coach</p>
            <h1 className="dive-title font-display">football</h1>
            <p className="dive-lead">I've played competitive football for 14+ years, and have coached youth football.</p>
          </header>
          <Highlights />
        </div>
        <Gallery shown={shown} filter={filter} setFilter={setFilter} onOpen={setOpen} />
      </main>
      <Grain />
      {open !== null && <PhotoViewer items={viewerItems} index={open} setIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  )
}
