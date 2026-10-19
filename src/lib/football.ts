// Clicking the football kicks it away from the cursor: it sails over the beach
// in a spinning arc, splashes into the sea in front of the island and bobs on
// the waves as it drifts off. A while later a fresh one is back on the sand.
import { splashRings } from './effects'
import { prefersReducedMotion } from './sections'
import { splash, thud } from './sound'

const NS = 'http://www.w3.org/2000/svg'
// The front sea's waterline, in the scene's units.
const WATER = 800
const FLIGHT = 64
const GRAVITY = 0.5
const BOB = 420
const RETURN = 10000

export function kickBall(ball: SVGGElement, clientX: number) {
  const svg = ball.ownerSVGElement
  const layer = svg?.querySelector('.kick-layer')
  const m = svg?.getScreenCTM()?.inverse().multiply(ball.getScreenCTM()!)
  if (!svg || !layer || !m || ball.dataset.kicked) return
  thud()
  if (prefersReducedMotion()) return
  ball.dataset.kicked = 'true'
  ball.style.opacity = '0'
  window.setTimeout(() => {
    ball.style.transition = 'opacity 1s ease'
    ball.style.opacity = ''
    window.setTimeout(() => {
      ball.style.transition = ''
      delete ball.dataset.kicked
    }, 1000)
  }, RETURN)

  // Kicked away from the side it was clicked on, into the sea past the beach.
  const r = ball.getBoundingClientRect()
  const dir = clientX < r.left + r.width / 2 ? 1 : -1
  let [x, y] = [m.e, m.f]
  const landX = dir === 1 ? 1360 + Math.random() * 120 : 160 + Math.random() * 120
  let vx = (landX - x) / FLIGHT
  // Launched so that it comes down at the waterline after FLIGHT frames.
  let vy = (WATER - y - (GRAVITY * FLIGHT * FLIGHT) / 2) / FLIGHT

  const copy = document.createElementNS(NS, 'g')
  copy.append(...[...ball.children].map((child) => child.cloneNode(true)))
  layer.append(copy)

  let age = 0
  let spin = 0
  const step = () => {
    if (age < FLIGHT) {
      vy += GRAVITY
      x += vx
      y += vy
      spin += dir * 14
    } else {
      if (age === FLIGHT) {
        splash()
        splashRings(layer, x, WATER)
      }
      // Bobbing on the swell, drifting slowly on.
      const t = age - FLIGHT
      x += vx * 0.03
      y = WATER + Math.sin(t / 14) * 4
      spin += dir * 0.4
      copy.setAttribute('opacity', String(Math.min(1, (BOB - t) / 60)))
    }
    copy.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(0.8) rotate(${spin.toFixed(1)})`)
    if (age++ < FLIGHT + BOB) requestAnimationFrame(step)
    else copy.remove()
  }
  requestAnimationFrame(step)
}
