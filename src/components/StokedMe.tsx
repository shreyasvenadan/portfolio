import { useEffect, useRef } from 'react'
import { prefersReducedMotion, sectionProgress } from '../lib/sections'

// Shreyas drawn in the flat, thick-outlined style of the cartoon "Stoked":
// lanky proportions, big oval eyes with dot pupils, one flat shadow tone.

const INK = '#1a1410'
const SKIN = '#c07f55'
const SKIN_SHADE = '#9c5f3c'
const HAIR = '#1c1512'
const HOODIE = '#bdb7aa'
const HOODIE_SHADE = '#97917f'
const JACKET = '#2e3b58'
const JACKET_SHADE = '#1f283e'
const JEANS = '#3a445d'
const JEANS_SHADE = '#283047'
const SHOE = '#ece8dc'
const MOUTH = '#5b1d1d'

const line = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

// Bumpy outline along an elliptical arc; used to build the curly hair.
function scallops(cx: number, cy: number, rx: number, ry: number, from: number, to: number, count: number, bump: number) {
  const point = (a: number, grow = 0) => [cx + (rx + grow) * Math.cos(a), cy - (ry + grow) * Math.sin(a)]
  let d = ''
  for (let i = 0; i < count; i++) {
    const a0 = from + ((to - from) * i) / count
    const a1 = from + ((to - from) * (i + 1)) / count
    const [x0, y0] = point(a0)
    const [qx, qy] = point((a0 + a1) / 2, bump)
    const [x1, y1] = point(a1)
    d += `${i === 0 ? `M${x0.toFixed(1)} ${y0.toFixed(1)}` : ''} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `
  }
  return d
}

// Curly mop: a scalloped dome, then a fringe of downward curls across the forehead.
const deg = Math.PI / 180
const HAIR_PATH = (() => {
  let d = scallops(200, 138, 84, 92, 200 * deg, -20 * deg, 13, 16)
  const fringe = [
    [279, 170],
    [262, 132],
    [238, 124],
    [214, 118],
    [190, 120],
    [166, 126],
    [142, 134],
    [121, 170],
  ]
  for (let i = 1; i < fringe.length; i++) {
    const [x0, y0] = fringe[i - 1]
    const [x1, y1] = fringe[i]
    d += `Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 22} ${x1} ${y1} `
  }
  return `${d}Z`
})()

type Frame = { scale: number; y: number; blur: number }
// Per section: hero full body, then zoomed in and blurred behind the text,
// then back to a smaller, sharp full body for contact.
const FRAMES: Frame[] = [
  { scale: 1, y: 0, blur: 0 },
  { scale: 2.9, y: 36, blur: 10 },
  { scale: 2.1, y: 12, blur: 9 },
  { scale: 1.6, y: -4, blur: 8 },
  { scale: 0.82, y: -14, blur: 0 },
]

const blink = (t: number) => {
  const phase = t % 4.3
  return phase < 0.14 ? Math.sin((phase / 0.14) * Math.PI) : 0
}

