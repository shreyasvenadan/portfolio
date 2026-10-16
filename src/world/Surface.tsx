import { forwardRef } from 'react'

// The surface: a small island off Bali, rendered in the soft 3D look of the
// Peanuts movie and built from parts by scripts/build-scene.py: a sky, a
// volcano on the horizon, the sea and sand (which slowly shift between a few
// painted frames), and the props standing on the island (two swaying palms,
// the signpost, a ball, a camera on its tripod). Over that, the things that
// move or can be clicked: the sun and moon, drifting clouds, a plane, a pirate
// ship sailing behind the island, and the coconuts. At night a moonlit tint
// falls over the island, under a starry sky. Its bottom edge fades into the
// water colour the underwater world starts at.

const SCENE = `${import.meta.env.BASE_URL}scene/`
const W = 1600
const H = 900
// The sea and sand come from a 1672 x 941 render: its pixels to scene units.
const k = W / 1672
const px = (v: number) => +(v * k).toFixed(1)

const SEA_FRONT = '#2b93a6'
const SEA_FRONT_NIGHT = '#0f385c'
// Where the character stands (Character.tsx lines his feet up with this).
const STAND = { x: px(836), y: px(752) }
// The pirate ship's waterline, in scene units (src/lib/pirate.ts uses it too).
const SHIP_WATERLINE = 628
// The moon rises into the sky as the sun sets (index.css, .moon-rise). Both
// sit clear of the right palm (the moon's drawn above it, to shine through the
// night tint) yet inside a 16:10 screen, which loses 80 units off each side.
const MOON = { x: 1402, y: 180, r: 66 }
const SUN = { x: 1378, y: 186 }

// The sea layer is the render from row 613 down (fading in over the first
// rows, just above the horizon). It comes in several frames: SEA_FRAMES more
// versions (sea-n.webp) painted with the waves in other places each fade in
// over it in turn and out again, SEA_STEP seconds apart.
const SEA_TOP = px(613)
const SEA_HEIGHT = px(941 - 613)
const SEA_FRAMES = 1
const SEA_STEP = 2.6

// Opacity keyframes for sea frame i of n (the plain sea being frame 0):
// up from nothing as the previous one peaks, full at its turn, gone by the next.
function seaFade(i: number, n: number) {
  const points = [
    [0, 0],
    [(i - 1) / n, 0],
    [i / n, 1],
    [(i + 1) / n, 0],
    [1, 0],
  ].filter(([t], j, all) => j === 0 || t !== all[j - 1][0])
  return { values: points.map(([, v]) => v).join(';'), keyTimes: points.map(([t]) => +t.toFixed(4)).join(';') }
}

// Props, each with its image size (px), the point it stands on in its image
// (x along the bottom edge), where that lands in the scene, and its height
// there. They stand where the render's own props stood (painted out of the
// sea layer), so they cover those spots.
const PALM = { w: 812, h: 820, baseX: 310.5 }
// The palm's coconuts, in its image's pixels (lifted out into nuts.webp).
const PALM_NUTS = [
  { x: 404.1, y: 213.5, r: 32.4 },
  { x: 359.9, y: 253.2, r: 37.5 },
  { x: 432.8, y: 279.7, r: 36.8 },
]
const PALMS = [
  { x: px(477), y: px(728), height: 338, flip: false, sway: 0 },
  { x: px(1197), y: px(722), height: 330, flip: true, sway: -3.1 },
]
const PROPS = [
  { name: 'sign', w: 301, h: 420, baseX: 139, x: px(590), y: px(719), height: 176 },
  { name: 'camera', w: 210, h: 380, baseX: 104, x: px(1083), y: px(717), height: 158 },
  { name: 'ball', w: 128, h: 128, baseX: 64, x: px(1000), y: px(716), height: 54 },
]
// The volcano and its island sit on the horizon at the left.
const MOUNTAIN = { w: 1280, h: 482, x: -24, width: 660, bottom: 600 }

// Distant clouds that hang still low over the horizon; the drifting ones are
// higher up, in front of the sun.
const FAR_CLOUDS = [
  { n: 3, x: 1210, y: 455, w: 190 },
  { n: 4, x: 905, y: 300, w: 120 },
  { n: 1, x: 1420, y: 520, w: 150 },
  { n: 2, x: 120, y: 330, w: 140 },
]

// Stars for the night sky, scattered the same way every load, and only in
// open sky: above the palms, and above the volcano on the left.
const STARS = (() => {
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: 110 }, () => ({ x: rand() * W, y: rand() * 560, r: 0.8 + rand() * 1.8, delay: rand() * 4 })).filter(
    (s) => s.y < (s.x < 640 ? 260 : 345),
  )
})()

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

