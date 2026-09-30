import { useEffect, useMemo, useRef } from 'react'
import { prefersReducedMotion, sectionProgress } from '../lib/sections'

// A cartoon Bali beach at golden hour, drawn in the same flat, thick-outlined
// style as the character. Props nod to Shreyas's story: a SeaLens surfboard,
// fish jumping out of the reef, a camera on a tripod (photography and video),
// a football, and a signpost for Melbourne, Bali and Jakarta.

const INK = '#120d0a'
const SKY_TOP = '#f3b872'
const SKY_LOW = '#fbe2b4'
const SUN = '#ffd680'
const MOUNTAIN = '#a9a0b9'
const MOUNTAIN_SHADE = '#8d85a1'
const HILL = '#8a9bb0'
const SEA = '#35a2b1'
const SEA_DEEP = '#26808f'
const FOAM = '#f5fbf4'
const SAND = '#f1d69e'
const SAND_SHADE = '#e0bf80'
const TRUNK = '#9b6a3e'
const TRUNK_SHADE = '#7c5230'
const LEAF = '#3f9a58'
const LEAF_SHADE = '#2f7a44'
const WOOD = '#b98150'

const line = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const thin = { ...line, strokeWidth: 3.5 }

type Frame = { blur: number; wash: number; scale: number }
// Sharp in the hero and contact; zoomed, blurred and washed out behind text.
const FRAMES: Frame[] = [
  { blur: 0, wash: 0, scale: 1 },
  { blur: 6, wash: 0.55, scale: 1.08 },
  { blur: 7, wash: 0.6, scale: 1.12 },
  { blur: 7, wash: 0.6, scale: 1.12 },
  { blur: 0, wash: 0.1, scale: 1 },
]

function Cloud({ x, y, s, dur, delay, animate }: { x: number; y: number; s: number; dur: number; delay: number; animate: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g>
        {animate && (
          <animateTransform attributeName="transform" type="translate" values="-260 0; 1900 0" dur={`${dur}s`} begin={`-${delay}s`} repeatCount="indefinite" />
        )}
        <path d="M0 50 Q-4 18 30 20 Q38 -6 72 2 Q92 -18 122 4 Q150 -4 160 22 Q196 22 192 50 Z" fill="#fff5e2" {...line} />
        <path d="M14 50 Q60 40 110 46 Q150 42 180 50 Z" fill="#f4dfc1" />
      </g>
    </g>
  )
}

const FRONDS: [number, 1 | -1][] = [
  [-14, 1],
  [24, 1],
  [58, 1],
  [-14, -1],
  [24, -1],
  [58, -1],
  [-58, 1],
]

function Palm({ x, y, s, flip = 1, animate }: { x: number; y: number; s: number; flip?: 1 | -1; animate: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
      <path d="M-20 0 Q-10 -210 36 -410 L58 -404 Q18 -206 18 0 Z" fill={TRUNK} {...line} />
      <path d="M4 0 Q8 -206 48 -406 L58 -404 Q18 -206 18 0 Z" fill={TRUNK_SHADE} />
      {[-60, -130, -200, -270, -340].map((h, i) => (
        <path key={h} d={`M${-16 + i * 7} ${h} q16 8 ${32 - i} 0`} {...thin} fill="none" />
      ))}
      <g transform="translate(46 -408)">
        {animate && (
          <animateTransform attributeName="transform" type="rotate" values="-3; 3; -3" additive="sum" dur="5.5s" repeatCount="indefinite" />
        )}
        {FRONDS.map(([angle, side], i) => (
          <g key={i} transform={`scale(${side} 1) rotate(${angle})`}>
            <path
              d="M0 0 Q90 -62 214 22 L186 14 L176 34 L148 16 L132 36 L104 14 L88 32 L62 10 Q30 10 0 0 Z"
              fill={i % 2 ? LEAF_SHADE : LEAF}
              {...thin}
            />
          </g>
        ))}
        <circle cx={-10} cy={14} r={13} fill="#6b4a2b" {...thin} />
        <circle cx={12} cy={18} r={13} fill="#6b4a2b" {...thin} />
        <circle cx={0} cy={0} r={12} fill="#6b4a2b" {...thin} />
      </g>
    </g>
  )
}