export default function StokedMe() {
  const wrapper = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const body = useRef<SVGGElement>(null)
  const head = useRef<SVGGElement>(null)
  const eyes = useRef<SVGGElement[]>([])
  const pupils = useRef<SVGCircleElement[]>([])
  const arm = useRef<SVGGElement>(null)

  useEffect(() => {
    const still = prefersReducedMotion()
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 3 }
    const move = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    }
    window.addEventListener('pointermove', move)

    const look = { x: 0, y: 0 }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000

      // Scroll: zoom toward the face and blur, interpolating between sections.
      const p = sectionProgress()
      const i = Math.min(Math.floor(p), FRAMES.length - 2)
      const f = (p - i) * (p - i) * (3 - 2 * (p - i))
      const a = FRAMES[i]
      const b = FRAMES[i + 1]
      const scale = a.scale + (b.scale - a.scale) * f
      const y = a.y + (b.y - a.y) * f
      const blur = a.blur + (b.blur - a.blur) * f
      if (wrapper.current) {
        wrapper.current.style.transform = `translateY(${y}%) scale(${scale})`
        wrapper.current.style.filter = blur > 0.2 ? `blur(${blur}px)` : 'none'
      }

      // Pupils and head turn toward the cursor.
      const box = svg.current?.getBoundingClientRect()
      if (box) {
        const fx = box.left + box.width / 2
        const fy = box.top + box.height * 0.2
        const dx = pointer.x - fx
        const dy = pointer.y - fy
        const len = Math.hypot(dx, dy) || 1
        const reach = Math.min(1, len / 400)
        look.x += ((dx / len) * reach - look.x) * 0.12
        look.y += ((dy / len) * reach - look.y) * 0.12
      }
      pupils.current.forEach((pupil) => pupil.setAttribute('transform', `translate(${look.x * 8} ${look.y * 7})`))
      head.current?.setAttribute('transform', `rotate(${look.x * 5} 200 300) translate(${look.x * 5} 0)`)

      const shut = blink(t)
      eyes.current.forEach((eye) => eye.setAttribute('transform', `scale(1 ${1 - shut * 0.92})`))

      if (!still) {
        body.current?.setAttribute('transform', `translate(0 ${Math.sin(t * 1.6) * 4})`)
        // Wave every 9 seconds.
        const phase = t % 9
        const up = phase < 2.4 ? Math.sin((phase / 2.4) * Math.PI) : 0
        arm.current?.setAttribute('transform', `rotate(${-up * 150 + up * Math.sin(t * 11) * 12} 262 336)`)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[5] flex items-end justify-center overflow-hidden">
      <div ref={wrapper} className="h-[92svh] origin-[50%_20%] will-change-transform">
        <svg ref={svg} viewBox="0 0 400 920" className="h-full w-auto overflow-visible">
          <g ref={body}>
            {/* legs */}
            <path d="M136 556 L198 566 L193 822 L150 822 Z" fill={JEANS} {...line} />
            <path d="M202 566 L264 556 L250 822 L207 822 Z" fill={JEANS} {...line} />
            <path d="M188 566 L212 566 L200 610 Z" fill={JEANS_SHADE} />
            {/* sneakers */}
            <path d="M148 816 Q138 850 150 864 L206 864 Q212 846 196 816 Z" fill={SHOE} {...line} />
            <path d="M204 816 Q188 846 194 864 L250 864 Q262 850 252 816 Z" fill={SHOE} {...line} />
            <path d="M149 852 L207 852 M193 852 L251 852" {...line} strokeWidth={4} />

            {/* hood bunched behind the neck */}
            <path d="M158 312 Q200 278 242 312 L232 322 Q200 300 168 322 Z" fill={HOODIE_SHADE} {...line} />
            {/* hoodie */}
            <path d="M142 330 Q152 316 182 310 L218 310 Q248 316 258 330 L266 560 Q200 574 134 560 Z" fill={HOODIE} {...line} />
            <path d="M162 484 Q200 474 238 484 L244 542 L156 542 Z" fill={HOODIE_SHADE} {...line} strokeWidth={4} />
            {/* drawstrings */}
            <path d="M190 322 L185 392 M210 322 L215 392" stroke="#f4f0e5" strokeWidth={5} strokeLinecap="round" />
            <path d="M190 322 L185 392 M210 322 L215 392" stroke={INK} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.5} />
            {/* open jacket */}
            <path d="M142 330 Q152 316 180 310 L186 334 L172 566 L132 562 Z" fill={JACKET} {...line} />
            <path d="M258 330 Q248 316 220 310 L214 334 L228 566 L268 562 Z" fill={JACKET} {...line} />
            <path d="M180 310 L160 362 L174 376 L188 334 Z" fill={JACKET_SHADE} {...line} strokeWidth={4} />
            <path d="M220 310 L240 362 L226 376 L212 334 Z" fill={JACKET_SHADE} {...line} strokeWidth={4} />

            {/* left arm (hanging) */}
            <path d="M144 330 C120 342 110 400 112 452 C113 492 116 520 120 546 L148 546 C143 510 143 470 147 432 C151 396 160 362 160 346 Z" fill={JACKET} {...line} />
            <path d="M119 544 Q108 576 124 592 Q142 600 152 580 Q154 560 148 544 Z" fill={SKIN} {...line} />
            <path d="M128 560 Q124 572 130 580" {...line} strokeWidth={3.5} fill="none" />
            {/* right arm (waves) */}
            <g ref={arm}>
              <path d="M256 330 C280 342 290 400 288 452 C287 492 284 520 280 546 L252 546 C257 510 257 470 253 432 C249 396 240 362 240 346 Z" fill={JACKET} {...line} />
              <path d="M281 544 Q292 576 276 592 Q258 600 248 580 Q246 560 252 544 Z" fill={SKIN} {...line} />
              <path d="M272 560 Q276 572 270 580" {...line} strokeWidth={3.5} fill="none" />
            </g>

            {/* head, tilting from the base of the neck */}
            <g ref={head}>
              <path d="M183 262 L183 314 L217 314 L217 262 Z" fill={SKIN} {...line} />
              <path d="M184 272 L216 272 L216 292 Q200 302 184 292 Z" fill={SKIN_SHADE} />
              {/* ears */}
              <path d="M141 168 C119 156 112 204 140 214 Z" fill={SKIN} {...line} />
              <path d="M259 168 C281 156 288 204 260 214 Z" fill={SKIN} {...line} />
              {/* face with a slightly angular jaw */}
              <path d="M138 150 C134 192 139 230 161 256 Q182 283 200 286 Q218 283 239 256 C261 230 266 192 262 150 C258 96 142 96 138 150 Z" fill={SKIN} {...line} />
              {/* stubble */}
              <path d="M152 234 Q166 266 200 284 Q234 266 248 234 Q232 262 200 272 Q168 262 152 234 Z" fill={SKIN_SHADE} opacity={0.55} />
              {/* big grin */}
              <path d="M170 240 Q200 250 232 238 Q228 274 201 276 Q174 273 170 240 Z" fill={MOUTH} {...line} />
              <path d="M173 243 Q200 252 229 241 L227 252 Q200 259 175 254 Z" fill="#fffdf6" />
              <path d="M188 268 Q201 261 214 268 Q201 274 188 268 Z" fill="#c9585a" />
              {/* light moustache */}
              <path d="M176 234 Q200 224 224 234 Q200 230 176 234 Z" fill={HAIR} opacity={0.8} />
              {/* nose */}
              <path d="M204 188 C201 204 192 213 196 221 C200 228 212 226 216 219" {...line} fill="none" />
              {/* eyes: big ovals with dot pupils that follow the cursor */}
              {[176, 224].map((cx, n) => (
                <g key={cx} transform={`translate(${cx} 180)`}>
                  <g ref={(g) => void (g && (eyes.current[n] = g))}>
                    <ellipse rx={19} ry={24} fill="#fbf8f0" {...line} />
                    <circle ref={(c) => void (c && (pupils.current[n] = c))} r={6.5} fill={INK} />
                    <path d="M-19 -2 Q-18 -26 0 -26 Q18 -26 19 -2" fill="none" {...line} strokeWidth={7} />
                  </g>
                </g>
              ))}
              {/* thick eyebrows */}
              <path d="M150 145 Q170 132 192 142" fill="none" stroke={HAIR} strokeWidth={10} strokeLinecap="round" />
              <path d="M208 142 Q230 132 250 145" fill="none" stroke={HAIR} strokeWidth={10} strokeLinecap="round" />
              {/* curly hair */}
              <path d={HAIR_PATH} fill={HAIR} {...line} />
              <path d="M170 76 q8 -6 14 2 M214 70 q9 -5 14 3 M244 96 q8 -2 10 7 M150 100 q4 -8 12 -6" stroke="#4a3a33" strokeWidth={3} fill="none" strokeLinecap="round" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}
