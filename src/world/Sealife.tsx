import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { prefersReducedMotion } from '../lib/sections'

// Everything that swims. Each creature wanders freely inside its depth zone:
// it drifts and turns on its own, speeds up and dawdles, turns back near the
// screen edges, and bolts away from the cursor. Some swim in loose schools
// that trail a leader and scatter when startled. All art faces right.

const INK = '#120d0a'
const line = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const thin = { ...line, strokeWidth: 3.5 }

// --- species ---------------------------------------------------------------

function Fish({ color, stripe }: { color: string; stripe?: string }) {
  return (
    <svg viewBox="-56 -22 96 44" className="w-full overflow-visible">
      <path d="M-32 0 L-52 -16 L-50 16 Z" fill={color} {...thin} />
      <ellipse rx={34} ry={17} fill={color} {...thin} />
      {stripe && <path d="M4 -14 Q-2 0 4 14" stroke={stripe} strokeWidth={5} fill="none" />}
      <path d="M6 -15 Q0 0 6 15" {...thin} fill="none" />
      <circle cx={20} cy={-4} r={3.5} fill={INK} />
    </svg>
  )
}

function Clownfish() {
  return (
    <svg viewBox="-58 -34 106 66" className="w-full overflow-visible">
      <path d="M-32 0 L-52 -16 Q-46 0 -52 16 Z" fill="#f47a2a" {...thin} />
      <path d="M-10 -18 Q0 -32 16 -18 Z" fill="#f47a2a" {...thin} />
      <ellipse rx={36} ry={20} fill="#f47a2a" {...thin} />
      {['M18 -18 Q10 0 18 18', 'M-6 -19 Q-14 0 -6 19', 'M-27 -11 Q-31 0 -27 11'].map((d) => (
        <g key={d}>
          <path d={d} stroke={INK} strokeWidth={11} fill="none" />
          <path d={d} stroke="#fffaf0" strokeWidth={6} fill="none" />
        </g>
      ))}
      <circle cx={26} cy={-5} r={3.5} fill={INK} />
    </svg>
  )
}

function Tang({ body = '#2f6fd6', tail = '#ffd23f' }: { body?: string; tail?: string }) {
  return (
    <svg viewBox="-60 -32 104 64" className="w-full overflow-visible">
      <path d="M-34 0 L-56 -20 Q-48 0 -56 20 Z" fill={tail} {...thin} />
      <path d="M38 0 Q30 -28 -4 -28 Q-36 -24 -36 0 Q-36 24 -4 28 Q30 28 38 0 Z" fill={body} {...thin} />
      <path d="M-24 -8 Q0 -22 20 -12 Q6 -4 20 8 Q0 4 -24 -8 Z" fill="#1b2b5a" opacity={0.75} />
      <circle cx={22} cy={-7} r={3.5} fill={INK} />
    </svg>
  )
}

function Butterflyfish() {
  return (
    <svg viewBox="-52 -36 100 72" className="w-full overflow-visible">
      <path d="M-30 0 L-48 -14 L-48 14 Z" fill="#ffd84a" {...thin} />
      <path d="M44 2 Q30 -32 -6 -32 Q-34 -28 -34 0 Q-34 28 -6 32 Q30 30 44 2 Z" fill="#ffd84a" {...thin} />
      <path d="M20 -26 Q13 0 20 26" stroke={INK} strokeWidth={8} fill="none" />
      <circle cx={-16} cy={-12} r={6} fill={INK} />
      <circle cx={22} cy={-5} r={3} fill="#fffaf0" />
    </svg>
  )
}

function Angelfish() {
  return (
    <svg viewBox="-50 -70 92 140" className="w-full overflow-visible">
      <path
        d="M36 0 Q20 -26 -4 -24 L-20 -66 Q-10 -30 -28 -8 L-44 -14 L-40 0 L-44 14 L-28 8 Q-10 30 -20 66 L-4 24 Q20 26 36 0 Z"
        fill="#ece4f7"
        {...thin}
      />
      <path d="M10 -21 L10 21 M-10 -22 L-10 22" stroke="#3a3550" strokeWidth={6} strokeLinecap="round" />
      <circle cx={22} cy={-5} r={3.5} fill={INK} />
    </svg>
  )
}

