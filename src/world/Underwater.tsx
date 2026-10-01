import type { CSSProperties, ReactNode } from 'react'

// Everything below the surface. Positions are in screen heights from the top
// of the world (the surface scene is 0-100vh), so each page section lines up
// with one depth zone:
//   100-200vh  about       island base, reef (coral, rocks, anemones), light rays, SeaLens camera
//   200-300vh  work        open blue: jellyfish, bubbles
//   300-400vh  experience  twilight: glowing jellyfish, shipwreck
//   400-500vh  contact     abyss: sea floor, message in a bottle
// Everything that swims lives in Sealife.tsx, in a layer above the page text.

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

// Fades content out towards the bottom of its box, starting at `from` opacity.
const fade = (from: number) => {
  const image = `linear-gradient(to bottom, rgb(0 0 0 / ${from}) 15%, transparent 95%)`
  return { maskImage: image, WebkitMaskImage: image }
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

function Jelly({ color, glow = false }: { color: string; glow?: boolean }) {
  return (
    <svg
      viewBox="-70 -70 140 220"
      data-jelly={color}
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

function TableCoral({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 160 112" className="w-full overflow-visible">
      <path d="M68 44 Q70 80 62 110 L98 110 Q90 80 92 44 Z" fill={color} {...line} />
      <path d="M8 40 Q14 14 80 14 Q146 14 152 40 Q130 52 108 44 Q94 54 80 46 Q64 54 50 44 Q30 52 8 40 Z" fill={color} {...line} />
      <path d="M34 30 h0.1 M60 24 h0.1 M90 26 h0.1 M118 30 h0.1 M76 36 h0.1" stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={0.4} />
    </svg>
  )
}

function TubeCoral({ color, rim }: { color: string; rim: string }) {
  const tubes = [
    [18, 62],
    [42, 96],
    [66, 78],
    [90, 112],
    [114, 58],
  ]
  return (
    <svg viewBox="0 0 132 124" className="w-full overflow-visible">
      {tubes.map(([x, h]) => (
        <g key={x}>
          <rect x={x - 11} y={122 - h} width={22} height={h} rx={11} fill={color} {...thin} />
          <ellipse cx={x} cy={128 - h} rx={7} ry={4} fill={rim} />
        </g>
      ))}
    </svg>
  )
}

function Anemone({ color, base }: { color: string; base: string }) {
  const tips = [-58, -44, -28, -12, 4, 20, 36, 50, 62]
  return (
    <svg viewBox="-72 -96 144 112" className="w-full overflow-visible">
      <g className="sway">
        {tips.map((x, i) => {
          const d = `M${x * 0.45} 0 Q${x * 0.6 + (i % 2 ? 10 : -10)} -46 ${x} ${-70 - (i % 3) * 10}`
          return (
            <g key={x}>
              <path d={d} stroke={INK} strokeWidth={13} strokeLinecap="round" fill="none" />
              <path d={d} stroke={color} strokeWidth={7} strokeLinecap="round" fill="none" />
            </g>
          )
        })}
      </g>
      <path d="M-44 14 Q-48 -10 0 -10 Q48 -10 44 14 Z" fill={base} {...line} />
    </svg>
  )
}

const ROCKS = [
  'M6 120 Q0 70 40 52 Q70 20 120 30 Q180 38 194 90 L196 120 Z',
  'M10 120 Q14 60 70 50 Q110 6 150 40 Q190 60 190 120 Z',
  'M4 120 Q2 80 36 70 Q62 52 92 78 L100 120 Z M88 120 Q94 50 150 46 Q196 56 196 120 Z',
]
function Rock({ shape = 0, color = '#6d7f86' }: { shape?: number; color?: string }) {
  return (
    <svg viewBox="0 0 200 122" className="w-full overflow-visible">
      <path d={ROCKS[shape]} fill={color} {...line} />
      <path d="M50 64 Q80 44 116 46" stroke="#fff" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.25} />
      <path d="M128 72 l14 14 l-6 16 M60 92 l12 -6" {...thin} fill="none" opacity={0.5} />
    </svg>
  )
}

const STAR = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2
  const r = i % 2 ? 17 : 44
  return `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`
}).join(' L')
function Starfish({ color }: { color: string }) {
  return (
    <svg viewBox="-50 -50 100 96" className="w-full overflow-visible">
      <path d={`M${STAR} Z`} fill={color} {...line} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        return <circle key={i} cx={Math.cos(a) * 24} cy={Math.sin(a) * 24} r={3} fill="#fff4dc" />
      })}
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
    <svg viewBox="0 0 440 280" data-ship className="w-full overflow-visible">
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
            background: 'linear-gradient(to bottom, rgb(255 250 220 / 0), rgb(255 250 220 / 0.35) 12%, rgb(255 250 220 / 0))',
          }}
        />
      ))}

      {/* The island's rocky base and the reef growing on it. Both fill the band
          just below the waterline (as tall as the base drawing, so it scales
          with the island) and fade out together as they go deeper. */}
      <div className="absolute inset-x-0" style={{ top: '100vh', height: 'calc(var(--s, 1) * 460px)' }}>
        {/* Drawn 1360 wide (x -80 to 1280), centred under the 1600-wide surface
            scene so the top edge (x 90-1110) meets the island's sand (x 290-1310)
            and the sides carry on its slope. It starts as see-through as the
            submerged sand above the waterline and only fades from there. */}
        <div
          className="absolute top-0 left-1/2 h-full -translate-x-1/2"
          style={{ width: 'calc(var(--s, 1) * 1360px)', ...fade(0.45) }}
        >
          <svg viewBox="-80 0 1360 460" className="h-full w-full">
            {/* Only the sides are outlined, so there's no seam at the surface. */}
            <path d="M90 0 L1110 0 Q1200 180 1260 460 L-60 460 Q0 180 90 0 Z" fill="#5f7e74" />
            <path d="M930 0 L1110 0 Q1200 180 1260 460 L1040 460 Q1010 200 930 0 Z" fill="#50695f" />
            <path d="M90 0 Q0 180 -60 460 M1110 0 Q1200 180 1260 460" fill="none" {...line} />
          </svg>
        </div>

        {/* shallow reef (about); tops are a share of the band's height */}
        <div className="absolute inset-0" style={fade(1)}>
          <At top="12%" left="46%" width="min(14vw, 170px)">
            <SeaLensRig />
          </At>
          <At top="16%" left="31%" width="min(5vw, 64px)">
            <Rock shape={2} color="#7d8a77" />
          </At>
          <At top="18%" left="21%" width="min(12vw, 150px)">
            <TableCoral color="#5cc6b5" />
          </At>
          <At top="16%" left="79%" width="min(7vw, 90px)">
            <Anemone color="#ffa25c" base="#c75a3a" />
          </At>
          <At top="24%" left="57%" width="min(7vw, 90px)">
            <BrainCoral color="#8fcf6a" />
          </At>
          <At top="22%" left="67%" width="min(11vw, 140px)">
            <SeaFan color="#9b6fd0" />
          </At>
          <At top="28%" left="38%" width="min(7vw, 88px)">
            <TubeCoral color="#f2694c" rim="#7a2618" />
          </At>
          <At top="30%" left="84%" width="min(10vw, 130px)">
            <Rock shape={1} />
          </At>
          <At top="34%" left="27%" width="min(9vw, 110px)">
            <BranchCoral color="#f07c8c" />
          </At>
          <At top="38%" left="70%" width="min(4vw, 50px)">
            <Starfish color="#ff8a5b" />
          </At>
          <At top="40%" left="75%" width="min(8vw, 100px)">
            <BranchCoral color="#ffcf5c" />
          </At>
          <At top="42%" left="35%" width="min(12vw, 150px)">
            <BrainCoral color="#f5a55a" />
          </At>
          <At top="44%" left="88%" width="min(6vw, 72px)">
            <TubeCoral color="#b48cf0" rim="#4b2f7a" />
          </At>
          <At top="48%" left="58%" width="min(9vw, 110px)">
            <Anemone color="#ff8fc8" base="#8c3d6b" />
          </At>
          <At top="50%" left="14%" width="min(6vw, 80px)">
            <Seaweed color="#4aa060" />
          </At>
          <At top="52%" left="45%" width="min(16vw, 200px)">
            <Rock shape={0} color="#5c6b78" />
          </At>
          <At top="56%" left="30%" width="min(4vw, 48px)">
            <Starfish color="#ffd166" />
          </At>
          <At top="58%" left="18%" width="min(7vw, 80px)">
            <BranchCoral color="#9fb8ff" />
          </At>
          <At top="60%" left="9%" width="min(7vw, 90px)">
            <Seaweed />
          </At>
          <At top="62%" left="64%" width="min(7vw, 90px)">
            <Rock shape={2} color="#6d7f86" />
          </At>
          <At top="64%" left="37%" width="min(8vw, 100px)">
            <SeaFan color="#e0566b" />
          </At>
          <At top="66%" left="80%" width="min(9vw, 110px)">
            <TableCoral color="#e7c35a" />
          </At>
          <At top="70%" left="93%" width="min(7vw, 90px)">
            <Seaweed color="#4aa060" />
          </At>
        </div>
      </div>

      {/* open blue (work) */}
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

