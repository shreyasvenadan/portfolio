// Clicking a coconut knocks it off the palm: it drops onto the sand, bounces,
// rolls to a stop, and a new one grows back on the tree a few seconds later.
import { thud } from './sound'

const NS = 'http://www.w3.org/2000/svg'
const REGROW = 7000

export function dropCoconut(nut: SVGCircleElement) {
  const svg = nut.ownerSVGElement
  const layer = svg?.querySelector('.fallen-nuts')
  const toRoot = svg?.getScreenCTM()?.inverse().multiply(nut.getScreenCTM()!)
  if (!svg || !layer || !toRoot || nut.dataset.fallen) return
  nut.dataset.fallen = 'true'

  // Where the coconut hangs, in the scene's own units.
  const start = new DOMPoint(nut.cx.baseVal.value, nut.cy.baseVal.value).matrixTransform(toRoot)
  const r = nut.r.baseVal.value * Math.hypot(toRoot.a, toRoot.b)
  const ground = Number(nut.dataset.ground) - r + (Math.random() - 0.5) * 8

  const fallen = document.createElementNS(NS, 'g')
  fallen.innerHTML = `<circle r="${r}" fill="${nut.getAttribute('fill')}" stroke="#120d0a" stroke-width="2.6" />
    <circle cx="${-r * 0.35}" cy="${-r * 0.2}" r="${r * 0.14}" fill="#3d2914" />
    <circle cx="${r * 0.05}" cy="${-r * 0.42}" r="${r * 0.14}" fill="#3d2914" />
    <circle cx="${r * 0.3}" cy="${-r * 0.05}" r="${r * 0.14}" fill="#3d2914" />`
  fallen.style.transition = 'opacity 1s ease'
  layer.append(fallen)
  nut.style.transition = 'opacity 1s ease'
  nut.style.opacity = '0'

  let { x, y } = start
  let vx = (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random() * 1.6)
  let vy = 0
  let bounces = 0
  const step = () => {
    vy += 0.9
    y += vy
    if (y >= ground) {
      y = ground
      if (bounces === 0) thud()
      vy = bounces < 2 ? -vy * 0.35 : 0
      bounces++
      vx *= 0.96
    }
    x += vx
    fallen.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(((x - start.x) / r) * 180) / Math.PI})`)
    if (vy !== 0 || Math.abs(vx) > 0.05) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)

  window.setTimeout(() => {
    fallen.style.opacity = '0'
    nut.style.opacity = '1'
    window.setTimeout(() => {
      fallen.remove()
      delete nut.dataset.fallen
    }, 1000)
  }, REGROW)
}