const SPIKES = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2)
function Puffer() {
  return (
    <svg viewBox="-52 -44 96 88" className="w-full overflow-visible">
      <path d="M-26 0 L-46 -12 L-46 12 Z" fill="#d9a84e" {...thin} />
      {SPIKES.map((a) => (
        <path
          key={a}
          d={`M${Math.cos(a - 0.12) * 29} ${Math.sin(a - 0.12) * 29} L${Math.cos(a) * 40} ${Math.sin(a) * 40} L${Math.cos(a + 0.12) * 29} ${Math.sin(a + 0.12) * 29}`}
          fill="#f2d48a"
          {...thin}
          strokeWidth={2.5}
        />
      ))}
      <circle r={30} fill="#e8c070" {...thin} />
      <path d="M-22 10 Q0 30 24 10 Q0 22 -22 10 Z" fill="#fbf0d0" />
      <circle cx={14} cy={-10} r={8} fill="#fffaf0" {...thin} strokeWidth={2.5} />
      <circle cx={16} cy={-10} r={3.5} fill={INK} />
      <path d="M26 6 q4 2 0 5" {...thin} strokeWidth={2.5} fill="none" />
    </svg>
  )
}

function Barracuda() {
  return (
    <svg viewBox="-100 -22 196 44" className="w-full overflow-visible">
      <path d="M-76 0 L-98 -18 L-88 0 L-98 18 Z" fill="#9fb0bc" {...thin} />
      <path d="M-20 -10 L-30 -20 L-36 -9 Z M-40 9 L-48 18 L-52 8 Z" fill="#9fb0bc" {...thin} strokeWidth={2.5} />
      <path d="M92 2 Q80 -12 40 -12 L-60 -8 Q-80 -6 -82 0 Q-80 6 -60 8 L40 12 Q80 12 92 2 Z" fill="#c4d0d8" {...thin} />
      <path d="M20 -10 l-6 8 M0 -10 l-6 8 M-20 -9 l-6 8 M-40 -8 l-6 7" stroke="#5d6f7c" strokeWidth={3} strokeLinecap="round" />
      <path d="M92 2 L72 4" {...thin} strokeWidth={2.5} />
      <circle cx={66} cy={-3} r={3.5} fill={INK} />
    </svg>
  )
}

function Swordfish() {
  return (
    <svg viewBox="-104 -50 226 92" className="w-full overflow-visible">
      <path d="M58 -3 L120 -1 L58 5 Z" fill="#c9d3da" {...thin} strokeWidth={2.5} />
      <path d="M20 -16 Q10 -50 -8 -46 Q0 -30 -12 -15 Z" fill="#35536f" {...thin} />
      <path d="M-70 0 L-100 -38 Q-86 0 -100 38 Z" fill="#35536f" {...thin} />
      <path d="M64 0 Q50 -20 0 -18 L-72 -6 Q-80 0 -72 6 L0 18 Q50 18 64 0 Z" fill="#4a6c8c" {...thin} />
      <path d="M58 4 Q30 16 -20 12 L-60 5" stroke="#c9d3da" strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={46} cy={-5} r={4} fill={INK} />
    </svg>
  )
}

function Lanternfish({ glow = '#9ff6ff' }: { glow?: string }) {
  return (
    <svg viewBox="-40 -18 76 36" className="w-full overflow-visible">
      <path d="M-22 0 L-36 -11 L-36 11 Z" fill="#2b3a55" {...thin} strokeWidth={2.5} />
      <path d="M32 0 Q24 -14 0 -13 Q-24 -10 -24 0 Q-24 10 0 13 Q24 14 32 0 Z" fill="#2b3a55" {...thin} strokeWidth={3} />
      <g className="glow" style={{ '--glow': glow } as CSSProperties}>
        {[-14, -5, 4, 13].map((x) => (
          <circle key={x} cx={x} cy={8} r={2.6} fill={glow} />
        ))}
        <circle cx={26} cy={-6} r={2.4} fill={glow} />
      </g>
      <circle cx={18} cy={-3} r={5} fill="#e9f2ff" />
      <circle cx={19} cy={-3} r={2.6} fill={INK} />
    </svg>
  )
}

