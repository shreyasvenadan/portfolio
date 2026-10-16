import { useEffect, useRef } from 'react'
import { prefersReducedMotion, sectionProgress } from '../lib/sections'

// Shreyas as a Peanuts character. The render is split into layers by
// scripts/split-character.py (floor shadow, body, head) and posed here: the
// head pivots on the neck, the body bobs and squashes from the feet, and the
// eyes are drawn on top so they can blink and follow the cursor.
// Coordinates are pixels in the 470x720 layer images.

const LAYERS = `${import.meta.env.BASE_URL}character/`
const W = 470
const H = 720
const NECK = { x: 262, y: 324 }
const FEET = { x: 290, y: 681 }
const EYES = [
  { x: 246.5, y: 179.4, rx: 6, ry: 7.6 },
  { x: 296.4, y: 178.4, rx: 5.6, ry: 7.6 },
]
const EYE_INK = '#130d0a'
// His height in units of the 1600x900 island scene.
const HEIGHT = 400

type Action = 'look' | 'nod' | 'dance' | 'tilt'
const ACTIONS: Action[] = ['look', 'dance', 'nod', 'tilt']
const DURATION: Record<Action | 'jump', number> = { look: 3, nod: 1.6, dance: 3.2, tilt: 2.2, jump: 0.95 }
const ACTION_GAP = 6.5

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const smooth = (x: number) => x * x * (3 - 2 * x)
// 0 → 1 → 0 over an action, easing in and out over the first/last 20%.
const envelope = (x: number) => (x <= 0 || x >= 1 ? 0 : smooth(clamp(Math.min(x, 1 - x) / 0.2, 0, 1)))

function blinkAt(t: number) {
  const cycle = Math.floor(t / 4.3)
  const phase = t % 4.3
  const one = (p: number) => (p > 0 && p < 0.14 ? Math.sin((p / 0.14) * Math.PI) : 0)
  // Every third blink is a quick double blink.
  return Math.max(one(phase), cycle % 3 === 0 ? one(phase - 0.24) : 0)
}

