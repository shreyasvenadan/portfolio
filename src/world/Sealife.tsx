import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { prefersReducedMotion } from '../lib/sections'
import { oof } from '../lib/sound'

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

// A scuba diver swimming belly-down, kicking, breathing out bubbles. They
// carry a SeaLens camera in the reef and a torch in the dark.
function Diver({ suit = '#23262e', stripe = '#e2553d', gear }: { suit?: string; stripe?: string; gear?: 'camera' | 'torch' }) {
  const moving = !prefersReducedMotion()
  const leg = (y: number, delay: number) => (
    <g>
      {moving && (
        <animateTransform attributeName="transform" type="rotate" values={`-9 -36 ${y}; 9 -36 ${y}; -9 -36 ${y}`} dur="1.3s" begin={`${delay}s`} repeatCount="indefinite" />
      )}
      <path d={`M-36 ${y} L-80 ${y - 4}`} stroke={INK} strokeWidth={17} strokeLinecap="round" />
      <path d={`M-36 ${y} L-80 ${y - 4}`} stroke={suit} strokeWidth={11} strokeLinecap="round" />
      <path d={`M-78 ${y - 10} L-118 ${y - 16} L-116 ${y + 8} L-78 ${y + 4} Z`} fill="#f2c230" {...thin} />
    </g>
  )
  return (
    <svg viewBox="-122 -70 236 110" className="w-full overflow-visible">
      {gear === 'torch' && (
        <>
          <defs>
            <linearGradient id="torch-beam" x1="96" y1="0" x2="250" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff6c8" stopOpacity={0.5} />
              <stop offset="1" stopColor="#fff6c8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M96 14 L250 -30 L250 74 Z" fill="url(#torch-beam)" />
        </>
      )}
      {leg(6, -0.65)}
      {/* air tank on the back, hose to the mouth */}
      <rect x={-38} y={-36} width={66} height={18} rx={9} fill="#d8dde3" {...thin} />
      <path d="M26 -30 Q56 -40 70 2" stroke={INK} strokeWidth={3} fill="none" />
      <path d="M-40 -14 Q-10 -24 36 -16 Q50 -10 48 6 Q20 18 -40 14 Z" fill={suit} {...thin} />
      <path d="M-8 -19 L-14 15" stroke={stripe} strokeWidth={5} />
      {leg(-2, 0)}
      {/* head in a hood with a mask and regulator */}
      <circle cx={58} cy={-6} r={15} fill={suit} {...thin} />
      <rect x={60} y={-16} width={17} height={13} rx={5} fill="#8fd3e8" {...thin} strokeWidth={3} />
      <circle cx={71} cy={5} r={5} fill="#3a3d45" {...thin} strokeWidth={2.5} />
      {/* reaching arm, holding the gear */}
      <path d="M30 2 L84 14" stroke={INK} strokeWidth={15} strokeLinecap="round" />
      <path d="M30 2 L84 14" stroke={suit} strokeWidth={9} strokeLinecap="round" />
      {gear === 'camera' && (
        <g>
          <rect x={84} y={2} width={26} height={20} rx={4} fill="#f2c230" {...thin} strokeWidth={3} />
          <circle cx={110} cy={12} r={7} fill="#253447" {...thin} strokeWidth={2.5} />
          <circle cx={92} cy={6} r={2} fill="#e5483b" className="blink" />
        </g>
      )}
      {gear === 'torch' && <rect x={82} y={8} width={16} height={11} rx={3} fill="#9aa3ad" {...thin} strokeWidth={2.5} />}
      {/* breath bubbles rising from the regulator */}
      {moving &&
        [0, 0.7, 1.4].map((delay, i) => (
          <circle key={delay} cx={74 + i * 3} cy={0} r={3 + i} fill="none" stroke="#e8f8ff" strokeWidth={2} opacity={0}>
            <animate attributeName="cy" values="0;-70" dur="2.1s" begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="cx" values={`${74 + i * 3};${80 + i * 3};${72 + i * 3}`} dur="2.1s" begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.9;0" keyTimes="0;0.7;1" dur="2.1s" begin={`${delay}s`} repeatCount="indefinite" />
          </circle>
        ))}
    </svg>
  )
}

