import { forwardRef } from 'react'

// The surface: a small island off Bali, rendered in the soft 3D look of the
// Peanuts movie. The scene is a pair of painted plates (day and night) built
// by scripts/build-scene.py, with the things that move or can be clicked
// layered on top as cut-out sprites: the sun, drifting clouds, a plane, a
// pirate ship that sails behind the island's palms (the "front" layers are
// just those palms and props, cut from the plate), and the coconuts.
// Its bottom edge fades into the water colour the underwater world starts at.

const SCENE = `${import.meta.env.BASE_URL}scene/`
const W = 1600
const H = 900
// Plate pixels to scene units (the plates are 1672 wide).
const k = W / 1672
const px = (v: number) => +(v * k).toFixed(1)

const SEA_FRONT = '#2b93a6'
const SEA_FRONT_NIGHT = '#0f385c'
// Where the character stands (Character.tsx lines his feet up with this).
const STAND = { x: px(836), y: px(752) }
// The pirate ship's waterline, in scene units (src/lib/pirate.ts uses it too).
const SHIP_WATERLINE = 628

// The day plate's own coconuts (scripts/build-scene.py lifts them out into
// nuts.webp, one tile each, in this order), with the sand they land on.
const NUTS = [
  { x: 512.7, y: 456.0, r: 13.5, ground: 694 },
  { x: 497.3, y: 475.0, r: 16.0, ground: 694 },
  { x: 531.5, y: 483.5, r: 15.5, ground: 694 },
  { x: 1170.5, y: 480.5, r: 12.5, ground: 690 },
  { x: 1157.5, y: 501.5, r: 15.2, ground: 690 },
  { x: 1190.5, y: 499.5, r: 14.1, ground: 690 },
]
const NUT_PAD = 1.5

function Cloud({ n, y, w, dur, delay, animate }: { n: number; y: number; w: number; dur: number; delay: number; animate: boolean }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <g>
        {animate && (
          <animateTransform attributeName="transform" type="translate" values={`${-w - 40} 0; ${W + 40} 0`} dur={`${dur}s`} begin={`-${delay}s`} repeatCount="indefinite" />
        )}
        <image href={`${SCENE}cloud-${n}.webp`} width={w} />
      </g>
    </g>
  )
}

// Now and then a pirate ship sails slowly past behind the island, bobbing on
// the swell. It waits off-screen for the first part of each cycle. Clicking
// it lands hits on it, and enough of them sink it (src/lib/pirate.ts).
function PirateShip({ dur, delay, animate }: { dur: number; delay: number; animate: boolean }) {
  if (!animate) return null
  return (
    <g id="pirate-ship" className="dim-at-night">
      <animateTransform attributeName="transform" type="translate" values="-200 0; -200 0; 1800 0" keyTimes="0; 0.45; 1" dur={`${dur}s`} begin={`-${delay}s`} repeatCount="indefinite" />
      <g transform={`translate(0 ${SHIP_WATERLINE})`}>
        <g data-pirate>
          <g data-pirate-art>
            <animateTransform attributeName="transform" type="rotate" values="-2; 2; -2" dur="4s" repeatCount="indefinite" />
            {/* the hull sits a little way into the water */}
            <image href={`${SCENE}ship.webp`} x={-90} y={-143} width={180} />
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
    <g id="plane" className="dim-at-night">
      <animateTransform attributeName="transform" type="translate" values="-200 0; -200 0; 1800 -40" keyTimes="0; 0.82; 1" dur={`${dur}s`} begin={`-${delay}s`} repeatCount="indefinite" />
      <g transform={`translate(0 ${y})`}>
        <g data-plane-body>
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -5; 0 0" dur="2.2s" repeatCount="indefinite" />
          <image href={`${SCENE}plane.webp`} x={-60} y={-34} width={120} />
        </g>
      </g>
    </g>
  )
}

