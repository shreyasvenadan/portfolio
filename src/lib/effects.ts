// Short-lived SVG effects for the surface scene (bursts, smoke, splinters,
// spray). Each runs its own frame loop and removes itself when it's done.
// Coordinates are in the scene's own units.

const NS = 'http://www.w3.org/2000/svg'
const INK = '#120d0a'
const FOAM = '#f5fbf4'

export function shape(tag: string, attrs: Record<string, string | number> = {}) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  return el
}

// Adds `el` to `parent` and calls `update` every frame with its age in frames
// until it returns false, then removes it.
export function spawn(parent: Element, el: SVGElement, update: (el: SVGElement, age: number) => boolean) {
  parent.append(el)
  let age = 0
  const step = () => {
    if (update(el, age++)) requestAnimationFrame(step)
    else el.remove()
  }
  step()
}

// A jagged orange explosion that grows, spins and fades.
export function burst(parent: Element, x: number, y: number, size = 1) {
  spawn(
    parent,
    shape('path', {
      d: 'M0 -34 L9 -12 L32 -16 L15 2 L28 24 L4 13 L-10 32 L-12 9 L-34 4 L-14 -8 L-24 -28 L-4 -14 Z',
      fill: '#ffb238',
      stroke: INK,
      'stroke-width': 3.5,
      'stroke-linejoin': 'round',
    }),
    (el, age) => {
      el.setAttribute('transform', `translate(${x} ${y}) scale(${size * (1 + age * 0.06)}) rotate(${age * 3})`)
      el.setAttribute('opacity', String(Math.max(0, 1 - age / 24)))
      return age < 24
    },
  )
}

// A grey puff that swells, drifts up and fades.
export function smoke(parent: Element, x: number, y: number, size = 1, life = 42) {
  spawn(parent, shape('circle', { cx: x, cy: y, fill: '#4a4448' }), (el, age) => {
    el.setAttribute('r', String(size * (5 + age * 0.35)))
    el.setAttribute('opacity', String(Math.max(0, 0.7 - age / (life * 1.4))))
    el.setAttribute('cy', String(y - age * 0.4))
    return age < life
  })
}

// Something thrown off with gravity until it drops below `floor`.
function fling(parent: Element, el: SVGElement, x: number, y: number, vx: number, vy: number, floor: number, spin = 0) {
  spawn(parent, el, (el, age) => {
    vy += 0.3
    x += vx
    y += vy
    el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(age * spin).toFixed(1)})`)
    return y <= floor
  })
}

// Wooden splinters blown off a hull.
export function splinters(parent: Element, x: number, y: number, floor: number, count = 8) {
  for (let i = 0; i < count; i++) {
    const [w, h] = [6 + Math.random() * 8, 2.5 + Math.random() * 2]
    const plank = shape('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#a8743f', stroke: INK, 'stroke-width': 1.5 })
    fling(parent, plank, x, y, (Math.random() - 0.5) * 8, -3 - Math.random() * 6, floor, (Math.random() - 0.5) * 30)
  }
}

// Rings spreading on the water, and spray thrown up and falling back.
export function splashRings(parent: Element, x: number, y: number) {
  for (const delay of [0, 8]) {
    spawn(parent, shape('ellipse', { cx: x, cy: y, fill: 'none', stroke: FOAM, 'stroke-width': 4 }), (el, age) => {
      const a = Math.max(0, age - delay)
      el.setAttribute('rx', String(14 + a * 3))
      el.setAttribute('ry', String(4 + a * 0.6))
      el.setAttribute('opacity', String(age < delay ? 0 : Math.max(0, 1 - a / 40)))
      return a < 40
    })
  }
  for (let i = 0; i < 14; i++) {
    const drop = shape('circle', { r: 4 + Math.random() * 5, fill: FOAM, stroke: INK, 'stroke-width': 2 })
    fling(parent, drop, x, y, (Math.random() - 0.5) * 7, -6 - Math.random() * 6, y)
  }
}

// A bubble that wobbles up a little from the surface and pops.
export function bubble(parent: Element, x: number, y: number) {
  const r = 3 + Math.random() * 4
  spawn(parent, shape('circle', { cx: x, cy: y, r, fill: 'none', stroke: FOAM, 'stroke-width': 2 }), (el, age) => {
    el.setAttribute('cx', String(x + Math.sin(age / 3) * 2))
    el.setAttribute('cy', String(y - age * 0.5))
    el.setAttribute('opacity', String(Math.max(0, 1 - age / 30)))
    return age < 30
  })
}