function Hatchetfish() {
  return (
    <svg viewBox="-36 -24 64 52" className="w-full overflow-visible">
      <path d="M-20 -10 L-32 -18 L-32 0 Z" fill="#aab6c4" {...thin} strokeWidth={2.5} />
      <path d="M24 -10 L-22 -14 L-26 -2 L-8 24 Q16 16 24 -10 Z" fill="#cfd8e3" {...thin} />
      <g className="glow" style={{ '--glow': '#a6f0ff' } as CSSProperties}>
        {[-12, -4, 4, 12].map((x, i) => (
          <circle key={x} cx={x} cy={14 - i * 2 + (x > 0 ? -4 : 0)} r={2} fill="#a6f0ff" />
        ))}
      </g>
      <circle cx={12} cy={-6} r={5} fill="#fffaf0" {...thin} strokeWidth={2} />
      <circle cx={13} cy={-6} r={2.4} fill={INK} />
    </svg>
  )
}

// A moray eel, rippling as it swims.
function Eel({ color = '#6b7a3a' }: { color?: string }) {
  const a = 'M100 0 Q75 -14 50 0 T0 0 T-50 0 T-110 4'
  const b = 'M100 0 Q75 14 50 0 T0 0 T-50 0 T-110 -4'
  const wave = (w: number, stroke: string) => (
    <path d={a} stroke={stroke} strokeWidth={w} fill="none" strokeLinecap="round">
      {!prefersReducedMotion() && <animate attributeName="d" values={`${a};${b};${a}`} dur="1.8s" repeatCount="indefinite" />}
    </path>
  )
  return (
    <svg viewBox="-124 -26 250 52" className="w-full overflow-visible">
      {wave(20, INK)}
      {wave(12, color)}
      <ellipse cx={104} cy={0} rx={17} ry={10} fill={color} {...thin} />
      <path d="M110 5 L120 3" {...thin} strokeWidth={2.5} />
      <circle cx={108} cy={-3} r={3} fill="#f6e68a" />
    </svg>
  )
}

// Drawn from above, gliding: it banks rather than turning round.
function Manta() {
  return (
    <svg viewBox="-210 -80 420 250" className="w-full overflow-visible">
      <path
        d="M0 -50 C60 -50 120 -10 200 40 C120 32 70 40 30 70 L4 160 L-4 160 L-30 70 C-70 40 -120 32 -200 40 C-120 -10 -60 -50 0 -50 Z"
        fill="#2d4d70"
        {...line}
      />
      <path d="M-22 -48 Q-32 -76 -14 -72 M22 -48 Q32 -76 14 -72" {...line} fill="none" />
      <path d="M-40 -10 Q0 10 40 -10" {...thin} fill="none" opacity={0.6} />
      <circle cx={-20} cy={-30} r={4} fill="#dfe8ef" />
      <circle cx={20} cy={-30} r={4} fill="#dfe8ef" />
    </svg>
  )
}

function Turtle() {
  return (
    <svg viewBox="-130 -80 260 160" className="w-full overflow-visible">
      <ellipse cx={-40} cy={-46} rx={34} ry={14} transform="rotate(-35 -40 -46)" fill="#79b35a" {...thin} />
      <ellipse cx={-40} cy={46} rx={34} ry={14} transform="rotate(35 -40 46)" fill="#79b35a" {...thin} />
      <ellipse cx={58} cy={-50} rx={46} ry={16} transform="rotate(-25 58 -50)" fill="#79b35a" {...thin} />
      <ellipse cx={58} cy={50} rx={46} ry={16} transform="rotate(25 58 50)" fill="#79b35a" {...thin} />
      <circle cx={118} cy={0} r={24} fill="#79b35a" {...thin} />
      <circle cx={128} cy={-8} r={4} fill={INK} />
      <ellipse rx={92} ry={62} fill="#8a6433" {...line} />
      <path d="M-30 -40 L30 -40 L55 0 L30 40 L-30 40 L-55 0 Z M-30 -40 L-55 -55 M30 -40 L50 -58 M-30 40 L-55 55 M30 40 L50 58 M55 0 L90 0 M-55 0 L-90 0" fill="#a5793f" {...thin} />
    </svg>
  )
}

