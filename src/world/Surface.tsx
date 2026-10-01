import { forwardRef } from 'react'

// Deterministic pseudo-random numbers so the stars land in the same spots every load.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = seeded(5)
const STARS = Array.from({ length: 70 }, () => ({ x: rand() * 1600, y: rand() * 500, r: 1.5 + rand() * 2.5, delay: rand() * 4 }))

// The surface: a small island off Bali at golden hour, with the sea in front.
// Props nod to Shreyas's story: a camera on a tripod (photography and video),
// a football, and a signpost for Melbourne, Bali and Jakarta. Its bottom edge
// is water in SEA_FRONT, which the underwater world below continues from.

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

function Palm({ id, x, y, s, flip = 1, animate }: { id?: string; x: number; y: number; s: number; flip?: 1 | -1; animate: boolean }) {
  return (
    <g id={id} transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
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
        {/* Coconuts can be knocked down (src/lib/coconut.ts); they land at the palm's foot. */}
        <circle data-coconut data-ground={y} cx={-10} cy={14} r={13} fill="#6b4a2b" {...thin} />
        <circle data-coconut data-ground={y} cx={12} cy={18} r={13} fill="#6b4a2b" {...thin} />
        <circle data-coconut data-ground={y} cx={0} cy={0} r={12} fill="#6b4a2b" {...thin} />
      </g>
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

// Now and then a pirate ship sails slowly past behind the island, bobbing on
// the swell. It waits off-screen for the first part of each cycle. Clicking
// it lands hits on it, and enough of them sink it (src/lib/pirate.ts).
function PirateShip({ y, dur, delay, animate }: { y: number; dur: number; delay: number; animate: boolean }) {
  if (!animate) return null
  return (
    <g id="pirate-ship">
      <animateTransform attributeName="transform" type="translate" values="-260 0; -260 0; 1860 0" keyTimes="0; 0.45; 1" dur={`${dur}s`} begin={`-${delay}s`} repeatCount="indefinite" />
      <g transform={`translate(0 ${y}) scale(0.55)`}>
        <g data-pirate>
          <g data-pirate-art>
            <animateTransform attributeName="transform" type="rotate" values="-2; 2; -2" dur="4s" repeatCount="indefinite" />
            {/* rigging, then the masts and sails */}
            <path d="M20 -228 L160 -70 M-70 -168 L20 -150" stroke={INK} strokeWidth={2.5} />
            <rect x={-75} y={-172} width={10} height={130} fill={WOOD} {...thin} />
            <rect x={15} y={-232} width={10} height={190} fill={WOOD} {...thin} />
            <path d="M-105 -160 Q-70 -150 -35 -160 Q-30 -122 -35 -85 Q-70 -93 -105 -85 Q-100 -122 -105 -160 Z" fill="#2b2b30" {...thin} />
            <path d="M-45 -205 Q20 -190 85 -205 Q96 -142 85 -80 Q20 -95 -45 -80 Q-35 -142 -45 -205 Z" fill="#2b2b30" {...thin} />
            {/* skull and crossbones */}
            <path d="M2 -110 L38 -126 M2 -126 L38 -110" stroke="#f4efe6" strokeWidth={6} strokeLinecap="round" />
            <circle cx={20} cy={-150} r={17} fill="#f4efe6" />
            <rect x={11} y={-140} width={18} height={12} rx={3} fill="#f4efe6" />
            <circle cx={13} cy={-151} r={4.5} fill="#2b2b30" />
            <circle cx={27} cy={-151} r={4.5} fill="#2b2b30" />
            {/* the flag, fluttering */}
            <path d="M25 -230 L68 -224 L60 -214 L68 -204 L25 -208 Z" fill="#2b2b30" {...thin} strokeWidth={2.5}>
              <animate attributeName="d" values="M25 -230 L68 -224 L60 -214 L68 -204 L25 -208 Z; M25 -230 L66 -220 L58 -212 L68 -200 L25 -208 Z; M25 -230 L68 -224 L60 -214 L68 -204 L25 -208 Z" dur="1.2s" repeatCount="indefinite" />
            </path>
            <circle cx={40} cy={-219} r={4} fill="#f4efe6" />
            {/* hull: raised stern, gold stripe, gun ports, bowsprit */}
            <path d="M110 -46 L162 -72" {...line} />
            <path d="M-122 -76 L-70 -76 L-70 -46 L-122 -46 Z" fill="#5a361e" {...thin} />
            <path d="M-122 -46 L122 -46 Q114 -6 82 0 L-92 0 Q-118 -10 -122 -46 Z" fill="#6b4226" {...line} />
            <path d="M-118 -32 L118 -32" stroke="#d9a441" strokeWidth={5} />
            {[-60, -20, 20, 60].map((x) => (
              <circle key={x} cx={x} cy={-18} r={6} fill={INK} />
            ))}
            <path d="M-110 2 Q-80 -8 -50 2 T10 2 T70 2 T120 2" fill="none" stroke={FOAM} strokeWidth={6} strokeLinecap="round" />
          </g>
        </g>
      </g>
    </g>
  )
}

// A little propeller plane that crosses the sky every so often. Clicking it
// sends it crashing into the sea (src/lib/crash.ts).
function Plane({ y, dur, delay, animate }: { y: number; dur: number; delay: number; animate: boolean }) {
  if (!animate) return null
  return (
    <g id="plane">
      <animateTransform attributeName="transform" type="translate" values="-200 0; -200 0; 1800 -40" keyTimes="0; 0.82; 1" dur={`${dur}s`} begin={`-${delay}s`} repeatCount="indefinite" />
      <g transform={`translate(0 ${y})`}>
        <g data-plane-body>
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -5; 0 0" dur="2.2s" repeatCount="indefinite" />
          <path d="M-52 -6 L-66 -32 L-50 -32 L-34 -8 Z" fill="#e5483b" {...thin} />
          <path d="M-60 -4 Q-40 -16 20 -14 Q48 -12 54 0 Q48 12 20 12 Q-40 10 -60 4 Z" fill="#f4efe6" {...thin} />
          <path d="M-50 0 L44 0" stroke="#e5483b" strokeWidth={5} strokeLinecap="round" />
          <path d="M20 -12 Q34 -11 40 -4 L22 -4 Z" fill="#8fd3e8" {...thin} strokeWidth={2.5} />
          <path d="M-6 2 L-22 28 L4 28 L18 2 Z" fill="#e5483b" {...thin} />
          <circle cx={55} cy={0} r={5} fill={INK} />
          {/* spinning propeller */}
          <ellipse cx={58} cy={0} rx={3} ry={18} fill={INK} opacity={0.55}>
            <animate attributeName="ry" values="18; 3; 18" dur="0.12s" repeatCount="indefinite" />
          </ellipse>
        </g>
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
// character's feet are placed at 85% of the screen height, on the sand.
const Surface = forwardRef<SVGSVGElement, { animate: boolean }>(function Surface({ animate }, ref) {
  return (
    <svg ref={ref} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 top-0 h-screen w-full">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY_TOP} />
          <stop offset="1" stopColor={SKY_LOW} />
        </linearGradient>
        <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a5fb0" />
          <stop offset="1" stopColor="#9aa6dd" />
        </linearGradient>
        {/* Below the waterline the sand turns to the rock of the island's
            underwater base (Underwater.tsx), so the two meet without a seam. */}
        <linearGradient id="sand-to-rock" gradientUnits="userSpaceOnUse" x1="0" y1="792" x2="0" y2="900">
          <stop offset="0" stopColor="#5f7e74" stopOpacity={0} />
          <stop offset="1" stopColor="#5f7e74" />
        </linearGradient>
        <linearGradient id="shade-to-rock" gradientUnits="userSpaceOnUse" x1="0" y1="792" x2="0" y2="900">
          <stop offset="0" stopColor="#50695f" stopOpacity={0} />
          <stop offset="1" stopColor="#50695f" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SEA} />
          <stop offset="1" stopColor={SEA_FRONT} />
        </linearGradient>
        {/* The moon and its reflection are drawn above the night tint to stay
            bright, so the clouds, plane, palm and pirate ship in front of
            them are cut out as black silhouettes. */}
        <filter id="silhouette">
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
        </filter>
        <mask id="behind-palm" maskUnits="userSpaceOnUse" x={0} y={0} width={1600} height={900}>
          <rect width={1600} height={900} fill="#fff" />
          <use href="#palm-right" filter="url(#silhouette)" />
          <use href="#pirate-ship" filter="url(#silhouette)" />
        </mask>
        {/* the sinking pirate ship is cut off at the waterline */}
        <clipPath id="above-water" clipPathUnits="userSpaceOnUse">
          <rect x={-1000} y={-1000} width={3600} height={1652} />
        </clipPath>
        <mask id="behind-clouds" maskUnits="userSpaceOnUse" x={0} y={0} width={1600} height={900}>
          <rect width={1600} height={900} fill="#fff" />
          <use href="#clouds" filter="url(#silhouette)" />
          <use href="#plane" filter="url(#silhouette)" />
        </mask>
      </defs>

      {/* sky, sun, clouds, gulls */}
      <rect width={1600} height={600} fill="url(#sky)" />
      <rect className="night-only" width={1600} height={600} fill="url(#night-sky)" />
      <g className="day-only sun-set">
        <circle cx={1270} cy={540} r={160} fill={SUN} opacity={0.35} />
        <circle data-sky="sun" cx={1270} cy={540} r={105} fill={SUN} {...line} />
      </g>
      <g id="clouds">
        <Cloud x={0} y={110} s={1.1} dur={140} delay={30} animate={animate} />
        <Cloud x={0} y={210} s={0.75} dur={110} delay={80} animate={animate} />
        <Cloud x={0} y={60} s={0.6} dur={170} delay={130} animate={animate} />
      </g>
      <Plane y={150} dur={60} delay={36} animate={animate} />
      <g className="crash-layer" />
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
      <path className="day-only" d="M1130 606 L1410 606 M1180 626 L1360 626" stroke="#ffe9a8" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
      <Waves y={630} color="#7fd0d8" dur={5} animate={animate} />
      <Waves y={680} color="#9fdde2" dur={3.6} animate={animate} />
      <PirateShip y={648} dur={100} delay={38} animate={animate} />
      <g className="ship-layer" />

      {/* the island */}
      <path d="M290 900 L340 780 Q450 692 800 666 Q1150 692 1260 780 L1310 900 Z" fill={SAND} {...line} />
      <path d="M1000 686 Q1150 700 1250 776 L1300 900 L1130 900 Q1140 780 1000 686 Z" fill={SAND_SHADE} />
      <path d="M290 900 L340 780 Q450 692 800 666 Q1150 692 1260 780 L1310 900 Z" fill="url(#sand-to-rock)" />
      <path d="M1000 686 Q1150 700 1250 776 L1300 900 L1130 900 Q1140 780 1000 686 Z" fill="url(#shade-to-rock)" />
      {[
        [470, 716],
        [700, 684],
        [1120, 712],
      ].map(([gx, gy]) => (
        <path key={gx} d={`M${gx} ${gy} l6 -20 l6 20 l6 -15 l5 15 l6 -22 l5 22`} fill="none" stroke="#3f9a58" strokeWidth={4} strokeLinejoin="round" />
      ))}

      <Palm x={430} y={770} s={0.78} animate={animate} />
      <Palm id="palm-right" x={1175} y={772} s={0.72} flip={-1} animate={animate} />
      <g className="fallen-nuts" />

      {/* signpost: Melbourne, Bali, Jakarta */}
      <g transform="translate(548 738) scale(0.72)">
        <rect x={-9} y={-250} width={18} height={250} fill={WOOD} {...line} />
        <SignBoard y={-222} label="melbourne" dir={-1} w={150} />
        <SignBoard y={-172} label="bali" dir={1} w={96} />
        <SignBoard y={-122} label="jakarta" dir={1} w={124} />
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

      {/* the sea in front of the island, closest to us; as see-through as the
          island's underwater base starts out (Underwater.tsx) */}
      <g>
        {animate && <animateTransform attributeName="transform" type="translate" values="0 0; 0 6; 0 0" dur="4.5s" repeatCount="indefinite" />}
        <path d="M-40 792 Q60 776 160 792 T360 792 T560 792 T760 792 T960 792 T1160 792 T1360 792 T1560 792 T1760 792 L1760 920 L-40 920 Z" fill={SEA_FRONT} opacity={0.55} />
        <path d="M-40 792 Q60 776 160 792 T360 792 T560 792 T760 792 T960 792 T1160 792 T1360 792 T1560 792 T1760 792" fill="none" stroke={FOAM} strokeWidth={7} strokeLinecap="round" />
      </g>
      <Waves y={840} color="#6cc3cf" dur={4.2} animate={animate} />
      <Waves y={880} color="#5ab4c3" dur={3} animate={animate} />

      {/* --- night: a blue moonlit tint, then the moon, stars and reflection on top */}
      <rect className="night-tint" width={1600} height={900} fill="#27346e" />
      <g className="night-only">
        {STARS.map((s, i) => (
          <circle key={i} className="twinkle" style={{ animationDelay: `-${s.delay}s` }} cx={s.x} cy={s.y} r={s.r} fill="#fff8dc" />
        ))}
        <path className="shooting-star" d="M0 0 L-140 50" stroke="#fff8dc" strokeWidth={3} strokeLinecap="round" />
        <path mask="url(#behind-palm)" d="M1150 610 L1390 610 M1200 634 L1340 634 M1240 656 L1300 656" stroke="#e8f1ff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      </g>
      {/* outer group keeps the mask still while the moon rises */}
      <g mask="url(#behind-clouds)">
        <g className="night-only moon-rise">
          <circle cx={1270} cy={250} r={130} fill="#f4f1d8" opacity={0.18} />
          <circle data-sky="moon" cx={1270} cy={250} r={80} fill="#f4f1d8" {...line} />
          <circle cx={1245} cy={232} r={14} fill="#dcd6b4" />
          <circle cx={1296} cy={270} r={10} fill="#dcd6b4" />
          <circle cx={1285} cy={218} r={7} fill="#dcd6b4" />
        </g>
      </g>
    </svg>
  )
})

export default Surface
