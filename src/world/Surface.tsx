import { forwardRef } from 'react'

// The surface: a small island off Bali at golden hour, with the sea in front.
// Props nod to Shreyas's story: a SeaLens surfboard, fish jumping out of the
// reef, a camera on a tripod (photography and video), a football, and a
// signpost for Melbourne, Bali and Jakarta. Its bottom edge is water in
// SEA_FRONT, which the underwater world below continues from.

const INK = '#120d0a'
const SKY_TOP = '#f3b872'
const SKY_LOW = '#fbe2b4'
const SUN = '#ffd680'
const MOUNTAIN = '#a9a0b9'
const MOUNTAIN_SHADE = '#8d85a1'
const HILL = '#8a9bb0'
const SEA = '#35a2b1'
const SEA_DEEP = '#26808f'
export const SEA_FRONT = '#2b93a6'
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

// Island surface height, in viewBox units (0-900 top to bottom). The
// character's feet are placed at 78% of the screen height to match.
const Surface = forwardRef<SVGSVGElement, { animate: boolean }>(function Surface({ animate }, ref) {
  return (
    <svg ref={ref} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 top-0 h-screen w-full">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY_TOP} />
          <stop offset="1" stopColor={SKY_LOW} />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SEA} />
          <stop offset="1" stopColor={SEA_FRONT} />
        </linearGradient>
      </defs>

      {/* sky, sun, clouds, gulls */}
      <rect width={1600} height={600} fill="url(#sky)" />
      <circle cx={1270} cy={540} r={160} fill={SUN} opacity={0.35} />
      <circle cx={1270} cy={540} r={105} fill={SUN} {...line} />
      <Cloud x={0} y={110} s={1.1} dur={140} delay={30} animate={animate} />
      <Cloud x={0} y={210} s={0.75} dur={110} delay={80} animate={animate} />
      <Cloud x={0} y={60} s={0.6} dur={170} delay={130} animate={animate} />
      <Gull x={0} y={250} dur={38} delay={4} animate={animate} />
      <Gull x={40} y={225} dur={38} delay={4.6} animate={animate} />

      {/* Mount Agung and hills on the horizon */}
      <path d="M40 572 L260 360 Q284 340 308 360 L550 572 Z" fill={MOUNTAIN} {...line} />
      <path d="M284 348 Q308 358 320 372 L550 572 L400 572 Q360 462 284 348 Z" fill={MOUNTAIN_SHADE} />
      <path d="M248 374 Q264 388 280 376 Q296 390 312 374 Q300 358 284 346 Q266 356 248 374 Z" fill="#f4efe6" {...thin} />
      <path d="M430 572 Q560 492 720 572 Z" fill={HILL} {...line} />
      <path d="M1400 572 Q1470 540 1560 572 Z" fill={HILL} {...line} />

      {/* open sea */}
      <rect y={570} width={1600} height={330} fill="url(#sea)" />
      <rect y={570} width={1600} height={22} fill={SEA_DEEP} />
      <path d="M0 572 L1600 572" {...line} />
      <path d="M1130 606 L1410 606 M1180 626 L1360 626" stroke="#ffe9a8" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
      <Waves y={630} color="#7fd0d8" dur={5} animate={animate} />
      <Waves y={680} color="#9fdde2" dur={3.6} animate={animate} />
      <JumpingFish x={1400} y={660} dur={7} delay={1.2} animate={animate} />
      <JumpingFish x={200} y={670} dur={9} delay={4.5} flip={-1} animate={animate} />

      {/* the island */}
      <path d="M290 900 L340 780 Q450 692 800 666 Q1150 692 1260 780 L1310 900 Z" fill={SAND} {...line} />
      <path d="M1000 686 Q1150 700 1250 776 L1300 900 L1130 900 Q1140 780 1000 686 Z" fill={SAND_SHADE} />
      {[
        [470, 716],
        [700, 684],
        [1120, 712],
      ].map(([gx, gy]) => (
        <path key={gx} d={`M${gx} ${gy} l6 -20 l6 20 l6 -15 l5 15 l6 -22 l5 22`} fill="none" stroke="#3f9a58" strokeWidth={4} strokeLinejoin="round" />
      ))}

      <Palm x={430} y={770} s={0.78} animate={animate} />
      <Palm x={1175} y={772} s={0.72} flip={-1} animate={animate} />

      {/* signpost: Melbourne, Bali, Jakarta */}
      <g transform="translate(548 738) scale(0.72)">
        <rect x={-9} y={-250} width={18} height={250} fill={WOOD} {...line} />
        <SignBoard y={-222} label="melbourne" dir={-1} w={150} />
        <SignBoard y={-172} label="bali" dir={1} w={96} />
        <SignBoard y={-122} label="jakarta" dir={1} w={124} />
      </g>

      {/* SeaLens surfboard stuck in the sand */}
      <g transform="translate(650 716) rotate(-12) scale(0.72)">
        <path d="M0 0 Q-44 -170 0 -340 Q44 -170 0 0 Z" fill="#fdf7e6" {...line} />
        <path d="M-6 -12 Q-24 -170 -6 -326 L6 -326 Q24 -170 6 -12 Z" fill="#e2553d" />
        <text transform="translate(-12 -110) rotate(-90)" fontSize={30} fill="#fdf7e6" className="font-display">
          sealens
        </text>
        <path d="M-40 4 Q0 -18 40 4 Z" fill={SAND_SHADE} {...thin} />
      </g>

      {/* football */}
      <g transform="translate(985 690) scale(0.8)">
        <circle r={28} fill="#fffdf6" {...line} />
        <path d="M0 -10 L10 -3 L6 9 L-6 9 L-10 -3 Z" fill={INK} />
        <path d="M0 -10 L0 -27 M10 -3 L25 -9 M6 9 L15 22 M-6 9 L-15 22 M-10 -3 L-25 -9" {...thin} strokeWidth={3} />
      </g>

      {/* camera on a tripod, recording */}
      <g transform="translate(1085 724) scale(0.72)">
        <path d="M0 -170 L-56 0 M0 -170 L56 0 M0 -170 L6 -10" {...line} />
        <rect x={-46} y={-230} width={92} height={60} rx={8} fill="#2c2c33" {...line} />
        <rect x={-30} y={-246} width={32} height={18} rx={4} fill="#2c2c33" {...thin} />
        <circle cx={-6} cy={-200} r={21} fill="#4b5563" {...thin} />
        <circle cx={-6} cy={-200} r={10} fill="#8fd3e8" {...thin} />
        <circle cx={30} cy={-218} r={6} fill="#e5483b">
          {animate && <animate attributeName="opacity" values="1;1;0.15;0.15" keyTimes="0;0.5;0.55;1" dur="1.4s" repeatCount="indefinite" />}
        </circle>
      </g>

      {/* the sea in front of the island, closest to us */}
      <g>
        {animate && <animateTransform attributeName="transform" type="translate" values="0 0; 0 6; 0 0" dur="4.5s" repeatCount="indefinite" />}
        <path d="M-40 792 Q60 776 160 792 T360 792 T560 792 T760 792 T960 792 T1160 792 T1360 792 T1560 792 T1760 792 L1760 920 L-40 920 Z" fill={SEA_FRONT} opacity={0.9} />
        <path d="M-40 792 Q60 776 160 792 T360 792 T560 792 T760 792 T960 792 T1160 792 T1360 792 T1560 792 T1760 792" fill="none" stroke={FOAM} strokeWidth={7} strokeLinecap="round" />
      </g>
      <Waves y={840} color="#6cc3cf" dur={4.2} animate={animate} />
      <Waves y={880} color="#5ab4c3" dur={3} animate={animate} />
      <rect y={895} width={1600} height={10} fill={SEA_FRONT} />
    </svg>
  )
})

export default Surface