function Anglerfish() {
  return (
    <svg viewBox="-170 -150 330 260" className="w-full overflow-visible">
      <path d="M40 -60 Q80 -150 150 -110" stroke="#51405d" strokeWidth={7} fill="none" strokeLinecap="round" />
      <g className="glow pulse" style={{ '--glow': '#ffe28a' } as CSSProperties}>
        <circle cx={150} cy={-110} r={14} fill="#fff3b8" />
      </g>
      <path d="M-160 -20 L-110 -60 L-110 30 Z" fill="#3a2d46" {...line} />
      <path d="M-120 -10 Q-110 -90 10 -86 Q110 -80 130 0 Q110 70 10 76 Q-110 80 -120 -10 Z" fill="#3a2d46" {...line} />
      <path d="M40 10 Q90 -10 128 6 Q110 52 40 50 Z" fill="#150f1c" {...thin} />
      <path d="M50 12 l8 16 l8 -18 l8 18 l8 -18 l8 18 l8 -20 l8 16 M50 48 l8 -14 l8 14 l8 -14 l8 14 l8 -14 l8 12" fill="#f4efe0" stroke={INK} strokeWidth={2} />
      <circle cx={40} cy={-30} r={16} fill="#f4efe0" {...thin} />
      <circle cx={44} cy={-28} r={6} fill={INK} />
    </svg>
  )
}

// --- who lives where -------------------------------------------------------

// size: width in px on a wide screen. zone: depth band in screen heights from
// the top of the world (the reef is 100-200, open blue 200-300, twilight
// 300-400, abyss 400-500). speed: cruising px per frame. school: how many swim
// together (one leader plus followers). bank: turn by tilting, not flipping.
type Kind = { art: ReactNode; size: number; zone: [number, number]; speed: number; count?: number; school?: number; bank?: boolean }

const KINDS: Kind[] = [
  // shallow reef
  { art: <Turtle />, size: 260, zone: [150, 185], speed: 0.5 },
  { art: <Fish color="#ffd23f" stripe="#1f1f1f" />, size: 52, zone: [120, 190], speed: 1, school: 7 },
  { art: <Fish color="#ff8c42" stripe="#fff5e2" />, size: 44, zone: [125, 192], speed: 1.1, school: 5 },
  { art: <Fish color="#e9f3f5" />, size: 24, zone: [112, 175], speed: 1.6, school: 9 },
  { art: <Clownfish />, size: 50, zone: [128, 150], speed: 0.8, count: 3 },
  { art: <Tang />, size: 68, zone: [115, 190], speed: 0.9, count: 3 },
  { art: <Butterflyfish />, size: 52, zone: [120, 185], speed: 0.7, count: 3 },
  { art: <Puffer />, size: 58, zone: [135, 190], speed: 0.35, count: 2 },
  { art: <Angelfish />, size: 56, zone: [125, 180], speed: 0.5, count: 2 },
  { art: <Fish color="#c77dff" />, size: 40, zone: [118, 190], speed: 0.9, count: 2 },
  // open blue
  { art: <Manta />, size: 380, zone: [212, 240], speed: 0.7, bank: true },
  { art: <Fish color="#7fd6e8" />, size: 50, zone: [245, 285], speed: 1.1, school: 8 },
  { art: <Fish color="#d6e4ea" />, size: 22, zone: [205, 260], speed: 1.7, school: 11 },
  { art: <Barracuda />, size: 150, zone: [215, 290], speed: 1.2, count: 3 },
  { art: <Swordfish />, size: 240, zone: [230, 280], speed: 1.5 },
  { art: <Tang body="#3fb57a" tail="#1d6e47" />, size: 62, zone: [205, 250], speed: 0.9, count: 2 },
  { art: <Fish color="#f25f5c" stripe="#ffe1a8" />, size: 46, zone: [210, 290], speed: 1, count: 3 },
  // twilight
  { art: <Lanternfish />, size: 36, zone: [305, 395], speed: 0.6, count: 6 },
  { art: <Lanternfish glow="#ffb8f2" />, size: 30, zone: [310, 395], speed: 0.6, count: 4 },
  { art: <Hatchetfish />, size: 40, zone: [305, 380], speed: 0.45, count: 4 },
  { art: <Eel />, size: 220, zone: [360, 390], speed: 0.35 },
  { art: <Puffer />, size: 50, zone: [320, 380], speed: 0.3 },
  // abyss
  { art: <Anglerfish />, size: 300, zone: [412, 450], speed: 0.3 },
  { art: <Lanternfish glow="#d8ff9f" />, size: 30, zone: [405, 455], speed: 0.5, count: 5 },
  { art: <Eel color="#4b4560" />, size: 200, zone: [430, 458], speed: 0.3 },
]

