// Clicking the pirate ship hits it as if with a cannonball (never shown): a
// boom, a burst, splinters and smoke, a splintered hole left in it, and the
// ship lurches, listing a little more and riding lower with each hit. Enough
// hits and it rolls over and sinks with a stream of bubbles. Once it's out of
// sight it's repaired, ready for its next pass.
import { bubble, burst, shape, smoke, spawn, splinters } from './effects'
import { cannonHit, sinkingShip } from './sound'

const HITS_TO_SINK = 4
// The ship's waterline in the scene's units, and how deep splinters fall.
const WATER_Y = 650
// Per hit, in the ship's own units: degrees of list and how much lower it sits.
const LIST = 3
const LOWER = 4
const SINK_SECONDS = 4

export function hitShip(hull: SVGGElement, clientX: number, clientY: number) {
  const svg = hull.ownerSVGElement
  const layer = svg?.querySelector('.ship-layer')
  const voyage = hull.closest<SVGGElement>('#pirate-ship')
  const art = hull.querySelector<SVGGElement>('[data-pirate-art]')
  const toScene = svg?.getScreenCTM()?.inverse()
  const toArt = art?.getScreenCTM()?.inverse()
  if (!svg || !layer || !voyage || !art || !toScene || !toArt || voyage.dataset.sunk) return

  const hits = Number(hull.dataset.hits ?? 0) + 1
  hull.dataset.hits = String(hits)
  if (hits === 1) repairWhenGone(hull, voyage)

  const at = new DOMPoint(clientX, clientY).matrixTransform(toScene)
  cannonHit()
  burst(layer, at.x, at.y, 0.8)
  smoke(layer, at.x, at.y, 1.6, 60)
  splinters(layer, at.x, at.y, WATER_Y + 30)
  // The hole is drawn on the ship itself, so it rocks and sinks with it.
  const local = new DOMPoint(clientX, clientY).matrixTransform(toArt)
  art.append(hole(local.x, local.y))

  if (hits >= HITS_TO_SINK) {
    voyage.dataset.sunk = 'true'
    lurch(hull, hits, () => sink(hull, voyage, layer))
  } else lurch(hull, hits)
}

// A ragged hole with splintered, pale wood round its edge.
function hole(x: number, y: number) {
  const points = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    const r = (i % 2 ? 7 : 13) + Math.random() * 3
    return `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`
  })
  return shape('path', {
    'data-hole': '',
    d: `M${points.join(' L')} Z`,
    transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.random() * 360})`,
    fill: '#1a0f08',
    stroke: '#d9b07a',
    'stroke-width': 3,
    'stroke-linejoin': 'round',
  })
}

// A hard rock from the impact, settling at the ship's new list and depth.
function lurch(hull: SVGGElement, hits: number, done?: () => void) {
  const frames = 45
  spawn(hull, shape('g'), (_, age) => {
    const angle = hits * LIST + 7 * Math.exp(-age / 12) * Math.sin(age / 2.2)
    hull.setAttribute('transform', `translate(0 ${hits * LOWER}) rotate(${angle.toFixed(2)})`)
    if (age >= frames) done?.()
    return age < frames
  })
}

// Swap the ship for a still copy where it is, and roll that under the water.
function sink(hull: SVGGElement, voyage: SVGGElement, layer: Element) {
  const svg = hull.ownerSVGElement!
  const anchor = hull.parentElement as unknown as SVGGElement
  const m = svg.getScreenCTM()!.inverse().multiply(anchor.getScreenCTM()!)
  const wreck = hull.cloneNode(true) as SVGGElement
  wreck.removeAttribute('data-pirate')
  const placed = shape('g', { transform: `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})` })
  placed.append(wreck)
  const clipped = shape('g', { 'clip-path': 'url(#above-water)' })
  clipped.append(placed)
  layer.prepend(clipped)
  voyage.style.opacity = '0'
  sinkingShip(SINK_SECONDS)

  const hits = Number(hull.dataset.hits)
  const frames = SINK_SECONDS * 60
  spawn(layer, clipped, (_, age) => {
    const t = Math.min(1, age / frames)
    const ease = t * t
    wreck.setAttribute('transform', `translate(0 ${(hits * LOWER + ease * 340).toFixed(1)}) rotate(${(hits * LIST + ease * 24).toFixed(1)})`)
    // Bubbles boil up around it as it goes.
    if (age % 4 === 0) bubble(layer, m.e + (Math.random() - 0.5) * 120 * m.a, WATER_Y - 2)
    return age < frames
  })
}

// Once the ship has sailed (or sunk) out of sight, patch it up for next time.
function repairWhenGone(hull: SVGGElement, voyage: SVGGElement) {
  const timer = window.setInterval(() => {
    const r = hull.getBoundingClientRect()
    if (r.right > 0 && r.left < window.innerWidth) return
    window.clearInterval(timer)
    for (const el of hull.querySelectorAll('[data-hole]')) el.remove()
    hull.removeAttribute('transform')
    delete hull.dataset.hits
    delete voyage.dataset.sunk
    voyage.style.opacity = ''
  }, 500)
}
