// Weather over the island. Clicking a cloud turns it grey and it rains for a
// while, drifting along as it pours; clicking a raining cloud throws a bolt of
// lightning into the sea with a flash and a clap of thunder (and keeps it
// raining a little longer). When the rain stops in the daytime a rainbow
// comes out. At night, clicking the shooting star makes a wish: it bursts
// into sparkles and a meteor shower follows.
import { shape, spawn } from './effects'
import { isNight } from './night'
import { prefersReducedMotion } from './sections'
import { chime, rainfall, thunder } from './sound'

const INK = '#120d0a'
// The horizon, in the scene's units: rain and lightning stop here.
const HORIZON = 575
const RAIN = 10000
const MORE_RAIN = 4000
const RAINBOW = ['#e5483b', '#f59a3a', '#f7d64a', '#5fbf6a', '#4a8fd6', '#7a5cc4']

// Scene units from a cloud's own units: its scale, and where it is right now.
function toScene(el: SVGGraphicsElement) {
  return el.ownerSVGElement?.getScreenCTM()?.inverse().multiply(el.getScreenCTM()!)
}

type Storm = { until: number; stop: () => void }
const storms = new WeakMap<SVGGElement, Storm>()

export function clickCloud(cloud: SVGGElement) {
  const storm = storms.get(cloud)
  if (storm) {
    storm.until = Math.max(storm.until, performance.now() + MORE_RAIN)
    lightning(cloud)
  } else rain(cloud)
}

function rain(cloud: SVGGElement) {
  const drops = shape('g')
  cloud.append(drops)
  cloud.classList.add('storm')
  const storm: Storm = { until: performance.now() + RAIN, stop: rainfall() }
  storms.set(cloud, storm)

  const step = () => {
    const m = toScene(cloud)
    const raining = performance.now() < storm.until
    if (m && raining) {
      // The cloud is scaled, so falling speed and the horizon are in its units.
      const floor = (HORIZON - m.f) / m.d
      const speed = 11 / m.d
      for (let i = 0; i < 2; i++) {
        const x = 14 + Math.random() * 166
        let y = 46
        const drop = shape('path', { d: 'M0 0 l-3 14', stroke: '#d6e6f2', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.85 })
        spawn(drops, drop, (el) => {
          y += speed
          el.setAttribute('transform', `translate(${x} ${y.toFixed(1)})`)
          return y < floor
        })
      }
      requestAnimationFrame(step)
      return
    }
    // Let the last drops land before clearing up.
    storm.stop()
    storms.delete(cloud)
    cloud.classList.remove('storm')
    window.setTimeout(() => drops.remove(), 1500)
    if (!isNight()) rainbow(cloud.ownerSVGElement!)
  }
  requestAnimationFrame(step)
}

function lightning(cloud: SVGGElement) {
  const svg = cloud.ownerSVGElement
  const layer = svg?.querySelector('.weather-layer')
  const m = toScene(cloud)
  if (!svg || !layer || !m) return
  thunder()

  // A jagged bolt from the cloud's belly down to the sea.
  const start = new DOMPoint(60 + Math.random() * 70, 44).matrixTransform(m)
  let [x, y] = [start.x, start.y]
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`
  while (y < HORIZON) {
    y = Math.min(HORIZON, y + 30 + Math.random() * 40)
    x += (Math.random() - 0.5) * 60
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`
  }
  const bolt = shape('g')
  bolt.append(
    shape('path', { d, fill: 'none', stroke: INK, 'stroke-width': 11, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
    shape('path', { d, fill: 'none', stroke: '#fff6b0', 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
  )
  // On, off, on again, then gone.
  spawn(layer, bolt, (el, age) => {
    el.setAttribute('opacity', age < 4 || (age > 6 && age < 12) ? '1' : age < 12 ? '0' : String(Math.max(0, 1 - (age - 12) / 8)))
    return age < 20
  })

  if (prefersReducedMotion()) return
  const flash = svg.querySelector('.flash-layer')
  if (!flash) return
  spawn(flash, shape('rect', { width: 1600, height: 900, fill: '#fffbe6' }), (el, age) => {
    el.setAttribute('opacity', String(Math.max(0, 0.6 - age / 14)))
    return age < 10
  })
}

// Bands of colour rising from behind the horizon, then fading away.
function rainbow(svg: SVGSVGElement) {
  const layer = svg.querySelector('.rainbow-layer')
  if (!layer || layer.childElementCount) return
  const arc = shape('g', { fill: 'none', 'stroke-width': 16, opacity: 0 })
  RAINBOW.forEach((color, i) => {
    const r = 560 - i * 16
    arc.append(shape('path', { d: `M${800 - r} ${HORIZON} A${r} ${r} 0 0 1 ${800 + r} ${HORIZON}`, stroke: color }))
  })
  // 60fps: fade in for 1.5s, hold, fade out over 2s.
  spawn(layer, arc, (el, age) => {
    el.setAttribute('opacity', String(0.55 * Math.min(1, age / 90, Math.max(0, (540 - age) / 120))))
    return age < 540 && !isNight()
  })
}

// --- wishing on a shooting star ---------------------------------------------

export function makeWish(star: SVGPathElement) {
  const svg = star.ownerSVGElement
  const layer = svg?.querySelector('.wish-layer')
  const m = toScene(star)
  if (!svg || !layer || !m || layer.childElementCount) return
  chime()
  // The star's head is its path's start point, wherever its flight has got to.
  const head = new DOMPoint(0, 0).matrixTransform(m)
  for (let i = 0; i < 12; i++) sparkle(layer, head.x, head.y, (i / 12) * Math.PI * 2)
  if (prefersReducedMotion()) return
  for (let i = 0; i < 18; i++) window.setTimeout(() => meteor(layer), 300 + i * 160 + Math.random() * 120)
}

// A little four-pointed twinkle thrown out from where the star was.
function sparkle(layer: Element, x: number, y: number, angle: number) {
  const speed = 2 + Math.random() * 2
  spawn(layer, shape('path', { d: 'M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z', fill: '#fff8dc' }), (el, age) => {
    const d = speed * age
    el.setAttribute('transform', `translate(${(x + Math.cos(angle) * d).toFixed(1)} ${(y + Math.sin(angle) * d).toFixed(1)}) rotate(${age * 6})`)
    el.setAttribute('opacity', String(Math.max(0, 1 - age / 40)))
    return age < 40
  })
}

// A streak across the sky, heading the same way as the shooting star.
function meteor(layer: Element) {
  const [x, y] = [500 + Math.random() * 1100, Math.random() * 260]
  const length = 60 + Math.random() * 80
  spawn(layer, shape('path', { d: `M0 0 L${-length} ${length * 0.36}`, stroke: '#fff8dc', 'stroke-width': 2.5, 'stroke-linecap': 'round' }), (el, age) => {
    el.setAttribute('transform', `translate(${(x - age * 14).toFixed(1)} ${(y + age * 5).toFixed(1)})`)
    el.setAttribute('opacity', String(Math.min(1, age / 4, (36 - age) / 10)))
    return age < 36
  })
}