// A fish that leaps out of the water every few seconds.
function JumpingFish({ x, y, dur, delay, flip = 1, animate }: { x: number; y: number; dur: number; delay: number; flip?: 1 | -1; animate: boolean }) {
  if (!animate) return null
  const arc = flip === 1 ? 'M0 0 Q60 -150 120 0' : 'M0 0 Q-60 -150 -120 0'
  const land = flip * 120
  const timing = { dur: `${dur}s`, begin: `${delay}s`, repeatCount: 'indefinite' }
  return (
    <g transform={`translate(${x} ${y})`}>
      <g opacity={0}>
        <animateMotion path={arc} rotate="auto" keyPoints="0;1;1" keyTimes="0;0.16;1" calcMode="linear" {...timing} />
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.16;0.17;1" {...timing} />
        <g transform={`scale(${flip === 1 ? 1 : -1} ${flip === 1 ? 1 : -1})`}>
          <path d="M-34 0 L-50 -14 L-48 14 Z" fill="#f08a3a" {...thin} />
          <ellipse cx={0} cy={0} rx={34} ry={17} fill="#f7a14a" {...thin} />
          <path d="M8 -15 Q2 0 8 15" {...thin} fill="none" />
          <circle cx={20} cy={-4} r={3.5} fill={INK} />
        </g>
      </g>
      {[0, land].map((cx, i) => (
        <ellipse key={cx} cx={cx} cy={4} rx={0} ry={0} fill="none" stroke={FOAM} strokeWidth={4}>
          <animate attributeName="rx" values={i ? '0;0;34;46' : '0;30;42;0'} keyTimes={i ? '0;0.15;0.25;1' : '0;0.06;0.1;1'} {...timing} />
          <animate attributeName="ry" values={i ? '0;0;8;11' : '0;7;10;0'} keyTimes={i ? '0;0.15;0.25;1' : '0;0.06;0.1;1'} {...timing} />
          <animate attributeName="opacity" values={i ? '0;0;1;0' : '0;1;0;0'} keyTimes={i ? '0;0.15;0.2;0.3' : '0;0.03;0.1;1'} {...timing} />
        </ellipse>
      ))}
    </g>
  )
}

function Waves({ y, color, dur, animate }: { y: number; color: string; dur: number; animate: boolean }) {
  const d = `M-120 ${y} ` + Array.from({ length: 30 }, () => 'q20 -10 40 0 t40 0').join(' ')
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round">
      {animate && <animateTransform attributeName="transform" type="translate" values="0 0; 80 0" dur={`${dur}s`} repeatCount="indefinite" />}
    </path>
  )
}

function Gull({ x, y, dur, delay, animate }: { x: number; y: number; dur: number; delay: number; animate: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        {animate && (
          <animateTransform attributeName="transform" type="translate" values="-400 0; 1100 -60" dur={`${dur}s`} begin={`-${delay}s`} repeatCount="indefinite" />
        )}
        <path d="M-18 0 Q-9 -10 0 0 Q9 -10 18 0" fill="none" {...thin}>
          {animate && <animate attributeName="d" values="M-18 0 Q-9 -10 0 0 Q9 -10 18 0; M-18 -6 Q-9 2 0 0 Q9 2 18 -6; M-18 0 Q-9 -10 0 0 Q9 -10 18 0" dur="0.9s" repeatCount="indefinite" />}
        </path>
      </g>
    </g>
  )
}