function Shark({ body = '#6f8796' }: { body?: string }) {
  return (
    <svg viewBox="-154 -82 300 142" className="w-full overflow-visible">
      <path d="M-104 -4 L-152 -60 Q-136 -4 -150 46 Z" fill={body} {...line} />
      <path d="M18 -31 L-4 -80 Q34 -62 54 -32 Z" fill={body} {...line} />
      <path d="M40 16 L6 58 L66 22 Z" fill={body} {...line} />
      <path d="M142 4 Q122 -30 40 -34 Q-40 -36 -110 -6 L-112 8 Q-40 30 40 28 Q118 28 142 4 Z" fill={body} {...line} />
      <path d="M140 6 Q112 24 40 25 Q-30 26 -100 8 Q-30 15 40 13 Q102 12 140 6 Z" fill="#eef3f5" />
      <path d="M74 -12 q-6 10 0 20 M85 -12 q-6 10 0 20 M96 -11 q-5 9 0 18" {...thin} strokeWidth={3} fill="none" />
      {/* closed mouth under the snout */}
      <path d="M138 8 Q120 18 98 15" {...thin} strokeWidth={3} fill="none" />
      <circle cx={112} cy={-10} r={4.5} fill={INK} />
    </svg>
  )
}

// A big whale with grooved throat, long flipper and broad flukes.
function Whale({ body = '#3f6b8f', belly = '#a9c4d6' }: { body?: string; belly?: string }) {
  return (
    <svg viewBox="-270 -84 524 186" className="w-full overflow-visible">
      <path d="M-212 0 L-266 -50 Q-252 -8 -238 0 Q-252 8 -266 50 Z" fill={body} {...line} />
      <path d="M250 12 Q250 -68 140 -76 Q0 -82 -130 -40 Q-190 -22 -222 -6 L-224 8 Q-180 16 -120 32 Q0 72 140 68 Q250 62 250 12 Z" fill={body} {...line} />
      <path d="M246 26 Q214 62 140 64 Q20 66 -110 30 Q20 48 140 46 Q210 44 246 26 Z" fill={belly} />
      <path d="M232 34 Q170 52 80 50 M224 42 Q160 58 70 56" stroke={body} strokeWidth={3} fill="none" opacity={0.7} />
      <path d="M-10 -66 Q-2 -88 22 -76" {...thin} fill={body} />
      <path d="M80 42 Q46 104 -14 98 Q30 72 40 40 Z" fill={body} {...line} />
      <path d="M250 22 Q206 32 160 26" {...thin} fill="none" />
      <circle cx={186} cy={10} r={5.5} fill={INK} />
      <circle cx={188} cy={8} r={1.8} fill="#fff" />
    </svg>
  )
}