const Surface = forwardRef<SVGSVGElement, { animate: boolean }>(function Surface({ animate }, ref) {
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 top-0 h-screen w-full">
      <defs>
        {/* Each coconut is a circle filled with its own tile of nuts.webp, so a
            knocked-down copy (src/lib/coconut.ts) looks exactly the same. */}
        {NUTS.map((_, i) => (
          <pattern key={i} id={`nut-${i}`} width={1} height={1} patternContentUnits="objectBoundingBox">
            <image href={`${SCENE}nuts.webp`} x={-i} width={NUTS.length} height={1} preserveAspectRatio="none" />
          </pattern>
        ))}
        {/* the sinking pirate ship is cut off at the waterline */}
        <clipPath id="above-water" clipPathUnits="userSpaceOnUse">
          <rect x={-1000} y={-1000} width={3600} height={1000 + SHIP_WATERLINE} />
        </clipPath>
        {[
          ['into-the-sea', SEA_FRONT],
          ['into-the-night-sea', SEA_FRONT_NIGHT],
        ].map(([id, color]) => (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={0} />
            <stop offset="1" stopColor={color} />
          </linearGradient>
        ))}
      </defs>

      {/* the plates: night fades in over day */}
      <image href={`${SCENE}plate-day.webp`} width={W} height={H} preserveAspectRatio="none" />
      <image className="night-only" href={`${SCENE}plate-night.webp`} width={W} height={H} preserveAspectRatio="none" />

      {/* Sun (clicking it brings the night), clouds and plane. On screens wider
          than 16:9 the scene's top is cropped off, so Backdrop.tsx moves this
          group down by however much is hidden. */}
      <g data-sky-anchor>
        <g className="day-only sun-set">
          <image className="sun-pulse" href={`${SCENE}sun.webp`} x={1130} y={50} width={280} />
          <circle data-sky="sun" cx={1270} cy={186} r={80} fill="transparent" />
        </g>
        <g id="clouds" className="dim-at-night">
          <Cloud n={1} y={40} w={260} dur={160} delay={40} animate={animate} />
          <Cloud n={2} y={170} w={200} dur={120} delay={90} animate={animate} />
          <Cloud n={3} y={250} w={150} dur={190} delay={140} animate={animate} />
        </g>
        <Plane y={150} dur={60} delay={36} animate={animate} />
      </g>
      <g className="crash-layer" />

      {/* the pirate ship, then the island's palms and props in front of it */}
      <PirateShip dur={100} delay={38} animate={animate} />
      <g className="ship-layer" />
      <image className="day-only" href={`${SCENE}front-day.webp`} width={W} height={H} preserveAspectRatio="none" />
      <image className="night-only" href={`${SCENE}front-night.webp`} width={W} height={H} preserveAspectRatio="none" />

      {/* Coconuts can be knocked down (src/lib/coconut.ts); they land at the
          palm's foot. Only by day: the night plate's palms stand elsewhere. */}
      <g className="day-only">
        {NUTS.map((n, i) => (
          <circle key={i} data-coconut data-ground={n.ground} cx={px(n.x)} cy={px(n.y)} r={px(n.r + NUT_PAD)} fill={`url(#nut-${i})`} />
        ))}
        <g className="fallen-nuts" />
      </g>
      <circle id="stand" cx={STAND.x} cy={STAND.y} r={1} fill="none" />

      {/* the moon is painted into the night plate; this is where to click it */}
      <circle data-sky="moon" cx={px(1393)} cy={px(187)} r={px(64)} fill="transparent" />
      <g className="night-only">
        <path className="shooting-star" d="M0 0 L-140 50" stroke="#fff8dc" strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* the bottom edge fades into the water the underwater world starts with */}
      <rect className="day-only" y={H - 70} width={W} height={70} fill="url(#into-the-sea)" />
      <rect className="night-only" y={H - 70} width={W} height={70} fill="url(#into-the-night-sea)" />
    </svg>
  )
})

export default Surface