function SignBoard({ y, label, dir, w }: { y: number; label: string; dir: 1 | -1; w: number }) {
  const tip = dir * (w / 2 + 22)
  return (
    <g transform={`translate(0 ${y})`}>
      <path
        d={dir === 1 ? `M${-w / 2} -18 L${w / 2} -18 L${tip} 0 L${w / 2} 18 L${-w / 2} 18 Z` : `M${w / 2} -18 L${-w / 2} -18 L${tip} 0 L${-w / 2} 18 L${w / 2} 18 Z`}
        fill={WOOD}
        {...thin}
      />
      <text x={dir * 6} y={8} textAnchor="middle" fontSize={24} fill={INK} className="font-display">
        {label}
      </text>
    </g>
  )
}

export default function Backdrop() {
  const wrapper = useRef<HTMLDivElement>(null)
  const wash = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const animate = useMemo(() => !prefersReducedMotion(), [])

  useEffect(() => {
    let frame = 0
    let paused = false
    const tick = () => {
      const p = sectionProgress()
      const i = Math.min(Math.floor(p), FRAMES.length - 2)
      const x = p - i
      const f = x * x * (3 - 2 * x)
      const a = FRAMES[i]
      const b = FRAMES[i + 1]
      const blur = a.blur + (b.blur - a.blur) * f
      if (wrapper.current) {
        wrapper.current.style.transform = `scale(${a.scale + (b.scale - a.scale) * f})`
        wrapper.current.style.filter = blur > 0.2 ? `blur(${blur}px)` : 'none'
      }
      if (wash.current) wash.current.style.opacity = String(a.wash + (b.wash - a.wash) * f)
      // Pause the SVG animations while they're blurred out, to save work.
      const shouldPause = blur > 3
      if (svg.current && shouldPause !== paused) {
        if (shouldPause) svg.current.pauseAnimations()
        else svg.current.unpauseAnimations()
        paused = shouldPause
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div ref={wrapper} className="h-full w-full origin-bottom will-change-transform">
        <svg ref={svg} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={SKY_TOP} />
              <stop offset="1" stopColor={SKY_LOW} />
            </linearGradient>
          </defs>

          {/* sky, sun and clouds */}
          <rect width={1600} height={540} fill="url(#sky)" />
          <circle cx={1170} cy={440} r={170} fill={SUN} opacity={0.35} />
          <circle cx={1170} cy={440} r={115} fill={SUN} {...line} />
          <Cloud x={0} y={120} s={1.1} dur={140} delay={30} animate={animate} />
          <Cloud x={0} y={220} s={0.75} dur={110} delay={80} animate={animate} />
          <Cloud x={0} y={70} s={0.6} dur={170} delay={130} animate={animate} />
          <Gull x={0} y={260} dur={38} delay={4} animate={animate} />
          <Gull x={40} y={235} dur={38} delay={4.6} animate={animate} />

          {/* Mount Agung and hills on the horizon */}
          <path d="M280 530 L500 318 Q524 298 548 318 L790 530 Z" fill={MOUNTAIN} {...line} />
          <path d="M524 306 Q548 316 560 330 L790 530 L640 530 Q600 420 524 306 Z" fill={MOUNTAIN_SHADE} />
          <path d="M488 332 Q504 346 520 334 Q536 348 552 332 Q540 316 524 304 Q506 314 488 332 Z" fill="#f4efe6" {...thin} />
          <path d="M660 530 Q790 440 960 530 Z" fill={HILL} {...line} />

          {/* sea */}
          <rect y={528} width={1600} height={130} fill={SEA} />
          <rect y={528} width={1600} height={26} fill={SEA_DEEP} />
          <path d="M0 530 L1600 530" {...line} />
          <path d="M1030 560 L1310 560 M1080 580 L1260 580 M1130 600 L1210 600" stroke="#ffe9a8" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
          <Waves y={590} color="#7fd0d8" dur={5} animate={animate} />
          <Waves y={622} color="#9fdde2" dur={3.6} animate={animate} />
          <JumpingFish x={1300} y={600} dur={7} delay={1.2} animate={animate} />
          <JumpingFish x={330} y={612} dur={9} delay={4.5} flip={-1} animate={animate} />

          {/* shoreline foam and sand */}
          <path d="M0 648 Q200 630 400 648 T800 646 T1200 650 T1600 640 L1600 668 L0 668 Z" fill={FOAM}>
            {animate && <animateTransform attributeName="transform" type="translate" values="0 0; 0 7; 0 0" dur="4s" repeatCount="indefinite" />}
          </path>
          <path d="M0 660 Q200 642 400 660 T800 658 T1200 662 T1600 652 L1600 900 L0 900 Z" fill={SAND} {...line} />
          <path d="M0 760 Q300 730 620 770 Q900 800 1200 760 Q1420 736 1600 770 L1600 900 L0 900 Z" fill={SAND_SHADE} />
          {[
            [220, 700],
            [700, 692],
            [1420, 700],
            [980, 880],
          ].map(([sx, sy]) => (
            <path key={sx} d={`M${sx} ${sy} q10 -12 20 0 q-10 4 -20 0 Z`} fill="#f7c9b8" {...thin} />
          ))}

          {/* palms */}
          <Palm x={120} y={800} s={1.05} animate={animate} />
          <Palm x={1500} y={790} s={0.95} flip={-1} animate={animate} />
          <Palm x={1340} y={690} s={0.55} flip={-1} animate={animate} />

          {/* signpost: Melbourne, Bali, Jakarta */}
          <g transform="translate(330 812)">
            <rect x={-9} y={-250} width={18} height={250} fill={WOOD} {...line} />
            <SignBoard y={-222} label="melbourne" dir={-1} w={150} />
            <SignBoard y={-172} label="bali" dir={1} w={96} />
            <SignBoard y={-122} label="jakarta" dir={1} w={124} />
          </g>

          {/* SeaLens surfboard stuck in the sand */}
          <g transform="translate(540 836) rotate(-9)">
            <path d="M0 0 Q-44 -170 0 -340 Q44 -170 0 0 Z" fill="#fdf7e6" {...line} />
            <path d="M-6 -12 Q-24 -170 -6 -326 L6 -326 Q24 -170 6 -12 Z" fill="#e2553d" />
            <text transform="translate(-12 -110) rotate(-90)" fontSize={30} fill="#fdf7e6" className="font-display">
              sealens
            </text>
            <g transform="translate(0 -270) scale(0.55)">
              <path d="M-34 0 L-50 -14 L-48 14 Z" fill="#fdf7e6" />
              <ellipse rx={32} ry={16} fill="#fdf7e6" />
            </g>
            <path d="M-40 4 Q0 -18 40 4 Z" fill={SAND_SHADE} {...thin} />
          </g>

          {/* football */}
          <g transform="translate(1065 826)">
            <circle r={28} fill="#fffdf6" {...line} />
            <path d="M0 -10 L10 -3 L6 9 L-6 9 L-10 -3 Z" fill={INK} />
            <path d="M0 -10 L0 -27 M10 -3 L25 -9 M6 9 L15 22 M-6 9 L-15 22 M-10 -3 L-25 -9" {...thin} strokeWidth={3} />
          </g>

          {/* camera on a tripod, recording */}
          <g transform="translate(1210 824)">
            <path d="M0 -170 L-56 0 M0 -170 L56 0 M0 -170 L6 -10" {...line} />
            <rect x={-46} y={-230} width={92} height={60} rx={8} fill="#2c2c33" {...line} />
            <rect x={-30} y={-246} width={32} height={18} rx={4} fill="#2c2c33" {...thin} />
            <circle cx={-6} cy={-200} r={21} fill="#4b5563" {...thin} />
            <circle cx={-6} cy={-200} r={10} fill="#8fd3e8" {...thin} />
            <circle cx={30} cy={-218} r={6} fill="#e5483b">
              {animate && <animate attributeName="opacity" values="1;1;0.15;0.15" keyTimes="0;0.5;0.55;1" dur="1.4s" repeatCount="indefinite" />}
            </circle>
          </g>
        </svg>
      </div>
      {/* Beige wash that fades the scene back behind the text sections. */}
      <div ref={wash} className="absolute inset-0 bg-paper opacity-0" />
    </div>
  )
}