// A palm, swaying a little in the breeze from the foot of its trunk, with
// coconuts that can be knocked down (src/lib/coconut.ts) onto the sand.
function Palm({ x, y, height, flip, sway, animate }: (typeof PALMS)[number] & { animate: boolean }) {
  const s = height / PALM.h
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) translate(${-PALM.baseX} ${-PALM.h})`}>
      <g>
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={`-1 ${PALM.baseX} ${PALM.h}; 1.4 ${PALM.baseX} ${PALM.h}; -1 ${PALM.baseX} ${PALM.h}`}
            calcMode="spline"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            dur="6.2s"
            begin={`${sway}s`}
            repeatCount="indefinite"
          />
        )}
        <image href={`${SCENE}palm.webp`} width={PALM.w} height={PALM.h} />
        {PALM_NUTS.map((n, i) => (
          <circle key={i} data-coconut data-ground={y + 4} cx={n.x} cy={n.y} r={n.r} fill={`url(#nut-${i})`} />
        ))}
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
    <g id="pirate-ship">
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
    <g id="plane">
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
  const mountainHeight = (MOUNTAIN.width * MOUNTAIN.h) / MOUNTAIN.w
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 top-0 h-screen w-full">
      <defs>
        {/* Each coconut is a circle filled with its own tile of nuts.webp, so a
            knocked-down copy (src/lib/coconut.ts) looks exactly the same. */}
        {PALM_NUTS.map((_, i) => (
          <pattern key={i} id={`nut-${i}`} width={1} height={1} patternContentUnits="objectBoundingBox">
            <image href={`${SCENE}nuts.webp`} x={-i} width={PALM_NUTS.length} height={1} preserveAspectRatio="none" />
          </pattern>
        ))}
        <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a5fb0" />
          <stop offset="0.66" stopColor="#9aa6dd" />
        </linearGradient>
        <radialGradient id="moon-halo">
          <stop offset="0.45" stopColor="#fff4cf" stopOpacity={0.3} />
          <stop offset="1" stopColor="#fff4cf" stopOpacity={0} />
        </radialGradient>
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

      {/* sky (the night one is lighter than it looks: the tint below darkens
          it), distant clouds, the volcano */}
      <image href={`${SCENE}sky.webp`} width={W} height={H} preserveAspectRatio="none" />
      <rect className="night-only" width={W} height={H} fill="url(#night-sky)" />
      {FAR_CLOUDS.map((c, i) => (
        <image key={i} href={`${SCENE}cloud-${c.n}.webp`} x={c.x} y={c.y} width={c.w} opacity={0.9} />
      ))}

      {/* Sun (clicking it brings the night), drifting clouds and the plane, all
          behind the volcano and the island. On screens wider than 16:9 the
          scene's top is cropped off, so Backdrop.tsx moves the sky groups
          ([data-sky-anchor]) down by however much is hidden. */}
      <g data-sky-anchor>
        <g className="day-only sun-set">
          <image className="sun-pulse" href={`${SCENE}sun.webp`} x={SUN.x - 140} y={SUN.y - 136} width={280} />
          <circle data-sky="sun" cx={SUN.x} cy={SUN.y} r={80} fill="transparent" />
        </g>
        <g id="clouds">
          <Cloud n={1} y={40} w={260} dur={160} delay={40} animate={animate} />
          <Cloud n={2} y={170} w={200} dur={120} delay={90} animate={animate} />
          <Cloud n={3} y={250} w={150} dur={190} delay={140} animate={animate} />
          <Cloud n={4} y={95} w={180} dur={210} delay={20} animate={animate} />
        </g>
        <Plane y={150} dur={60} delay={36} animate={animate} />
      </g>
      <image href={`${SCENE}mountain.webp`} x={MOUNTAIN.x} y={MOUNTAIN.bottom - mountainHeight} width={MOUNTAIN.width} height={mountainHeight} />

      {/* the sea and sand, slowly shifting between their frames */}
      <image href={`${SCENE}sea.webp`} y={SEA_TOP} width={W} height={SEA_HEIGHT} preserveAspectRatio="none" />
      {animate &&
        Array.from({ length: SEA_FRAMES }, (_, n) => (
          <image key={n} href={`${SCENE}sea-${n + 1}.webp`} y={SEA_TOP} width={W} height={SEA_HEIGHT} preserveAspectRatio="none" opacity={0}>
            <animate attributeName="opacity" {...seaFade(n + 1, SEA_FRAMES + 1)} calcMode="linear" dur={`${(SEA_FRAMES + 1) * SEA_STEP}s`} repeatCount="indefinite" />
          </image>
        ))}
      <g className="crash-layer" />

      {/* the pirate ship, behind the island's props */}
      <PirateShip dur={100} delay={38} animate={animate} />
      <g className="ship-layer" />

      {/* the props on the island */}
      <Palm {...PALMS[0]} animate={animate} />
      {PROPS.map((p) => {
        const s = p.height / p.h
        return <image key={p.name} href={`${SCENE}${p.name}.webp`} x={p.x - p.baseX * s} y={p.y - p.height} width={p.w * s} height={p.height} />
      })}
      <Palm {...PALMS[1]} animate={animate} />
      <g className="fallen-nuts" />
      <circle id="stand" cx={STAND.x} cy={STAND.y} r={1} fill="none" />

      {/* night: a moonlit tint over everything so far, then the stars */}
      <rect className="night-tint" width={W} height={H} fill="#27346e" />
      <g className="night-only">
        {STARS.map((s, i) => (
          <circle key={i} className="twinkle" style={{ animationDelay: `-${s.delay}s` }} cx={s.x} cy={s.y} r={s.r} fill="#fff8dc" />
        ))}
        <path className="shooting-star" d="M0 0 L-140 50" stroke="#fff8dc" strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* the moon, above the tint so it shines; clicking it brings the day back */}
      <g data-sky-anchor>
        <g className="night-only moon-rise">
          <circle cx={MOON.x} cy={MOON.y} r={MOON.r * 1.9} fill="url(#moon-halo)" />
          <image className="moon-glow" href={`${SCENE}moon.webp`} x={MOON.x - MOON.r} y={MOON.y - MOON.r} width={MOON.r * 2} height={MOON.r * 2} />
          <circle data-sky="moon" cx={MOON.x} cy={MOON.y} r={MOON.r} fill="transparent" />
        </g>
      </g>

      {/* the bottom edge fades into the water the underwater world starts with */}
      <rect className="day-only" y={H - 70} width={W} height={70} fill="url(#into-the-sea)" />
      <rect className="night-only" y={H - 70} width={W} height={70} fill="url(#into-the-night-sea)" />
    </svg>
  )
})

export default Surface
