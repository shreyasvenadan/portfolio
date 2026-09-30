import { useEffect, useRef } from 'react'
import { prefersReducedMotion, sectionProgress } from '../lib/sections'

// Shreyas drawn in the style of the cartoon "Stoked": long angular face and
// neck, half-lidded almond eyes, a lopsided grin, flat colour with one hard
// shadow tone, and thin Flash-style outlines. Outfit follows his reference
// art: black quarter-zip with a striped collar, a crossbody strap and a crest.

const INK = '#15110e'
const SKIN = '#c47a45'
const SKIN_SHADE = '#a1602f'
const HAIR = '#1d140f'
const HAIR_MID = '#3d2a1e'
const HAIR_TIPS = '#c29a62'
const TOP = '#1d1d22'
const TOP_SHADE = '#121216'
const STRAP = '#0f0f12'
const BUCKLE = '#3b3b42'
const JEANS = '#343a4a'
const JEANS_SHADE = '#262b38'
const SHOE = '#ece8dc'
const MOUTH = '#6a2420'

const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

// Bumpy outline along an elliptical arc; used to build the curly hair.
function scallops(cx: number, cy: number, rx: number, ry: number, from: number, to: number, count: number, bump: number) {
  const point = (a: number, grow = 0) => [cx + (rx + grow) * Math.cos(a), cy - (ry + grow) * Math.sin(a)]
  let d = ''
  for (let i = 0; i < count; i++) {
    const a0 = from + ((to - from) * i) / count
    const a1 = from + ((to - from) * (i + 1)) / count
    const [x0, y0] = point(a0)
    const [qx, qy] = point((a0 + a1) / 2, bump * (i % 2 ? 0.7 : 1))
    const [x1, y1] = point(a1)
    d += `${i === 0 ? `M${x0.toFixed(1)} ${y0.toFixed(1)}` : ''} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `
  }
  return d
}

// Curly mop: a scalloped dome, then curls hanging over the forehead.
const deg = Math.PI / 180
const HAIR_PATH = (() => {
  let d = scallops(200, 108, 94, 86, 196 * deg, -16 * deg, 12, 22)
  const fringe = [
    [282, 136],
    [262, 106],
    [240, 99],
    [216, 94],
    [191, 97],
    [167, 101],
    [143, 108],
    [118, 136],
  ]
  for (let i = 1; i < fringe.length; i++) {
    const [x0, y0] = fringe[i - 1]
    const [x1, y1] = fringe[i]
    d += `Q${(x0 + x1) / 2 + 4} ${Math.max(y0, y1) + 20} ${x1} ${y1} `
  }
  return `${d}Z`
})()

// Small curl strokes: dark ones for texture, sandy ones for the frosted tips.
const CURLS = [
  [146, 80],
  [184, 54],
  [230, 58],
  [262, 84],
  [168, 96],
  [212, 76],
  [240, 94],
]
const curl = ([x, y]: number[]) => `M${x} ${y} a7 7 0 1 1 11 6`

type Frame = { scale: number; y: number; blur: number }
// Per section: hero full body, then zoomed in and blurred behind the text,
// then back to a smaller, sharp full body for contact.
const FRAMES: Frame[] = [
  { scale: 1, y: 0, blur: 0 },
  { scale: 2.9, y: 40, blur: 10 },
  { scale: 2.1, y: 14, blur: 9 },
  { scale: 1.6, y: -4, blur: 8 },
  { scale: 0.82, y: -14, blur: 0 },
]

const blink = (t: number) => {
  const phase = t % 4.3
  return phase < 0.14 ? Math.sin((phase / 0.14) * Math.PI) : 0
}

// Almond eye shapes around (0, 0); `side` mirrors for the right eye.
const eyeShape = (side: 1 | -1) => `M${-20 * side} 0 Q${-2 * side} -14 ${18 * side} -4 Q0 11 ${-20 * side} 0 Z`
const lidShape = (side: 1 | -1) => `M${-22 * side} 1 Q${-2 * side} -18 ${20 * side} -5`

