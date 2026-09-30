import type { CSSProperties, ReactNode } from 'react'

// Everything below the surface. Positions are in screen heights from the top
// of the world (the surface scene is 0-100vh), so each page section lines up
// with one depth zone:
//   100-200vh  about       shallow reef, light rays, turtle, SeaLens camera
//   200-300vh  work        open blue: manta ray, fish, bubbles
//   300-400vh  experience  twilight: glowing jellyfish, shipwreck
//   400-500vh  contact     abyss: anglerfish, sea floor, message in a bottle

const INK = '#120d0a'
const line = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const
const thin = { ...line, strokeWidth: 3.5 }

// Deterministic pseudo-random numbers so particles land in the same spots every load.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type AtProps = { top: string; left: string; width: string; className?: string; style?: CSSProperties; children: ReactNode }

// Absolutely placed, horizontally centred on `left`.
function At({ top, left, width, className = '', style, children }: AtProps) {
  return (
    <div className={`absolute -translate-x-1/2 ${className}`} style={{ top, left, width, ...style }}>
      {children}
    </div>
  )
}

// Swims across the whole screen and loops; `reverse` swims right to left.
function Swimmer({ top, width, dur, delay = 0, reverse = false, children }: { top: string; width: string; dur: number; delay?: number; reverse?: boolean; children: ReactNode }) {
  return (
    <div
      className="swim absolute left-0"
      style={{ top, width, animationDuration: `${dur}s`, animationDelay: `-${delay}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
    >
      <div className="bob" style={{ transform: reverse ? 'scaleX(-1)' : undefined }}>
        {children}
      </div>
    </div>
  )
}

function Fish({ color, x = 0, y = 0, s = 1 }: { color: string; x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-32 0 L-52 -16 L-50 16 Z" fill={color} {...thin} />
      <ellipse rx={34} ry={17} fill={color} {...thin} />
      <path d="M6 -15 Q0 0 6 15" {...thin} fill="none" />
      <circle cx={20} cy={-4} r={3.5} fill={INK} />
    </g>
  )
}

function School({ color, stripe }: { color: string; stripe?: string }) {
  const spots = [
    [0, 30, 1],
    [80, 0, 0.8],
    [90, 60, 0.9],
    [170, 28, 0.75],
    [165, 88, 0.7],
    [240, 55, 0.65],
  ]
  return (
    <svg viewBox="-60 -30 340 150" className="w-full overflow-visible">
      {spots.map(([x, y, s]) => (
        <g key={`${x}-${y}`}>
          <Fish color={color} x={x} y={y} s={s} />
          {stripe && <path d={`M${x + 4 * s} ${y - 14 * s} Q${x - 2 * s} ${y} ${x + 4 * s} ${y + 14 * s}`} stroke={stripe} strokeWidth={5 * s} fill="none" />}
        </g>
      ))}
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

function Jelly({ color, glow = false }: { color: string; glow?: boolean }) {
  return (
    <svg
      viewBox="-70 -70 140 220"
      className={`w-full overflow-visible ${glow ? 'glow' : ''}`}
      style={glow ? ({ '--glow': color } as CSSProperties) : undefined}
    >
      {[-30, -12, 8, 26].map((x, i) => (
        <path
          key={x}
          className="tentacle"
          style={{ animationDelay: `-${i * 0.4}s` }}
          d={`M${x} 0 q${i % 2 ? 12 : -12} 30 0 60 q${i % 2 ? -12 : 12} 30 0 60`}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      <path d="M-55 2 Q-55 -60 0 -60 Q55 -60 55 2 Q42 12 28 2 Q14 12 0 2 Q-14 12 -28 2 Q-42 12 -55 2 Z" fill={color} {...line} />
      <path d="M-30 -30 Q-20 -46 0 -48" stroke="#fff" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
    </svg>
  )
}

function Seaweed({ color = '#3e8f55' }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 240" className="sway w-full overflow-visible">
      <path d="M20 240 Q0 200 22 160 Q44 120 20 80 Q0 40 18 0 Q36 40 34 80 Q54 120 38 160 Q24 200 40 240 Z" fill={color} {...thin} />
      <path d="M44 240 Q34 200 52 170 Q72 140 58 100 Q76 130 70 170 Q62 200 66 240 Z" fill={color} {...thin} />
    </svg>
  )
}

function BranchCoral({ color }: { color: string }) {
  const d = 'M60 200 L60 120 L28 78 L28 36 M60 120 L94 72 L94 26 M60 150 L100 122 M28 78 L8 58 M94 72 L114 56'
  return (
    <svg viewBox="0 0 120 200" className="w-full overflow-visible">
      <path d={d} stroke={INK} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke={color} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function BrainCoral({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full overflow-visible">
      <path d="M4 100 Q4 10 80 8 Q156 10 156 100 Z" fill={color} {...line} />
      <path d="M26 86 q10 -30 24 -10 q12 -34 26 -8 q14 -32 28 -4 q14 -28 28 6 M40 54 q14 -26 30 -8 q16 -22 30 2" {...thin} fill="none" opacity={0.55} />
    </svg>
  )
}

function SeaFan({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 160 180" className="sway w-full overflow-visible">
      <path d="M80 180 L80 130 Q10 120 12 60 Q20 6 80 4 Q140 6 148 60 Q150 120 80 130" fill={color} {...line} />
      <path d="M80 130 L40 40 M80 130 L80 12 M80 130 L120 40 M80 130 L24 80 M80 130 L136 80 M30 60 Q80 90 130 60 M22 96 Q80 122 138 96" {...thin} fill="none" opacity={0.5} />
    </svg>
  )
}

// A SeaLens-style underwater camera rig filming the reef.
function SeaLensRig() {
  return (
    <svg viewBox="-110 -170 220 200" className="w-full overflow-visible">
      <path d="M0 -60 L-70 20 M0 -60 L70 20 M0 -60 L0 20" {...line} />
      <rect x={-60} y={-130} width={120} height={78} rx={14} fill="#f2c230" {...line} />
      <circle cx={-10} cy={-91} r={30} fill="#253447" {...line} />
      <circle cx={-10} cy={-91} r={15} fill="#8fd3e8" {...thin} />
      <circle cx={40} cy={-114} r={6} fill="#e5483b" className="blink" />
      <text x={0} y={-140} textAnchor="middle" fontSize={26} fill="#fdf7e6" className="font-display">
        sealens
      </text>
    </svg>
  )
}

function Shipwreck() {
  return (
    <svg viewBox="0 0 440 280" className="w-full overflow-visible">
      <g transform="rotate(-12 220 200)">
        <path d="M20 170 L420 170 L380 250 L70 250 Z" fill="#35303a" {...line} />
        <path d="M60 170 L60 130 L300 130 L300 170" fill="#2b2730" {...line} />
        <path d="M180 130 L190 20 M190 20 L250 60" {...line} strokeWidth={9} />
        <path d="M150 130 L150 90 L200 90" {...line} strokeWidth={7} fill="none" />
        {[120, 190, 260, 330].map((x) => (
          <circle key={x} cx={x} cy={205} r={12} fill="#1b3a52" {...thin} />
        ))}
        <path d="M330 170 L350 140 L370 170" fill="#35303a" {...thin} />
      </g>
      <path d="M40 250 q10 -40 -4 -80 M400 250 q-10 -50 6 -90" stroke="#2f6b54" strokeWidth={10} strokeLinecap="round" fill="none" />
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

function SeaFloor() {
  return (
    <svg viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
      <path d="M0 110 Q200 70 420 100 T860 96 T1260 104 T1600 84 L1600 300 L0 300 Z" fill="#1c2432" {...line} />
      <path d="M0 170 Q300 140 640 172 Q980 196 1280 160 Q1450 146 1600 168 L1600 300 L0 300 Z" fill="#151b27" />
      {[
        [180, 104, 60],
        [1340, 102, 80],
        [980, 98, 40],
      ].map(([x, y, r]) => (
        <path key={x} d={`M${x - r} ${y} Q${x - r} ${y - r * 0.9} ${x} ${y - r} Q${x + r} ${y - r * 0.9} ${x + r} ${y} Z`} fill="#2a3444" {...line} />
      ))}
      <path d="M1180 104 q-6 -60 10 -110 M1200 104 q10 -50 -4 -90 M300 100 q-8 -46 8 -80" stroke="#28594c" strokeWidth={10} strokeLinecap="round" fill="none" />
    </svg>
  )
}

function Bottle() {
  return (
    <svg viewBox="-80 -40 160 80" className="glow w-full overflow-visible" style={{ '--glow': '#bfe9ff' } as CSSProperties}>
      <path d="M-60 -22 Q-70 0 -60 22 L30 22 Q44 22 50 8 L70 6 L70 -6 L50 -8 Q44 -22 30 -22 Z" fill="#bfe3ef" fillOpacity={0.55} {...line} />
      <rect x={70} y={-9} width={10} height={18} rx={3} fill="#a0703f" {...thin} />
      <rect x={-40} y={-10} width={60} height={20} rx={10} fill="#f6ecd2" {...thin} />
      <path d="M-30 -3 L10 -3 M-30 3 L4 3" stroke="#8a7a5c" strokeWidth={3} />
    </svg>
  )
}

function Chest() {
  return (
    <svg viewBox="-80 -80 160 120" className="glow w-full overflow-visible" style={{ '--glow': '#ffd166' } as CSSProperties}>
      <path d="M-60 -20 L60 -20 L60 36 L-60 36 Z" fill="#7a4a24" {...line} />
      <path d="M-60 -20 Q-60 -70 0 -70 Q60 -70 60 -20 Z" fill="#8f5a2c" {...line} transform="rotate(-18 60 -20)" />
      <path d="M-50 -30 Q0 -56 44 -44" stroke="#ffd166" strokeWidth={10} strokeLinecap="round" />
      <rect x={-10} y={-8} width={20} height={22} fill="#e9b949" {...thin} />
    </svg>
  )
}

const rand = seeded(11)
// Marine snow: pale specks in the deeper zones, drifting slowly downward.
const SNOW = Array.from({ length: 70 }, () => ({
  left: `${(rand() * 100).toFixed(1)}%`,
  top: `${(220 + rand() * 270).toFixed(1)}vh`,
  size: 2 + rand() * 3,
  delay: rand() * 12,
}))
const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${[12, 16, 84, 88, 50][i % 5] + (rand() - 0.5) * 4}%`,
  top: `${(130 + rand() * 180).toFixed(1)}vh`,
  size: 6 + rand() * 12,
  delay: rand() * 8,
}))

export default function Underwater() {
  return (
    <>
      {/* sunlight shafts reaching down from the surface */}
      {[
        [18, -14, 7],
        [38, -6, 5],
        [62, 8, 8],
        [84, 16, 6],
      ].map(([left, angle, w]) => (
        <div
          key={left}
          className="rays absolute origin-top"
          style={{
            left: `${left}%`,
            top: '100vh',
            width: `${w}vw`,
            height: '150vh',
            rotate: `${angle}deg`,
            background: 'linear-gradient(to bottom, rgb(255 250 220 / 0.35), rgb(255 250 220 / 0))',
          }}
        />
      ))}

      {/* the island's rocky base, lined up under the island at the surface */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '99.6vh', width: 'calc(var(--s, 1) * 1200px)' }}>
        <svg viewBox="0 0 1200 460" className="w-full overflow-visible">
          <path d="M140 0 L1060 0 Q1150 180 1200 460 L0 460 Q60 180 140 0 Z" fill="#5f7e74" {...line} />
          <path d="M860 0 L1060 0 Q1150 180 1200 460 L980 460 Q960 200 860 0 Z" fill="#50695f" />
          <path d="M140 0 L1060 0" stroke="#2b93a6" strokeWidth={8} />
        </svg>
      </div>

      {/* shallow reef (about) */}
      <At top="134vh" left="27%" width="min(9vw, 110px)">
        <BranchCoral color="#f07c8c" />
      </At>
      <At top="142vh" left="35%" width="min(12vw, 150px)">
        <BrainCoral color="#f5a55a" />
      </At>
      <At top="128vh" left="67%" width="min(11vw, 140px)">
        <SeaFan color="#9b6fd0" />
      </At>
      <At top="140vh" left="75%" width="min(8vw, 100px)">
        <BranchCoral color="#ffcf5c" />
      </At>
      <At top="118vh" left="46%" width="min(14vw, 170px)">
        <SeaLensRig />
      </At>
      <At top="140vh" left="9%" width="min(7vw, 90px)" style={{ height: 'auto' }}>
        <Seaweed />
      </At>
      <At top="150vh" left="93%" width="min(7vw, 90px)">
        <Seaweed color="#4aa060" />
      </At>
      <Swimmer top="156vh" width="min(22vw, 260px)" dur={34} delay={6}>
        <School color="#ffd23f" stripe="#1f1f1f" />
      </Swimmer>
      <Swimmer top="168vh" width="min(26vw, 300px)" dur={52} delay={20} reverse>
        <Turtle />
      </Swimmer>
      <Swimmer top="186vh" width="min(18vw, 210px)" dur={28} delay={3}>
        <School color="#ff8c42" stripe="#fff5e2" />
      </Swimmer>

      {/* open blue (work) */}
      <Swimmer top="222vh" width="min(34vw, 420px)" dur={60} delay={10} reverse>
        <Manta />
      </Swimmer>
      <Swimmer top="262vh" width="min(20vw, 240px)" dur={30} delay={14}>
        <School color="#7fd6e8" />
      </Swimmer>
      <At top="250vh" left="86%" width="min(8vw, 100px)" className="bob">
        <Jelly color="#ffb3c7" />
      </At>
      <At top="284vh" left="12%" width="min(6vw, 80px)" className="bob" style={{ animationDelay: '-2s' }}>
        <Jelly color="#c9b3ff" />
      </At>

      {/* twilight zone (experience) */}
      <At top="352vh" left="16%" width="min(34vw, 420px)">
        <Shipwreck />
      </At>
      <At top="318vh" left="86%" width="min(9vw, 110px)" className="bob">
        <Jelly color="#ff7ad9" glow />
      </At>
      <At top="366vh" left="80%" width="min(6vw, 80px)" className="bob" style={{ animationDelay: '-3s' }}>
        <Jelly color="#7af0ff" glow />
      </At>
      <At top="330vh" left="8%" width="min(5vw, 64px)" className="bob" style={{ animationDelay: '-1s' }}>
        <Jelly color="#a98bff" glow />
      </At>

      {/* the abyss and the sea floor (contact) */}
      <Swimmer top="418vh" width="min(26vw, 320px)" dur={70} delay={25} reverse>
        <Anglerfish />
      </Swimmer>
      <div className="absolute inset-x-0" style={{ top: '462vh', height: '38vh' }}>
        <SeaFloor />
      </div>
      <At top="478vh" left="24%" width="min(12vw, 150px)">
        <Bottle />
      </At>
      <At top="470vh" left="78%" width="min(12vw, 150px)">
        <Chest />
      </At>

      {/* bubbles and marine snow */}
      {BUBBLES.map((b, i) => (
        <span
          key={`b${i}`}
          className="bubble absolute rounded-full border-2 border-white/70"
          style={{ left: b.left, top: b.top, width: b.size, height: b.size, animationDelay: `-${b.delay}s` }}
        />
      ))}
      {SNOW.map((f, i) => (
        <span
          key={`s${i}`}
          className="snow absolute rounded-full bg-white/60"
          style={{ left: f.left, top: f.top, width: f.size, height: f.size, animationDelay: `-${f.delay}s` }}
        />
      ))}
    </>
  )
}
