import { useEffect, useRef } from 'react'
import { prefersReducedMotion, sectionProgress } from '../lib/sections'

// Shreyas drawn in the style of "Total Drama Island": bold black outlines,
// flat colour with one hard shadow tone, tall white oval eyes with small
// pupils, chunky brows and a slightly oversized head.

const INK = '#120d0a'
const SKIN = '#c98652'
const SKIN_SHADE = '#a5663a'
const HAIR = '#1b120d'
const HAIR_TIPS = '#c99d5f'
const TOP = '#232329'
const TOP_SHADE = '#16161b'
const STRAP = '#0d0d10'
const BUCKLE = '#44444d'
const JEANS = '#3b4a6b'
const JEANS_SHADE = '#2b3753'
const SHOE = '#f1ede2'
const SHOE_TRIM = '#b7392f'
const MOUTH = '#6e211d'

const line = { stroke: INK, strokeWidth: 6, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const thin = { ...line, strokeWidth: 4 }

// Bumpy outline along an elliptical arc; used to build the curly hair.
function scallops(cx: number, cy: number, rx: number, ry: number, from: number, to: number, count: number, bump: number) {
  const point = (a: number, grow = 0) => [cx + (rx + grow) * Math.cos(a), cy - (ry + grow) * Math.sin(a)]
  let d = ''
  for (let i = 0; i < count; i++) {
    const a0 = from + ((to - from) * i) / count
    const a1 = from + ((to - from) * (i + 1)) / count
    const [x0, y0] = point(a0)
    const [qx, qy] = point((a0 + a1) / 2, bump * (i % 2 ? 0.75 : 1))
    const [x1, y1] = point(a1)
    d += `${i === 0 ? `M${x0.toFixed(1)} ${y0.toFixed(1)}` : ''} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `
  }
  return d
}

const deg = Math.PI / 180
const HAIR_PATH = (() => {
  let d = scallops(200, 108, 82, 66, 196 * deg, -16 * deg, 12, 19)
  const fringe = [
    [276, 132],
    [258, 104],
    [236, 97],
    [213, 93],
    [189, 95],
    [166, 99],
    [144, 106],
    [124, 132],
  ]
  for (let i = 1; i < fringe.length; i++) {
    const [x0, y0] = fringe[i - 1]
    const [x1, y1] = fringe[i]
    d += `Q${(x0 + x1) / 2 + 3} ${Math.max(y0, y1) + 19} ${x1} ${y1} `
  }
  return `${d}Z`
})()

const CURLS_DARK = [
  [148, 78],
  [182, 50],
  [224, 52],
  [256, 78],
]
const CURLS_LIGHT = [
  [168, 94],
  [206, 70],
  [238, 94],
]
const curl = ([x, y]: number[]) => `M${x} ${y} a7 7 0 1 1 11 6`

// A simple cartoon hand hanging from the wrist at (0, 0): mitten palm,
// thumb on the -x side, two knuckle lines. Mirror with scale(-1 1).
function Hand() {
  return (
    <g>
      <path d="M-15 -2 L15 -2 Q22 20 16 38 Q2 50 -12 40 Q-19 26 -15 -2 Z" fill={SKIN} {...thin} />
      <path d="M-13 8 Q-28 14 -25 28 Q-19 32 -12 24" fill={SKIN} {...thin} />
      <path d="M-2 32 L-3 43 M7 30 L7 41" {...thin} strokeWidth={3} fill="none" />
    </g>
  )
}

// Upper arm, elbow and forearm, all hanging from the shoulder at (0, 0).
type Part = 'shoulderL' | 'shoulderR' | 'elbowL' | 'elbowR'

type Action = 'wave' | 'look' | 'shrug' | 'laugh'
const ACTIONS: Action[] = ['wave', 'look', 'shrug', 'laugh']
const DURATION: Record<Action | 'jump', number> = { wave: 2.8, look: 3, shrug: 2, laugh: 2.2, jump: 0.95 }
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

    const move = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    }
    // Clicking the character (anywhere that isn't a link or button) makes him jump.
    const click = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button') || !state.onIsland || !p.body) return
      const box = p.body.getBoundingClientRect()
      if (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom) {
        state.jumpAt = (e.timeStamp - start) / 1000
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerdown', click)

    const rotate = (key: Part, angle: number, x: number, y: number, lift = 0) =>
      p[key]?.setAttribute('transform', `translate(${x} ${y - lift}) rotate(${angle})`)

    let frame = 0
    let last = 0
    const tick = (now: number) => {
      if (start < 0) start = now
      const t = (now - start) / 1000
      const dt = Math.min(0.05, t - last)
      last = t

      // --- Scroll: he stays on the island, which rises out of view as the
      // backdrop descends into the ocean (one screen height per section).
      const progress = sectionProgress()
      state.onIsland = progress < 0.6
      if (wrapper.current) wrapper.current.style.transform = `translate3d(0, ${-progress * window.innerHeight}px, 0)`
      // Lean into fast scrolling, then settle back.
      const velocity = dt > 0 ? (progress - state.lastProgress) / dt : 0
      state.lastProgress = progress
      state.lean += (clamp(velocity * 5, -7, 7) - state.lean) * 0.08

      // --- Cursor: eyes and head follow it; brows lift when it's near the face.
      let nearFace = 0
      const box = svg.current?.getBoundingClientRect()
      if (box) {
        const fx = box.left + box.width / 2
        const fy = box.top + box.height * 0.18
        const dx = pointer.x - fx
        const dy = pointer.y - fy
        const len = Math.hypot(dx, dy) || 1
        const reach = Math.min(1, len / 380)
        look.x += ((dx / len) * reach - look.x) * 0.12
        look.y += ((dy / len) * reach - look.y) * 0.12
        nearFace = clamp(1 - len / (box.height * 0.18), 0, 1)
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

      const wave = on('wave')
      const shrug = on('shrug')
      const laugh = on('laugh')
      const lookAround = on('look')

      // Look-around overrides the cursor: glance left, then right.
      const glance = Math.sin(clamp(ax, 0, 1) * Math.PI * 2)
      const lx = look.x * (1 - lookAround) + glance * lookAround
      const ly = look.y * (1 - lookAround) - 0.2 * lookAround

      // Jump: crouch, launch, land with a squash.
      let jumpY = 0
      let squash = 0
      if (jumping) {
        if (jx < 0.15) squash = Math.sin((jx / 0.15) * Math.PI) * 0.08
        else if (jx < 0.8) jumpY = -95 * Math.sin(((jx - 0.15) / 0.65) * Math.PI)
        else squash = Math.sin(((jx - 0.8) / 0.2) * Math.PI) * 0.1
      }
      const stretch = jumping && jx >= 0.15 && jx < 0.45 ? 0.05 : 0
      const airborne = jumping ? envelope(jx) : 0

      // --- Body: breathing bob, gentle sway, scroll lean, jump. ----------------
      const bob = still ? 0 : Math.sin(t * 1.7) * 3 + Math.sin(t * 14) * 1.5 * laugh
      const sway = still ? 0 : Math.sin(t * 0.55) * 1.2
      const sy = 1 - squash + stretch
      const sx = 1 + squash * 0.8 - stretch * 0.6
      const intro = clamp(t / 0.9, 0, 1)
      const introY = (1 - smooth(intro)) * 70 - Math.sin(intro * Math.PI) * 10
      p.body?.setAttribute(
        'transform',
        `translate(0 ${bob + jumpY + (still ? 0 : introY)}) rotate(${sway + state.lean} 200 870) translate(200 870) scale(${sx} ${sy}) translate(-200 -870)`,
      )
      if (svg.current) svg.current.style.opacity = String(still ? 1 : smooth(intro))
      p.torso?.setAttribute('transform', `translate(200 600) scale(1 ${1 + Math.sin(t * 1.7) * 0.008}) translate(-200 -600)`)

      // --- Arms. ---------------------------------------------------------------
      const lift = shrug * 10 + airborne * 4
      const waveSwing = Math.sin(t * 10) * 22
      rotate('shoulderL', 8 + shrug * 16 + airborne * 60, 142, 336, lift)
      rotate('shoulderR', -8 - wave * 142 - shrug * 16 - airborne * 60, 258, 336, lift)
      rotate('elbowL', shrug * 75 + airborne * 20 + laugh * 10, 0, 118)
      rotate('elbowR', wave * (-35 + waveSwing) - shrug * 75 - airborne * 20 - laugh * 10, 0, 118)

      // --- Head, hair, face. -----------------------------------------------------
      const tilt = lx * 4 + shrug * 7 - laugh * 4 + Math.sin(t * 0.8) * (still ? 0 : 1)
      p.head?.setAttribute('transform', `rotate(${tilt} 200 300) translate(${lx * 5} ${ly * 3 - laugh * 3})`)
      const hairLag = still ? 0 : Math.sin(t * 1.7 - 0.9) * 1.6 - (jumping ? Math.cos(((jx - 0.15) / 0.65) * Math.PI) * 6 * airborne : 0)
      p.hair?.setAttribute('transform', `translate(0 ${hairLag})`)

      const brows = 3 * nearFace + 5 * wave + 8 * shrug + 4 * lookAround + 9 * (jumping && jx < 0.5 ? airborne : 0)
      p.brows?.setAttribute('transform', `translate(0 ${-brows})`)

      const shut = Math.max(blinkAt(t), laugh * 0.6)
      for (const side of ['L', 'R']) {
        p[`eye${side}`]?.setAttribute('transform', `scale(1 ${1 - shut * 0.88})`)
        p[`pupil${side}`]?.setAttribute('transform', `translate(${lx * 7} ${ly * 6})`)
      }

      const mouth = jumping ? (jx < 0.4 ? 'oh' : 'laugh') : laugh > 0.1 ? 'laugh' : 'grin'
      for (const name of ['grin', 'laugh', 'oh']) p[`mouth-${name}`]?.setAttribute('display', name === mouth ? 'inline' : 'none')

      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', click)
    }
  }, [])

  const arm = (side: 'L' | 'R') => (
    <g ref={set(`shoulder${side}`)} transform={`translate(${side === 'L' ? 142 : 258} 336) rotate(${side === 'L' ? 8 : -8})`}>
      <rect x={-18} y={-8} width={36} height={134} rx={18} fill={TOP} {...line} />
      <g ref={set(`elbow${side}`)} transform="translate(0 118)">
        <rect x={-16} y={-10} width={32} height={122} rx={16} fill={TOP} {...line} />
        <path d="M-14 100 L14 100" {...thin} />
        <g transform={`translate(0 104) scale(${side === 'L' ? -1 : 1} 1)`}>
          <Hand />
        </g>
      </g>
    </g>
  )

  return (
    <div aria-hidden className="character pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      {/* Feet stand on the sand in the backdrop, 15% up from the bottom. */}
      <div ref={wrapper} className="flex h-full items-end justify-center pb-[15vh] will-change-transform">
        <div className="h-[50vh]">
        <svg ref={svg} viewBox="0 0 400 920" className="h-full w-auto overflow-visible">
          <g ref={set('body')}>
            {/* legs */}
            <path d="M140 596 L198 604 L194 832 L150 832 Z" fill={JEANS} {...line} />
            <path d="M202 604 L260 596 L250 832 L206 832 Z" fill={JEANS} {...line} />
            <path d="M232 606 L258 600 L250 830 L236 830 Z" fill={JEANS_SHADE} />
            <path d="M152 800 L192 802 M208 802 L248 800" {...thin} />
            {/* chunky sneakers */}
            <path d="M146 822 Q128 852 140 870 L206 870 Q212 848 198 822 Z" fill={SHOE} {...line} />
            <path d="M202 822 Q188 848 194 870 L260 870 Q272 852 254 822 Z" fill={SHOE} {...line} />
            <path d="M142 856 L206 856 M194 856 L258 856" stroke={SHOE_TRIM} strokeWidth={5} />

            {/* torso: black quarter-zip */}
            <g ref={set('torso')}>
              <path d="M130 344 Q140 318 176 312 L224 312 Q260 318 270 344 L272 602 Q200 616 128 602 Z" fill={TOP} {...line} />
              <path d="M246 330 Q266 338 268 364 L270 598 Q256 604 248 604 Z" fill={TOP_SHADE} />
              <path d="M170 300 L174 332 L200 352 L226 332 L230 300 L218 307 L200 336 L182 307 Z" fill={TOP} {...line} />
              <path d="M172 305 L184 312 M228 305 L216 312" stroke="#c0392b" strokeWidth={3.5} strokeLinecap="round" />
              <path d="M172 311 L184 318 M228 311 L216 318" stroke="#2e7d4f" strokeWidth={3.5} strokeLinecap="round" />
              <path d="M200 352 L200 420" stroke={BUCKLE} strokeWidth={3.5} />
              <path d="M224 386 L246 386 L246 406 Q235 418 224 406 Z M229 393 L241 393 M229 399 L241 399" fill="none" stroke="#d8d4c8" strokeWidth={3} strokeLinejoin="round" />
              {/* crossbody strap */}
              <path d="M244 316 L262 326 L158 596 L140 586 Z" fill={STRAP} {...thin} />
              <path d="M214 380 L234 390 L226 408 L206 398 Z M190 440 L210 450 L202 468 L182 458 Z" fill={BUCKLE} {...thin} strokeWidth={3} />
            </g>

            {arm('L')}
            {arm('R')}

            {/* neck with the hard shadow under the jaw */}
            <path d="M183 262 L183 322 L217 322 L217 262 Z" fill={SKIN} {...line} />
            <path d="M186 266 L214 266 L214 292 Q200 302 186 292 Z" fill={SKIN_SHADE} />

            {/* head */}
            <g ref={set('head')}>
              {/* a short face, sitting low so the chin meets the neck */}
              <g transform="translate(0 22)">
                <path d="M134 150 C114 142 110 182 136 187 Z" fill={SKIN} {...line} />
                <path d="M266 150 C286 142 290 182 264 187 Z" fill={SKIN} {...line} />
                <path d="M129 158 Q124 168 132 176 M271 158 Q276 168 268 176" {...thin} fill="none" />
                <path
                  d="M132 150 C130 100 160 72 200 72 C240 72 270 100 268 150 C268 194 250 230 222 246 Q200 257 178 246 C150 230 132 194 132 150 Z"
                  fill={SKIN}
                  {...line}
                />
                <path d="M266 150 C266 194 248 228 222 244 Q212 250 205 252 Q236 228 250 190 Q258 168 260 150 Z" fill={SKIN_SHADE} />

                {/* mouths: one is shown at a time */}
                <g ref={set('mouth-grin')}>
                  <path d="M168 208 Q200 217 234 206 Q228 233 201 235 Q176 233 168 208 Z" fill={MOUTH} {...thin} />
                  <path d="M171 209 Q200 218 231 208 L228 216 Q200 224 174 218 Z" fill="#fffdf6" />
                  <path d="M188 229 Q201 224 214 229 Q201 233 188 229 Z" fill="#d0605c" />
                </g>
                <g ref={set('mouth-laugh')} display="none">
                  <path d="M164 204 Q200 214 238 203 Q234 246 201 249 Q168 246 164 204 Z" fill={MOUTH} {...thin} />
                  <path d="M167 206 Q200 215 235 204 L232 214 Q200 223 170 216 Z" fill="#fffdf6" />
                  <path d="M182 240 Q201 229 220 240 Q201 248 182 240 Z" fill="#d0605c" />
                </g>
                <g ref={set('mouth-oh')} display="none">
                  <ellipse cx={201} cy={222} rx={12} ry={12} fill={MOUTH} {...thin} />
                </g>
                <path d="M182 201 Q200 196 220 201 Q200 199 182 201 Z" fill={HAIR} opacity={0.75} />

                {/* hooked nose */}
                <path d="M204 168 Q216 184 207 189 Q200 192 195 188" {...thin} fill="none" />

                {/* tall oval eyes; pupils follow the cursor */}
                {(['L', 'R'] as const).map((side) => (
                  <g key={side} transform={`translate(${side === 'L' ? 178 : 222} 160)`}>
                    <g ref={set(`eye${side}`)}>
                      <ellipse rx={16} ry={21} fill="#fffef8" {...thin} />
                      <g ref={set(`pupil${side}`)}>
                        <circle r={5.5} fill={INK} />
                      </g>
                      <path d="M-17 -3 Q-16 -24 0 -24 Q16 -24 17 -3" fill="none" {...line} strokeWidth={6.5} />
                    </g>
                  </g>
                ))}

                {/* chunky brows */}
                <g ref={set('brows')}>
                  <path d="M158 131 Q176 119 195 126 L195 134 Q176 129 160 139 Z" fill={HAIR} {...thin} strokeWidth={2} />
                  <path d="M242 131 Q224 119 205 126 L205 134 Q224 129 240 139 Z" fill={HAIR} {...thin} strokeWidth={2} />
                </g>

                {/* curly hair with sandy tips */}
                <g ref={set('hair')}>
                  <path d={HAIR_PATH} fill={HAIR} {...line} />
                  <path d={CURLS_DARK.map(curl).join(' ')} stroke="#3f2b1f" strokeWidth={4} fill="none" strokeLinecap="round" />
                  <path d={CURLS_LIGHT.map(curl).join(' ')} stroke={HAIR_TIPS} strokeWidth={4.5} fill="none" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </g>
        </svg>
        </div>
      </div>
    </div>
  )
}