type Spec = Kind & { leader?: number; ox: number; oy: number }

// Flatten into one entry per creature; school members remember their leader
// and their place in formation (in leader widths, ox behind, oy below).
const CREATURES: Spec[] = []
for (const kind of KINDS) {
  if (kind.school) {
    const leader = CREATURES.length
    for (let i = 0; i < kind.school; i++)
      CREATURES.push({ ...kind, leader: i ? leader : undefined, ox: 0.4 + Math.random() * 1.6, oy: (Math.random() - 0.5) * 2.4 })
  } else {
    for (let i = 0; i < (kind.count ?? 1); i++) CREATURES.push({ ...kind, ox: 0, oy: 0 })
  }
}

// --- fishing ---------------------------------------------------------------

// The cursor is a fishing hook: click near a small fish to hook it, and it
// hangs by its mouth from the bend of the hook, thrashing, until the next
// click lets it go. Anything wider than CATCHABLE is too big to land.
const CATCHABLE = 70
// The bend of the hook cursor, relative to its point (the hotspot).
const BEND = { x: 6.5, y: 20 }
// How far from a fish's centre a click still hooks it, beyond its half-width.
const SLOP = 24

let hooking: { near: (x: number, y: number) => boolean; click: (x: number, y: number) => boolean } | null = null
export const fishing = {
  // Is there a fish to hook here (and nothing on the hook already)?
  over: (x: number, y: number) => hooking?.near(x, y) ?? false,
  // Hook a fish here, or let the hooked one go. True if the click was used.
  click: (x: number, y: number) => hooking?.click(x, y) ?? false,
}

// --- swimming --------------------------------------------------------------

type Body = {
  el: HTMLElement
  spec: Spec
  leader?: Body
  x: number
  y: number
  vx: number
  vy: number
  heading: number
  turn: number
  cruise: number
  panic: number
  face: number
  w: number
  nerve: number
}