function Dolphin() {
  return (
    <svg viewBox="-112 -64 220 112" className="w-full overflow-visible">
      <path d="M-88 0 L-110 -26 Q-102 0 -110 24 Z" fill="#7aa6c2" {...line} />
      <path d="M0 -26 Q-6 -58 -30 -62 Q-14 -40 -28 -22 Z" fill="#7aa6c2" {...line} />
      <path d="M28 16 L12 42 L46 18 Z" fill="#7aa6c2" {...line} />
      <path d="M106 6 L84 2 Q70 -28 10 -28 Q-50 -28 -84 -4 L-92 0 L-84 6 Q-40 24 20 22 Q72 20 86 10 Z" fill="#7aa6c2" {...line} />
      <path d="M84 10 Q60 21 20 20 Q-30 20 -62 8 Q-20 14 20 12 Q60 10 84 10 Z" fill="#dbe9f1" />
      <path d="M106 6 Q94 11 80 9" {...thin} fill="none" />
      <circle cx={64} cy={-7} r={3.8} fill={INK} />
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
// calm: isn't startled by the cursor (divers, sharks, whales). diver: says "oof" when clicked.
type Kind = { art: ReactNode; size: number; zone: [number, number]; speed: number; count?: number; school?: number; bank?: boolean; calm?: boolean; diver?: boolean }

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
  { art: <Diver gear="camera" />, size: 190, zone: [130, 180], speed: 0.4, calm: true, diver: true },
  { art: <Fish color="#c77dff" />, size: 40, zone: [118, 190], speed: 0.9, count: 2 },
  { art: <Dolphin />, size: 170, zone: [120, 175], speed: 1.6, school: 3 },
  // open blue
  { art: <Manta />, size: 380, zone: [212, 240], speed: 0.7, bank: true },
  { art: <Fish color="#7fd6e8" />, size: 50, zone: [245, 285], speed: 1.1, school: 8 },
  { art: <Fish color="#d6e4ea" />, size: 22, zone: [205, 260], speed: 1.7, school: 11 },
  { art: <Barracuda />, size: 150, zone: [215, 290], speed: 1.2, count: 3 },
  { art: <Swordfish />, size: 240, zone: [230, 280], speed: 1.5 },
  { art: <Diver suit="#1f3b57" stripe="#f2c230" />, size: 180, zone: [225, 285], speed: 0.45, calm: true, diver: true },
  { art: <Tang body="#3fb57a" tail="#1d6e47" />, size: 62, zone: [205, 250], speed: 0.9, count: 2 },
  { art: <Fish color="#f25f5c" stripe="#ffe1a8" />, size: 46, zone: [210, 290], speed: 1, count: 3 },
  { art: <Whale />, size: 560, zone: [222, 262], speed: 0.3, calm: true },
  { art: <Shark />, size: 230, zone: [218, 290], speed: 0.9, count: 2, calm: true },
  { art: <Dolphin />, size: 160, zone: [205, 250], speed: 1.7, school: 4 },
  // twilight
  { art: <Lanternfish />, size: 36, zone: [305, 395], speed: 0.6, count: 6 },
  { art: <Lanternfish glow="#ffb8f2" />, size: 30, zone: [310, 395], speed: 0.6, count: 4 },
  { art: <Hatchetfish />, size: 40, zone: [305, 380], speed: 0.45, count: 4 },
  { art: <Eel />, size: 220, zone: [360, 390], speed: 0.35 },
  { art: <Diver suit="#2a2d36" stripe="#5ad1e6" gear="torch" />, size: 180, zone: [325, 385], speed: 0.35, calm: true, diver: true },
  { art: <Puffer />, size: 50, zone: [320, 380], speed: 0.3 },
  { art: <Whale body="#2c3e57" belly="#7d93ab" />, size: 620, zone: [318, 350], speed: 0.25, calm: true },
  { art: <Shark body="#4d5d6b" />, size: 250, zone: [330, 392], speed: 0.6, calm: true },
  // abyss
  { art: <Anglerfish />, size: 300, zone: [412, 450], speed: 0.3 },
  { art: <Lanternfish glow="#d8ff9f" />, size: 30, zone: [405, 455], speed: 0.5, count: 5 },
  { art: <Eel color="#4b4560" />, size: 200, zone: [430, 458], speed: 0.3 },
]

type Spec = Kind & { leader?: number; ox: number; oy: number; behind: boolean }

// Flatten into one entry per creature; school members remember their leader
// and their place in formation (in leader widths, ox behind, oy below). Each
// creature (or whole school) is picked at random, per visit, to swim either
// in front of the page text or behind it.
const CREATURES: Spec[] = []
const coin = () => Math.random() < 0.5
for (const kind of KINDS) {
  if (kind.school) {
    const leader = CREATURES.length
    const behind = coin()
    for (let i = 0; i < kind.school; i++)
      CREATURES.push({ ...kind, leader: i ? leader : undefined, ox: 0.4 + Math.random() * 1.6, oy: (Math.random() - 0.5) * 2.4, behind })
  } else {
    for (let i = 0; i < (kind.count ?? 1); i++) CREATURES.push({ ...kind, ox: 0, oy: 0, behind: coin() })
  }
}

// --- fishing ---------------------------------------------------------------

// The cursor is a fishing hook: click near a small fish to hook it, and it
// hangs by its mouth from the bend of the hook, thrashing, until the next
// click lets it go. Anything wider than CATCHABLE is too big to land. Fish
// can't be pulled up into the island scene: one wriggles off the hook there.
const CATCHABLE = 70
// The bend of the hook cursor, relative to its point (the hotspot).
const BEND = { x: 6.5, y: 20 }
// How far from a fish's centre a click still hooks it, beyond its half-width.
const SLOP = 24

let hooking: { near: (x: number, y: number) => boolean; click: (x: number, y: number) => boolean; holding: () => boolean } | null = null
// Clicking a diver: they say "oof" and flinch. Set up by swim(), like the hook.
let poking: { near: (x: number, y: number) => boolean; click: (x: number, y: number) => boolean } | null = null
export const divers = {
  over: (x: number, y: number) => poking?.near(x, y) ?? false,
  // Poke the diver here, if there is one. True if the click was used.
  click: (x: number, y: number) => poking?.click(x, y) ?? false,
}

export const fishing = {
  // Is there a fish to hook here (and nothing on the hook already)?
  over: (x: number, y: number) => hooking?.near(x, y) ?? false,
  // Hook a fish here, or let the hooked one go. True if the click was used.
  click: (x: number, y: number) => hooking?.click(x, y) ?? false,
  // Is a fish on the hook (so the next click lets it go)?
  holding: () => hooking?.holding() ?? false,
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
  h: number
  nerve: number
  // Opacity: front creatures fade while over the reading card.
  fade: number
}

// How see-through a creature in front of the text gets over the reading card
// (src/lib/focus.ts), so it doesn't hide what's being read.
const SEE_THROUGH = 0.2

// `layer` holds the creatures in front of the page text and `back` those
// behind it; both scroll together, so positions in one hold for the other.
function swim(layer: HTMLElement, back: HTMLElement) {
  const els: HTMLElement[] = []
  for (const el of [...layer.children, ...back.children] as HTMLElement[]) els[Number(el.dataset.creature)] = el
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
      h: els[i].offsetHeight,
      fade: 1,
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
      b.h = b.el.offsetHeight
    }
  }
  window.addEventListener('resize', resize)

  // A diver is drawn about twice as long as it is tall, so hit-test an ellipse.
  const diverAt = (x: number, y: number) => {
    const offset = layer.getBoundingClientRect().top
    return bodies.find((b) => b.spec.diver && ((b.x - x) / (b.w / 2)) ** 2 + ((b.y + offset - y) / (b.w / 4)) ** 2 < 1)
  }
  poking = {
    near: (x, y) => !!diverAt(x, y),
    click: (x, y) => {
      const b = diverAt(x, y)
      if (!b) return false
      oof()
      b.vy -= 2.5
      return true
    },
  }

  if (prefersReducedMotion()) {
    const offset = layer.getBoundingClientRect().top
    bodies.forEach((b) => place(b, offset))
    return () => {
      window.removeEventListener('resize', resize)
      poking = null
    }
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
    holding: () => !!caught,
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
    // Nothing swims up into the island scene, which fills the first screen.
    const ceiling = H
    const card = document.querySelector('.reading-card.shown')?.getBoundingClientRect()

    for (const b of bodies) {
      // In front of the text and over the reading card: turn see-through so
      // the text stays readable. One on the hook stays solid.
      if (!b.spec.behind) {
        const sy = b.y + offset
        const over =
          !!card && b !== caught && b.x + b.w / 2 > card.left && b.x - b.w / 2 < card.right && sy + b.h / 2 > card.top && sy - b.h / 2 < card.bottom
        const target = over ? SEE_THROUGH : 1
        if (b.fade !== target) {
          b.fade += (target - b.fade) * Math.min(1, 0.15 * dt)
          if (Math.abs(target - b.fade) < 0.01) b.fade = target
          b.el.style.opacity = b.fade.toFixed(2)
        }
      }
      if (b === caught && b.y - b.w / 2 < ceiling) {
        // Pulled up to the island: it wriggles off the hook and dives.
        caught = null
        b.heading = Math.PI / 2 + (Math.random() - 0.5) * 1.2
        b.vx = Math.cos(b.heading) * 2
        b.vy = 3
        b.face = Math.cos(b.heading) > 0 ? 1 : -1
        b.panic = 120
      }
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
      if (pointer && !spec.calm) {
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
      // The calm ones (divers, sharks, whales) aren't startled, but still ease
      // out of the cursor's way so they don't park over text being read. They
      // are long and low, so "near" is an ellipse around the body.
      if (pointer && spec.calm) {
        const dx = b.x - pointer.x
        const dy = b.y + offset - pointer.y
        const near = 1 - Math.hypot(dx / (b.w / 2 + 100), dy / (b.w / 4 + 100))
        if (near > 0) {
          const dist = Math.hypot(dx, dy) || 1
          ax += (dx / dist) * 0.12 * near
          ay += (dy / dist) * 0.12 * near
          // Turn gradually to swim away, rather than backing off.
          const away = Math.atan2(dy * 0.5, dx)
          b.heading += Math.atan2(Math.sin(away - b.heading), Math.cos(away - b.heading)) * 0.03 * dt
          max *= 1 + near * 1.5
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
      // Bump into the ceiling and turn back down.
      if (b.y - b.w / 2 < ceiling) {
        b.y = ceiling + b.w / 2
        b.vy = Math.max(0, b.vy)
        if (Math.sin(b.heading) < 0) b.heading = -b.heading
      }

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
    poking = null
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', track)
    document.documentElement.removeEventListener('pointerleave', untrack)
  }
}

// `back` is a layer behind the page text (inside the world, under the night
// tint) for the creatures that swim there.
export default function Sealife({ back }: { back: HTMLElement | null }) {
  const layer = useRef<HTMLDivElement>(null)
  useEffect(() => (back ? swim(layer.current!, back) : undefined), [back])
  const creature = (c: Spec, i: number) => (
    <div
      key={i}
      data-creature={i}
      className="absolute top-0 left-0"
      style={{ width: `clamp(${c.size * 0.45}px, ${(c.size / 12).toFixed(2)}vw, ${c.size}px)`, transform: 'translate3d(-9999px, 0, 0)' }}
    >
      <div className="wiggle" style={{ animationDuration: `${(0.6 + (i % 7) * 0.12).toFixed(2)}s` }}>
        {c.art}
      </div>
    </div>
  )
  return (
    <div ref={layer}>
      {CREATURES.map((c, i) => !c.behind && creature(c, i))}
      {back && createPortal(CREATURES.map((c, i) => c.behind && creature(c, i)), back)}
    </div>
  )
}