export default function Character() {
  const wrapper = useRef<HTMLDivElement>(null)
  const sizer = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const parts = useRef<Partial<Record<string, SVGGElement>>>({})
  const set = (key: string) => (el: SVGGElement | null) => {
    if (el) parts.current[key] = el
  }

  useEffect(() => {
    const still = prefersReducedMotion()
    const p = parts.current
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 3 }
    const look = { x: 0, y: 0 }
    const state = { lean: 0, lastProgress: sectionProgress(), onIsland: true, jumpAt: -10 }
    let start = -1 // set on the first animation frame
    let stand: HTMLElement | null = null
    let offset = 0

    const move = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    }
    // Clicking the character (anywhere that isn't a link or button) makes him jump.
    const click = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button, dialog') || !state.onIsland || !p.body) return
      const box = p.body.getBoundingClientRect()
      if (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom) {
        state.jumpAt = (e.timeStamp - start) / 1000
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerdown', click)

    let frame = 0
    let last = 0
    const tick = (now: number) => {
      if (start < 0) start = now
      const t = (now - start) / 1000
      const dt = Math.min(0.05, t - last)
      last = t

      // --- Scroll: he stays on the island, which scrolls up out of view with
      // the page as it heads into the ocean.
      const progress = sectionProgress()
      state.onIsland = progress < 0.6
      // Sized with the island scene (src/world/Surface.tsx), and moved so his
      // feet are on its #stand mark, which scrolls with the page.
      const s = Math.max(window.innerWidth / 1600, window.innerHeight / 900)
      if (sizer.current) sizer.current.style.height = `${HEIGHT * s}px`
      const mark = (stand ??= document.getElementById('stand'))?.getBoundingClientRect()
      const figure = svg.current?.getBoundingClientRect()
      if (wrapper.current && mark && figure) {
        const feet = figure.top - offset + (figure.height * FEET.y) / H
        offset = mark.top + mark.height / 2 - feet
        wrapper.current.style.transform = `translate3d(0, ${offset}px, 0)`
      }
      // Lean into fast scrolling, then settle back.
      const velocity = dt > 0 ? (progress - state.lastProgress) / dt : 0
      state.lastProgress = progress
      state.lean += (clamp(velocity * 5, -7, 7) - state.lean) * 0.08

      // --- Cursor: eyes and head follow it.
      const box = svg.current?.getBoundingClientRect()
      if (box) {
        const fx = box.left + (box.width * EYES[0].x) / W
        const fy = box.top + (box.height * EYES[0].y) / H
        const dx = pointer.x - fx
        const dy = pointer.y - fy
        const len = Math.hypot(dx, dy) || 1
        const reach = Math.min(1, len / 380)
        look.x += ((dx / len) * reach - look.x) * 0.12
        look.y += ((dy / len) * reach - look.y) * 0.12
      }

      // --- Idle actions, one every few seconds, plus click-to-jump. -----------
      const since = t - 1.5
      const slot = Math.floor(since / ACTION_GAP)
      const action = ACTIONS[((slot % ACTIONS.length) + ACTIONS.length) % ACTIONS.length]
      const ax = since >= 0 ? (since - slot * ACTION_GAP) / DURATION[action] : -1
      const e = still ? 0 : envelope(ax)
      const on = (name: Action) => (action === name ? e : 0)
      const jx = (t - state.jumpAt) / DURATION.jump
      const jumping = !still && jx >= 0 && jx < 1

      const lookAround = on('look')
      const nod = on('nod')
      const dance = on('dance')
      const tiltOn = on('tilt')

      // Look-around overrides the cursor: glance left, then right.
      const glance = Math.sin(clamp(ax, 0, 1) * Math.PI * 2)
      const lx = look.x * (1 - lookAround) + glance * lookAround
      const ly = look.y * (1 - lookAround) - 0.2 * lookAround

      // Jump: crouch, launch, land with a squash.
      let jumpY = 0
      let squash = 0
      if (jumping) {
        if (jx < 0.15) squash = Math.sin((jx / 0.15) * Math.PI) * 0.08
        else if (jx < 0.8) jumpY = -75 * Math.sin(((jx - 0.15) / 0.65) * Math.PI)
        else squash = Math.sin(((jx - 0.8) / 0.2) * Math.PI) * 0.1
      }
      const stretch = jumping && jx >= 0.15 && jx < 0.45 ? 0.05 : 0

      // The Peanuts dance: rock side to side on the beat with little hops.
      const beat = t * Math.PI * 2.4
      const danceRock = Math.sin(beat) * 5 * dance
      const danceHop = -Math.abs(Math.sin(beat)) * 9 * dance

      // --- Body: breathing bob, gentle sway, scroll lean, dance, jump. ---------
      const breath = Math.sin(t * 1.7)
      const bob = still ? 0 : breath * 1.5 + danceHop
      const sway = still ? 0 : Math.sin(t * 0.55) * 0.8 + danceRock
      const sy = 1 - squash + stretch + (still ? 0 : breath * 0.006)
      const sx = 1 + squash * 0.8 - stretch * 0.6
      const intro = clamp(t / 0.9, 0, 1)
      const introY = (1 - smooth(intro)) * 55 - Math.sin(intro * Math.PI) * 8
      const lift = bob + jumpY + (still ? 0 : introY)
      p.body?.setAttribute(
        'transform',
        `translate(0 ${lift}) rotate(${sway + state.lean} ${FEET.x} ${FEET.y}) translate(${FEET.x} ${FEET.y}) scale(${sx} ${sy}) translate(${-FEET.x} ${-FEET.y})`,
      )
      if (svg.current) svg.current.style.opacity = String(still ? 1 : smooth(intro))

      // The shadow stays on the sand and shrinks as he leaves it.
      const height = clamp(-Math.min(0, lift) / 75, 0, 1)
      p.shadow?.setAttribute(
        'transform',
        `translate(${FEET.x} ${FEET.y}) scale(${1 - height * 0.4 + squash * 0.5} 1) translate(${-FEET.x} ${-FEET.y})`,
      )
      p.shadow?.setAttribute('opacity', String(1 - height * 0.6))

      // --- Head: follows the cursor, nods, tilts, bobs against the dance. ------
      const nodAngle = Math.sin(clamp(ax, 0, 1) * Math.PI * 4) * 6 * nod
      const tilt =
        lx * 4 +
        tiltOn * 9 -
        danceRock * 1.4 +
        (still ? 0 : Math.sin(t * 0.8) * 1) -
        (jumping ? Math.cos(((jx - 0.15) / 0.65) * Math.PI) * 3 * envelope(jx) : 0)
      p.head?.setAttribute(
        'transform',
        `rotate(${tilt} ${NECK.x} ${NECK.y}) translate(${lx * 3} ${ly * 2 + nodAngle * 0.6 + (still ? 0 : breath * -0.6)})`,
      )

      // --- Eyes: blink, and look where the head looks. -------------------------
      const shut = blinkAt(t) * (still ? 0 : 1)
      p.eyes?.setAttribute('transform', `translate(${lx * 2.4} ${ly * 2})`)
      EYES.forEach((eye, i) => {
        p[`eye${i}`]?.setAttribute(
          'transform',
          `translate(${eye.x} ${eye.y}) scale(1 ${1 - shut * 0.86}) translate(${-eye.x} ${-eye.y})`,
        )
      })

      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', click)
    }
  }, [])

  return (
    <div aria-hidden className="character pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      {/* Placed on the island's sand each frame (see the scroll step above). */}
      <div ref={wrapper} className="flex h-full items-end justify-center pb-[15vh] will-change-transform">
        <div ref={sizer} className="h-[44vh]">
          <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="h-full w-auto overflow-visible">
            <g ref={set('shadow')}>
              <image href={`${LAYERS}shadow.webp`} width={W} height={H} />
            </g>
            <g ref={set('body')}>
              <image href={`${LAYERS}body.webp`} width={W} height={H} />
              <g ref={set('head')}>
                <image href={`${LAYERS}head.webp`} width={W} height={H} />
                <g ref={set('eyes')}>
                  {EYES.map((eye, i) => (
                    <g key={i} ref={set(`eye${i}`)}>
                      <ellipse cx={eye.x} cy={eye.y} rx={eye.rx} ry={eye.ry} fill={EYE_INK} />
                      <circle cx={eye.x + eye.rx * 0.35} cy={eye.y - eye.ry * 0.35} r={1.3} fill="#fff" opacity={0.85} />
                    </g>
                  ))}
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