function swim(layer: HTMLElement) {
  const els = [...layer.children] as HTMLElement[]
  let W = window.innerWidth
  let H = window.innerHeight
  const bodies: Body[] = CREATURES.map((spec, i) => {
    const [top, bottom] = spec.zone
    const heading = (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.4
    return {
      el: els[i],
      spec,
      x: Math.random() * W,
      y: ((top + Math.random() * (bottom - top)) * H) / 100,
      vx: Math.cos(heading) * spec.speed,
      vy: 0,
      heading,
      turn: 0,
      cruise: 0.6 + Math.random() * 0.4,
      panic: 0,
      face: Math.cos(heading) > 0 ? 1 : -1,
      w: els[i].offsetWidth,
      nerve: 0.7 + Math.random() * 0.6,
    }
  })
  bodies.forEach((b) => {
    if (b.spec.leader === undefined) return
    b.leader = bodies[b.spec.leader]
    b.x = b.leader.x - b.leader.face * b.spec.ox * b.leader.w
    b.y = b.leader.y + b.spec.oy * b.leader.w
    b.heading = b.leader.heading
    b.face = b.leader.face
  })

  const place = (b: Body, offset: number) => {
    const sy = b.y + offset
    if (sy < -400 || sy > H + 400) return
    const f = b.face.toFixed(2)
    const tilt = b.spec.bank
      ? `rotate(${(b.vx * 4).toFixed(1)}deg)`
      : `rotate(${(Math.max(-0.3, Math.min(0.3, Math.atan2(b.vy, Math.abs(b.vx)))) * Math.sign(b.face) * 57.3).toFixed(1)}deg) scaleX(${f})`
    b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) translate(-50%, -50%) ${tilt}`
  }

  const resize = () => {
    const sx = window.innerWidth / W
    const sy = window.innerHeight / H
    W = window.innerWidth
    H = window.innerHeight
    for (const b of bodies) {
      b.x *= sx
      b.y *= sy
      b.w = b.el.offsetWidth
    }
  }
  window.addEventListener('resize', resize)

  if (prefersReducedMotion()) {
    const offset = layer.getBoundingClientRect().top
    bodies.forEach((b) => place(b, offset))
    return () => window.removeEventListener('resize', resize)
  }

  let pointer: { x: number; y: number } | null = null
  // Where the hook is; unlike pointer, kept when the cursor leaves the page.
  let hook = { x: 0, y: 0 }
  const track = (e: PointerEvent) => (pointer = hook = { x: e.clientX, y: e.clientY })
  const untrack = () => (pointer = null)
  window.addEventListener('pointermove', track)
  document.documentElement.addEventListener('pointerleave', untrack)

  let caught: Body | null = null
  const nearest = (x: number, y: number) => {
    const offset = layer.getBoundingClientRect().top
    let best: Body | null = null
    let bestDist = Infinity
    for (const b of bodies) {
      if (b.spec.size > CATCHABLE) continue
      const dist = Math.hypot(b.x - x, b.y + offset - y)
      if (dist < b.w / 2 + SLOP && dist < bestDist) [best, bestDist] = [b, dist]
    }
    return best
  }
  hooking = {
    near: (x, y) => !caught && !!nearest(x, y),
    click: (x, y) => {
      if (caught) {
        // Let it go: it darts off downwards in a panic.
        caught.heading = Math.PI / 2 + (Math.random() - 0.5) * 1.4
        caught.vx = Math.cos(caught.heading) * 2
        caught.vy = 3
        caught.face = Math.cos(caught.heading) > 0 ? 1 : -1
        caught.panic = 90
        caught = null
        return true
      }
      caught = nearest(x, y)
      if (caught) hook = { x, y }
      return !!caught
    },
  }

  let frame = 0
  let last = performance.now()
  const tick = (now: number) => {
    const dt = Math.min(3, (now - last) / 16.7)
    last = now
    // Smaller screens get slower, smaller fish.
    const scale = Math.max(0.5, Math.min(1, W / 1400))
    const offset = layer.getBoundingClientRect().top

    for (const b of bodies) {
      if (b === caught) {
        // Hung by the mouth from the bend of the hook, nose up, swinging and
        // thrashing about it. The nose is ~0.44 of the width from the centre.
        const swing = Math.sin(now / 110) * 0.35 + Math.sin(now / 47) * 0.12
        const r = b.w * 0.44
        b.x = hook.x + BEND.x - Math.sin(swing) * r
        b.y = hook.y + BEND.y - offset + Math.cos(swing) * r
        b.vx = b.vy = 0
        b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${(swing * 57.3 - 90).toFixed(1)}deg)`
        continue
      }
      const { spec } = b
      const top = (spec.zone[0] * H) / 100
      const bottom = (spec.zone[1] * H) / 100
      let max = spec.speed * scale * (b.panic > 0 ? 3.2 : 1)
      let ax = 0
      let ay = 0

      const L = b.leader
      if (L && L !== caught && b.panic <= 0 && L.panic <= 0) {
        // Keep station behind the leader, matching its speed.
        const tx = L.x - Math.sign(L.face) * spec.ox * L.w
        const ty = L.y + spec.oy * L.w
        ax += (tx - b.x) * 0.002 + (L.vx - b.vx) * 0.05
        ay += (ty - b.y) * 0.002 + (L.vy - b.vy) * 0.05
        b.heading = Math.atan2(b.vy, b.vx)
        max *= 1.8
      } else {
        // Wander: the heading drifts by a random, smoothly varying turn.
        b.turn += (Math.random() - 0.5) * 0.006 * dt
        b.turn *= 0.96 ** dt
        b.heading += b.turn * dt
        // Every so often pick a new pace, from dawdling to brisk.
        if (Math.random() < 0.004 * dt) b.cruise = 0.25 + Math.random() * 0.85
        // Turn back at the edges of the zone and just past the screen sides.
        const margin = b.w
        if ((b.y < top && Math.sin(b.heading) < 0) || (b.y > bottom && Math.sin(b.heading) > 0)) b.heading = -b.heading
        if ((b.x < -margin && Math.cos(b.heading) < 0) || (b.x > W + margin && Math.cos(b.heading) > 0)) b.heading = Math.PI - b.heading
        // Fish mostly swim level, so vertical drift is damped.
        const speed = (b.panic > 0 ? 1 : b.cruise) * max
        ax += (Math.cos(b.heading) * speed - b.vx) * 0.03
        ay += (Math.sin(b.heading) * speed * (b.panic > 0 ? 1 : 0.45) - b.vy) * 0.03
      }
      if (b.y < top - 40) ay += 0.02
      if (b.y > bottom + 40) ay -= 0.02

      // Startled by the cursor: bolt directly away, and keep going that way.
      if (pointer) {
        const dx = b.x - pointer.x
        const dy = b.y + offset - pointer.y
        const dist = Math.hypot(dx, dy) || 1
        const reach = (b.w / 2 + 80) * b.nerve
        if (dist < reach) {
          const push = 0.8 * (1 - dist / reach)
          ax += (dx / dist) * push
          ay += (dy / dist) * push
          if (b.panic <= 0) b.heading = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6
          b.panic = 50 + Math.random() * 40
        }
      }
      b.panic -= dt

      b.vx += ax * dt
      b.vy += ay * dt
      const s = Math.hypot(b.vx, b.vy)
      if (s > max) {
        const k = (max / s) ** Math.min(1, 0.15 * dt)
        b.vx *= k
        b.vy *= k
      }
      b.x += b.vx * dt
      b.y += b.vy * dt

      // Turn round to face the way it's swimming.
      const want = b.vx > 0.12 ? 1 : b.vx < -0.12 ? -1 : Math.sign(b.face) || 1
      b.face += (want - b.face) * Math.min(1, 0.12 * dt)
      place(b, offset)
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)

  return () => {
    hooking = null
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', track)
    document.documentElement.removeEventListener('pointerleave', untrack)
  }
}

export default function Sealife() {
  const layer = useRef<HTMLDivElement>(null)
  useEffect(() => swim(layer.current!), [])
  return (
    <div ref={layer}>
      {CREATURES.map((c, i) => (
        <div
          key={i}
          className="absolute top-0 left-0"
          style={{ width: `clamp(${c.size * 0.45}px, ${(c.size / 12).toFixed(2)}vw, ${c.size}px)`, transform: 'translate3d(-9999px, 0, 0)' }}
        >
          <div className="wiggle" style={{ animationDuration: `${(0.6 + (i % 7) * 0.12).toFixed(2)}s` }}>
            {c.art}
          </div>
        </div>
      ))}
    </div>
  )
}