export default function StokedMe() {
  const wrapper = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const body = useRef<SVGGElement>(null)
  const head = useRef<SVGGElement>(null)
  const eyes = useRef<SVGGElement[]>([])
  const irises = useRef<SVGGElement[]>([])
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

      // Eyes and head turn toward the cursor.
      const box = svg.current?.getBoundingClientRect()
      if (box) {
        const dx = pointer.x - (box.left + box.width / 2)
        const dy = pointer.y - (box.top + box.height * 0.16)
        const len = Math.hypot(dx, dy) || 1
        const reach = Math.min(1, len / 400)
        look.x += ((dx / len) * reach - look.x) * 0.12
        look.y += ((dy / len) * reach - look.y) * 0.12
      }
      irises.current.forEach((iris) => iris.setAttribute('transform', `translate(${look.x * 6} ${look.y * 2.5})`))
      head.current?.setAttribute('transform', `rotate(${look.x * 4} 200 250) translate(${look.x * 4} ${look.y * 2})`)

      const shut = blink(t)
      eyes.current.forEach((eye) => eye.setAttribute('transform', `scale(1 ${1 - shut * 0.9})`))

      if (!still) {
        body.current?.setAttribute('transform', `translate(0 ${Math.sin(t * 1.6) * 4})`)
        // Every 9 seconds, throw up a shaka.
        const phase = t % 9
        const up = phase < 2.4 ? Math.sin((phase / 2.4) * Math.PI) : 0
        arm.current?.setAttribute('transform', `rotate(${-up * 145 + up * Math.sin(t * 9) * 10} 278 356)`)
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
      <div ref={wrapper} className="h-[92svh] origin-[50%_18%] will-change-transform">
        <svg ref={svg} viewBox="0 0 400 920" className="h-full w-auto overflow-visible">
          <defs>
            {[1, -1].map((side) => (
              <clipPath key={side} id={`eye-${side}`}>
                <path d={eyeShape(side as 1 | -1)} />
              </clipPath>
            ))}
          </defs>
          <g ref={body}>
            {/* legs */}
            <path d="M134 574 L198 584 L193 832 L150 832 Z" fill={JEANS} {...line} />
            <path d="M202 584 L266 574 L250 832 L207 832 Z" fill={JEANS} {...line} />
            <path d="M188 584 L212 584 L200 628 Z" fill={JEANS_SHADE} />
            {/* sneakers */}
            <path d="M148 826 Q138 860 150 874 L206 874 Q212 856 196 826 Z" fill={SHOE} {...line} />
            <path d="M204 826 Q188 856 194 874 L250 874 Q262 860 252 826 Z" fill={SHOE} {...line} />
            <path d="M149 862 L207 862 M193 862 L251 862" {...line} strokeWidth={3} />

            {/* long neck with the hard shadow under the jaw */}
            <path d="M173 214 L173 334 L227 334 L227 214 Z" fill={SKIN} />
            <path d="M173 214 L200 284 L227 214 L227 306 Q200 322 173 306 Z" fill={SKIN_SHADE} />
            <path d="M173 250 L173 334 M227 250 L227 334" {...line} />

            {/* black quarter-zip */}
            <path d="M116 372 Q132 344 172 334 L228 334 Q268 344 284 372 L284 584 Q200 598 116 584 Z" fill={TOP} {...line} />
            <path d="M240 356 Q272 360 278 392 L280 580 Q258 588 244 588 Z" fill={TOP_SHADE} />
            {/* standing collar with red and green piping, and the zip */}
            <path d="M166 318 L170 350 L200 376 L230 350 L234 318 L221 326 L200 358 L179 326 Z" fill={TOP} {...line} />
            <path d="M168 322 L180 329 M232 322 L220 329" stroke="#c0392b" strokeWidth={3} strokeLinecap="round" />
            <path d="M168 327 L180 334 M232 327 L220 334" stroke="#2e7d4f" strokeWidth={3} strokeLinecap="round" />
            <path d="M200 376 L200 436" stroke={BUCKLE} strokeWidth={3} />
            {/* crest on the chest */}
            <path d="M236 420 L256 420 L256 438 Q246 450 236 438 Z M241 426 L251 426 M241 432 L251 432" fill="none" stroke="#d8d4c8" strokeWidth={2.5} strokeLinejoin="round" />
            {/* crossbody strap with buckles */}
            <path d="M250 342 L266 352 L158 568 L142 558 Z" fill={STRAP} {...line} strokeWidth={3} />
            <path d="M218 398 L236 408 L228 424 L210 414 Z M194 448 L212 458 L204 474 L186 464 Z" fill={BUCKLE} {...line} strokeWidth={2.5} />

            {/* left arm, hanging relaxed */}
            <g transform="translate(-12 4)">
            <path d="M136 356 C114 372 106 430 108 480 C109 518 112 546 116 572 L144 572 C139 536 139 496 143 458 C147 420 156 386 158 368 Z" fill={TOP} {...line} />
            <path d="M115 570 Q104 602 120 618 Q138 626 148 606 Q150 586 144 570 Z" fill={SKIN} {...line} />
            <path d="M124 586 Q120 598 126 606" {...line} strokeWidth={3} fill="none" />
            </g>
            {/* right arm: hangs loose, then lifts into a shaka */}
            <g ref={arm}>
              <g transform="translate(12 4)">
              <path d="M264 356 C286 372 294 430 292 480 C291 518 288 546 284 572 L256 572 C261 536 261 496 257 458 C253 420 244 386 242 368 Z" fill={TOP} {...line} />
              <path d="M256 570 Q252 598 268 604 Q286 604 286 574 Z" fill={SKIN} {...line} />
              <path d="M258 576 L240 564 Q234 560 238 555 Q242 552 248 556 L262 566" fill={SKIN} {...line} />
              <path d="M282 594 L298 612 Q302 618 297 621 Q293 623 289 618 L276 602" fill={SKIN} {...line} />
              </g>
            </g>

            {/* head, tilting from the top of the neck */}
            <g ref={head}>
              <g transform="translate(0 -4)">
                {/* ears */}
                <path d="M142 150 C122 140 118 186 144 192 Z" fill={SKIN} {...line} />
                <path d="M258 150 C278 140 282 186 256 192 Z" fill={SKIN} {...line} />
                <path d="M136 160 Q132 170 140 178 M264 160 Q268 170 260 178" {...line} strokeWidth={3} fill="none" />
                {/* long angular face with a pointed chin */}
                <path d="M140 120 L142 178 L162 238 L202 268 L240 238 L258 178 L260 120 C254 72 146 72 140 120 Z" fill={SKIN} {...line} />
                {/* hard cheek shadow on one side */}
                <path d="M240 238 L258 178 L259 150 Q246 196 228 232 L202 268 Z" fill={SKIN_SHADE} />
                {/* lopsided grin */}
                <path d="M166 214 Q200 224 240 206 Q230 242 201 242 Q178 240 166 214 Z" fill={MOUTH} {...line} />
                <path d="M168 215 Q200 225 238 208 L233 219 Q200 232 172 225 Z" fill="#fffdf6" />
                <path d="M240 206 L246 200" {...line} strokeWidth={3} />
                <path d="M188 252 Q201 256 214 250" {...line} strokeWidth={3} fill="none" />
                {/* angular nose */}
                <path d="M206 150 L194 190 L206 196" {...line} fill="none" />
                <path d="M210 192 L216 188" {...line} strokeWidth={3} />
                {/* half-lidded almond eyes; the irises follow the cursor */}
                {([1, -1] as const).map((side, n) => (
                  <g key={side} transform={`translate(${side === 1 ? 172 : 228} 156)`}>
                    <g ref={(g) => void (g && (eyes.current[n] = g))}>
                      <path d={eyeShape(side)} fill="#fbf8f0" />
                      <g clipPath={`url(#eye-${side})`}>
                        <g ref={(g) => void (g && (irises.current[n] = g))}>
                          <circle cx={side * 1} cy={-1} r={9} fill={INK} />
                          <circle cx={side * 1 + 3} cy={-4} r={2.2} fill="#fbf8f0" />
                        </g>
                      </g>
                      <path d={lidShape(side)} fill="none" {...line} strokeWidth={5} />
                    </g>
                  </g>
                ))}
                {/* thick straight brows */}
                <path d="M146 134 L191 125 L193 132 L149 142 Z" fill={HAIR} />
                <path d="M254 134 L209 125 L207 132 L251 142 Z" fill={HAIR} />
                {/* curly hair with sandy frosted tips */}
                <path d={HAIR_PATH} fill={HAIR} {...line} />
                <path d={CURLS.slice(0, 4).map(curl).join(' ')} stroke={HAIR_MID} strokeWidth={4} fill="none" strokeLinecap="round" />
                <path d={CURLS.slice(4).map(curl).join(' ')} stroke={HAIR_TIPS} strokeWidth={4.5} fill="none" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}
