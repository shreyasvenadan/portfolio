// Clicking a seagull annoys it: it squawks, sheds a couple of feathers, then
// swoops down to the palms, snatches a coconut and flaps off with it. The real
// gull is hidden and a copy does the swoop; the coconut grows back later.
import { shape, spawn } from './effects'
import { prefersReducedMotion } from './sections'
import { squawk } from './sound'

const NS = 'http://www.w3.org/2000/svg'
// Long enough for the swoop to be out of sight before the gull is back.
const RETURN = 12000
const REGROW = 7000
// Frames to reach the coconut, then to fly off the edge of the scene.
const DIVE = 70
const ESCAPE = 120

const toScene = (el: SVGGraphicsElement) => el.ownerSVGElement?.getScreenCTM()?.inverse().multiply(el.getScreenCTM()!)

// A point along a quadratic curve from a to b, bending through c.
const curve = (a: number, c: number, b: number, t: number) => (1 - t) ** 2 * a + 2 * (1 - t) * t * c + t ** 2 * b

export function annoyGull(gull: SVGGElement) {
  const svg = gull.ownerSVGElement
  const layer = svg?.querySelector('.gull-layer')
  const m = toScene(gull)
  if (!svg || !layer || !m || gull.dataset.gone) return
  squawk()
  const [sx, sy] = [m.e, m.f]
  for (let i = 0; i < 2; i++) feather(layer, sx, sy)
  if (prefersReducedMotion()) return

  gull.dataset.gone = 'true'
  gull.style.opacity = '0'
  window.setTimeout(() => {
    gull.style.transition = 'opacity 1s ease'
    gull.style.opacity = ''
    window.setTimeout(() => {
      gull.style.transition = ''
      delete gull.dataset.gone
    }, 1000)
  }, RETURN)

  // Its target: the nearest coconut still on a tree, or else just past the palms.
  let target: SVGCircleElement | undefined
  let [tx, ty] = [800, 520]
  let best = Infinity
  for (const nut of svg.querySelectorAll<SVGCircleElement>('[data-coconut]:not([data-fallen])')) {
    const at = new DOMPoint(nut.cx.baseVal.value, nut.cy.baseVal.value).matrixTransform(toScene(nut)!)
    const d = Math.hypot(at.x - sx, at.y - sy)
    if (d < best) [best, target, tx, ty] = [d, nut, at.x, at.y]
  }
  if (target) target.dataset.fallen = 'true'
  // Away it goes, off whichever edge is further from where it came from.
  const away = sx < 800 ? 1750 : -150

  // The copy: the gull's flapping wings, plus a coconut it'll carry.
  const copy = document.createElementNS(NS, 'g')
  const wings = gull.querySelector('path')!.cloneNode(true) as SVGPathElement
  const nut = target?.cloneNode(true) as SVGCircleElement | undefined
  if (nut) {
    nut.removeAttribute('data-coconut')
    nut.setAttribute('cx', '0')
    nut.setAttribute('cy', '14')
    nut.setAttribute('r', '9')
    nut.style.opacity = '0'
  }
  copy.append(...(nut ? [nut] : []), wings)

  spawn(layer, copy, (el, age) => {
    let x: number, y: number, s: number
    if (age < DIVE) {
      // Down in a swoop, growing as it comes closer.
      const t = age / DIVE
      ;[x, y, s] = [curve(sx, (sx + tx) / 2, tx, t), curve(sy, ty - 10, ty - 16, t), 1 + t * 0.9]
    } else {
      if (age === DIVE && target && nut) {
        target.style.transition = ''
        target.style.opacity = '0'
        nut.style.opacity = '1'
        squawk()
      }
      // Then up and away, laden.
      const t = (age - DIVE) / ESCAPE
      ;[x, y, s] = [curve(tx, tx + (away - tx) * 0.3, away, t), curve(ty - 16, ty + 20, 80, t), 1.9 - t * 0.6]
    }
    // Facing the way it's flying.
    const flip = (age < DIVE ? tx - sx : away - tx) < 0 ? -1 : 1
    el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s * flip).toFixed(2)} ${s.toFixed(2)})`)
    return age < DIVE + ESCAPE
  })

  if (target) {
    window.setTimeout(() => {
      target.style.transition = 'opacity 1s ease'
      target.style.opacity = '1'
      window.setTimeout(() => delete target.dataset.fallen, 1000)
    }, REGROW)
  }
}

// A white feather rocking side to side as it drifts down.
function feather(layer: Element, x: number, y: number) {
  const drift = (Math.random() - 0.5) * 30
  const el = shape('path', { d: 'M-7 0 Q0 -4 7 0 Q0 4 -7 0 Z', fill: '#fbfaf5', stroke: '#120d0a', 'stroke-width': 1.5 })
  spawn(layer, el, (el, age) => {
    const sway = Math.sin(age / 12)
    el.setAttribute('transform', `translate(${(x + drift * (age / 150) + sway * 14).toFixed(1)} ${(y + age * 0.9).toFixed(1)}) rotate(${(sway * 35).toFixed(1)})`)
    el.setAttribute('opacity', String(Math.min(1, (150 - age) / 30)))
    return age < 150
  })
}
