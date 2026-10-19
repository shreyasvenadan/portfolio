// Everything that swims, in 3D: the same cast as the drawn sea, each built
// from simple shapes in the drawing's own units (shapes.ts) and coloured the
// same. Every model faces +x, is scaled to one unit long, and animates itself
// (tail, fins, legs) given the time and how hard it's swimming.
import * as THREE from 'three'
import { halo } from './reef'
import { INK, inked } from './toon'
import {
  ball,
  band,
  bead,
  cached,
  curve,
  eyes,
  glowing,
  hose,
  paint,
  rod,
  slab,
  solid,
  spike,
  spindle,
  spots,
  type Part,
} from './shapes'

export type Model = {
  root: THREE.Group
  // Animate: `beat` is 0 when idling, 1 cruising, more when bolting.
  swim(t: number, beat: number): void
  // Bright bits, which pulse (a lure, lights).
  lights?: THREE.Object3D[]
  // Where the diver breathes out, for bubbles.
  regulator?: THREE.Object3D
}

const glow = (key: string, parts: () => Part[]) => new THREE.Mesh(cached(key, () => solid(parts())), glowing)

// A model drawn `width` SVG units long: a body and, if it has one, a tail
// that wags about `tail.x`.
function build(width: number, px: number, bodyKey: string, body: () => Part[], tail?: { key: string; x: number; parts: () => Part[]; vertical?: boolean }) {
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / width)
  root.add(inner)
  inner.add(quiet(inked(cached(bodyKey, () => solid(body())), paint, px)))
  let pivot: THREE.Group | undefined
  if (tail) {
    pivot = new THREE.Group()
    pivot.position.x = tail.x
    pivot.add(quiet(inked(cached(tail.key, () => solid(tail.parts()).translate(-tail.x, 0, 0)), paint, px)))
    inner.add(pivot)
  }
  return { root, inner, pivot }
}

// Sea creatures neither cast nor catch the island's shadows.
function quiet<T extends THREE.Object3D>(o: T) {
  o.traverse((c) => {
    c.castShadow = false
    c.receiveShadow = false
  })
  return o
}

// The usual swimming motion: the tail sweeps side to side and the body
// answers it a little.
function wag(inner: THREE.Object3D, pivot: THREE.Object3D | undefined, speed = 1, amount = 0.45) {
  return (t: number, beat: number) => {
    const s = Math.sin(t * (5 + beat * 7) * speed)
    if (pivot) pivot.rotation.y = s * amount * (0.5 + Math.min(beat, 2) * 0.35)
    inner.rotation.y = -s * 0.05
  }
}

// --- reef fish -----------------------------------------------------------------

export function fish(color: string, stripe?: string): Model {
  const B = [0, 0, 34, 17, 9]
  const key = `fish:${color}:${stripe}`
  const { root, inner, pivot } = build(
    92,
    1.6,
    key,
    () => [
      { g: ball, c: color, size: [34, 17, 9] },
      ...(stripe ? [band(stripe, B, 0, 7)] : []),
      band(INK, B, 7, 9, 1.035),
      { g: slab([[-12, -14], [-2, -23], [9, -15]], 2), c: color },
      ...eyes(B, 20, -4, 3.5),
    ],
    { key: `${key}:tail`, x: -30, parts: () => [{ g: slab([[-30, 0], [-52, -16], [-48, 0], [-50, 16]], 2.5), c: color }] },
  )
  return { root, swim: wag(inner, pivot) }
}

export function clownfish(): Model {
  const O = '#f47a2a'
  const B = [0, 0, 36, 20, 11]
  const stripe = (a: number, b: number) => [band(INK, B, a - 1.8, b + 1.8, 1.03), band('#fffaf0', B, a, b, 1.05)]
  const { root, inner, pivot } = build(
    104,
    1.6,
    'clown',
    () => [
      { g: ball, c: O, size: [36, 20, 11] },
      ...stripe(13, 20),
      ...stripe(-9, -2),
      ...stripe(-29, -25),
      { g: slab([[-10, -17], ...curve(-10, -17, 0, -34, 16, -17)], 2.5), c: O },
      ...eyes(B, 26, -5, 3.5),
    ],
    { key: 'clown:tail', x: -32, parts: () => [{ g: slab([[-32, 0], [-52, -16], [-47, 0], [-52, 16]], 3), c: O }] },
  )
  return { root, swim: wag(inner, pivot) }
}

export function tang(body = '#2f6fd6', tail = '#ffd23f'): Model {
  const B = [1, 0, 37, 27, 9]
  const key = `tang:${body}`
  const { root, inner, pivot } = build(
    104,
    1.6,
    key,
    () => [
      { g: ball, c: body, at: [1, 0, 0], size: [37, 27, 9] },
      ...spots('#1b2b5a', B, -2, -8, [20, 6, 1.4]),
      { g: slab([[-26, -22], [-10, -31], [18, -24]], 2.5), c: body },
      { g: slab([[-26, 22], [-10, 30], [12, 24]], 2.5), c: body },
      ...eyes(B, 22, -7, 3.5),
    ],
    { key: `${key}:tail`, x: -34, parts: () => [{ g: slab([[-34, 0], [-56, -20], [-50, -5], [-50, 5], [-56, 20]], 3), c: tail }] },
  )
  return { root, swim: wag(inner, pivot) }
}

export function butterflyfish(): Model {
  const Y = '#ffd84a'
  const B = [3, 0, 39, 31, 8]
  const { root, inner, pivot } = build(
    100,
    1.6,
    'butterfly',
    () => [
      { g: ball, c: Y, at: [3, 0, 0], size: [39, 31, 8] },
      { g: ball, c: Y, at: [39, 2, 0], size: [8, 5, 4] },
      band(INK, B, 15, 24, 1.04),
      ...spots(INK, B, -16, -12, [6, 6, 1.6]),
      { g: slab([[-22, -27], [-4, -37], [16, -29]], 2.5), c: Y },
      ...spots('#fffaf0', B, 22, -5, [3, 3, 2]),
    ],
    { key: 'butterfly:tail', x: -30, parts: () => [{ g: slab([[-30, 0], [-48, -14], [-48, 14]], 2.5), c: Y }] },
  )
  return { root, swim: wag(inner, pivot) }
}

export function angelfish(): Model {
  const W = '#ece4f7'
  const B = [4, 0, 32, 24, 6]
  const fin = (s: number): [number, number][] => [
    [-2, -20 * s],
    [-20, -66 * s],
    [-14, -40 * s],
    [-22, -20 * s],
    [-27, -9 * s],
    [-6, -12 * s],
  ]
  const { root, inner, pivot } = build(
    92,
    1.6,
    'angel',
    () => [
      { g: ball, c: W, at: [4, 0, 0], size: [32, 24, 6] },
      { g: slab(fin(1), 2), c: W },
      { g: slab(fin(-1), 2), c: W },
      band('#3a3550', B, 8, 12, 1.05),
      band('#3a3550', B, -12, -8, 1.05),
      ...eyes(B, 22, -5, 3.5),
    ],
    { key: 'angel:tail', x: -26, parts: () => [{ g: slab([[-26, -8], [-44, -14], [-40, 0], [-44, 14], [-26, 8]], 2), c: W }] },
  )
  return { root, swim: wag(inner, pivot, 0.8) }
}

export function puffer(): Model {
  const B = [0, 0, 30, 30, 28]
  const { root, inner, pivot } = build(
    92,
    1.6,
    'puffer',
    () => {
      const parts: Part[] = [
        { g: ball, c: '#e8c070', size: [30, 30, 28] },
        { g: ball, c: '#fbf0d0', at: [3, 9, 0], size: [25, 20, 25] },
      ]
      // Spikes all over, evenly spread (a Fibonacci sphere), not on the face.
      const n = 34
      for (let i = 0; i < n; i++) {
        const y = 1 - (2 * (i + 0.5)) / n
        const r = Math.sqrt(1 - y * y)
        const a = i * 2.39996
        const d = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
        if (d.x > 0.55 && Math.abs(d.y) < 0.6) continue
        parts.push(spike('#f2d48a', [d.x * 27, d.y * 27, d.z * 25], d, 12, 3.2, 4))
      }
      parts.push(...eyes(B, 15, -10, 8, 3.6), { g: bead, c: INK, at: [29, 5, 0], size: [2, 2.5, 4] })
      return parts
    },
    { key: 'puffer:tail', x: -26, parts: () => [{ g: slab([[-26, 0], [-46, -12], [-46, 12]], 3), c: '#d9a84e' }] },
  )
  return { root, swim: wag(inner, pivot, 1.2) }
}

export function barracuda(): Model {
  const C = '#c4d0d8'
  const F = '#9fb0bc'
  const B = [4, 0, 88, 12, 8.4]
  const { root, inner, pivot } = build(
    196,
    1.8,
    'barracuda',
    () => [
      {
        g: spindle([
          [-84, 0],
          [-80, 4],
          [-60, 8],
          [-20, 11],
          [30, 12],
          [62, 10],
          [82, 6],
          [93, 0],
        ]),
        c: C,
        size: [1, 1, 0.7],
      },
      ...[20, 0, -20, -40].flatMap((x) => spots('#5d6f7c', B, x, -5, [2.2, 4.5, 0.8])),
      { g: slab([[-18, -9], [-30, -21], [-36, -8]], 2), c: F },
      { g: slab([[-40, 8], [-48, 18], [-53, 7]], 2), c: F },
      rod(INK, [70, 4, 0], [91, 1.5, 0], 0.9),
      ...eyes([4, 0, 88, 11, 7.6], 66, -3, 3.2),
    ],
    { key: 'barracuda:tail', x: -78, parts: () => [{ g: slab([[-78, 0], [-98, -18], [-88, 0], [-98, 18]], 2.5), c: F }] },
  )
  return { root, swim: wag(inner, pivot, 0.8, 0.35) }
}

export function swordfish(): Model {
  const C = '#4a6c8c'
  const D = '#35536f'
  const profile: [number, number][] = [
    [-74, 0],
    [-70, 4],
    [-40, 12],
    [0, 18],
    [30, 17],
    [52, 11],
    [62, 5],
    [65, 0],
  ]
  const { root, inner, pivot } = build(
    226,
    1.8,
    'swordfish',
    () => [
      { g: spindle(profile), c: C, size: [1, 1, 0.75] },
      { g: spindle(profile, 1.4), c: '#c9d3da', size: [1, 1, 0.75] },
      { g: new THREE.ConeGeometry(3.2, 64, 6).rotateZ(-Math.PI / 2), c: '#c9d3da', at: [90, -1, 0] },
      { g: slab([[20, -15], [8, -50], [-6, -46], [-2, -30], [-12, -14]], 3), c: D },
      { g: slab([[30, 14], [8, 30], [16, 14]], 2), c: D, at: [0, 0, 8], rot: [0.5, 0, 0] },
      { g: slab([[30, 14], [8, 30], [16, 14]], 2), c: D, at: [0, 0, -8], rot: [-0.5, 0, 0] },
      ...eyes([0, 0, 66, 18, 13.5], 46, -5, 3.8),
    ],
    { key: 'swordfish:tail', x: -70, parts: () => [{ g: slab([[-68, 0], [-100, -38], [-88, -12], [-85, 0], [-88, 12], [-100, 38]], 3), c: D }] },
  )
  return { root, swim: wag(inner, pivot, 0.7, 0.35) }
}

// --- the deep ------------------------------------------------------------------

export function lanternfish(light = '#9ff6ff'): Model {
  const B = [4, 0, 28, 13, 7]
  const { root, inner, pivot } = build(
    72,
    1.4,
    'lantern',
    () => [{ g: ball, c: '#2b3a55', at: [4, 0, 0], size: [28, 13, 7] }, ...eyes(B, 18, -3, 5, 2.6)],
    { key: 'lantern:tail', x: -22, parts: () => [{ g: slab([[-22, 0], [-36, -11], [-36, 11]], 2), c: '#2b3a55' }] },
  )
  const lights = glow(`lantern:${light}`, () => [
    ...[-14, -5, 4, 13].flatMap((x) => spots(light, B, x, 7, [2.6, 2.6, 1.6], 1)),
    ...spots(light, B, 26, -5, [2.4, 2.4, 1.4], 1),
  ])
  inner.add(lights)
  return { root, swim: wag(inner, pivot, 1.3), lights: [lights] }
}

export function hatchetfish(): Model {
  const { root, inner, pivot } = build(
    60,
    1.4,
    'hatchet',
    () => [
      { g: slab([[24, -10], [-22, -14], [-26, -2], [-8, 24], ...curve(-8, 24, 16, 16, 24, -10, 3).slice(0, -1)], 8, 2.5), c: '#cfd8e3' },
      ...eyes([0, 0, 30, 20, 5], 12, -6, 4.5, 2.2),
    ],
    { key: 'hatchet:tail', x: -20, parts: () => [{ g: slab([[-20, -10], [-33, -18], [-33, 0]], 1.5), c: '#aab6c4' }] },
  )
  const lights = glow('hatchet:lights', () =>
    [-12, -4, 4, 12].flatMap((x, i) => [
      { g: bead, c: '#a6f0ff', at: [x, 14 - i * 2 + (x > 0 ? -4 : 0), 5.4] as [number, number, number], size: 2 },
      { g: bead, c: '#a6f0ff', at: [x, 14 - i * 2 + (x > 0 ? -4 : 0), -5.4] as [number, number, number], size: 2 },
    ]),
  )
  inner.add(lights)
  return { root, swim: wag(inner, pivot, 1.3), lights: [lights] }
}

// A moray eel: a chain of beads rippling in a travelling wave behind its head.
export function eel(color = '#6b7a3a'): Model {
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / 240)
  root.add(inner)
  const head = quiet(
    inked(
      cached(`eel:${color}`, () =>
        solid([
          { g: ball, c: color, size: [18, 10.5, 9] },
          rod(INK, [8, 5, 0], [17, 3, 0], 0.8),
          ...spots('#f6e68a', [0, 0, 18, 10.5, 9], 6, -3, [3, 3, 2]),
        ]),
      ),
      paint,
      1.8,
    ),
  )
  head.position.x = 102
  inner.add(head)
  const segs: THREE.Mesh[] = []
  const N = 17
  for (let i = 0; i < N; i++) {
    const s = quiet(inked(cached(`eel:seg:${color}`, () => solid([{ g: ball, c: color }])), paint, 1.8))
    const r = 10 - (i / N) * 7
    s.scale.set(r * 1.3, r, r)
    inner.add(s)
    segs.push(s)
  }
  return {
    root,
    swim(t, beat) {
      const phase = t * (2.6 + beat * 1.5)
      const y = (x: number) => 7 * Math.sin(((100 - x) / 100) * Math.PI * 2 - phase) * Math.min(1, (100 - x) / 40)
      segs.forEach((s, i) => {
        const x = 90 - i * 12
        s.position.set(x, y(x), 0)
        s.rotation.z = Math.atan2(y(x + 6) - y(x - 6), 12)
      })
      head.rotation.z = Math.atan2(y(96) - y(84), 12) * 0.5
    },
  }
}

// A scuba diver swimming belly-down, kicking. They carry a SeaLens camera in
// the reef and a torch in the dark.
export function diver(suit = '#23262e', stripe = '#e2553d', gear?: 'camera' | 'torch'): Model {
  const B = [4, -1, 45, 16, 15]
  const key = `diver:${suit}:${gear}`
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / 236)
  root.add(inner)
  inner.add(
    quiet(
      inked(
        cached(key, () =>
          solid([
            { g: ball, c: suit, at: [4, -1, 0], size: [45, 16, 15] },
            band(stripe, B, -14, -8, 1.04),
            { g: new THREE.CylinderGeometry(9, 9, 60, 12).rotateZ(Math.PI / 2), c: '#d8dde3', at: [-5, -24, 0] },
            { g: ball, c: '#d8dde3', at: [25, -24, 0], size: [3, 9, 9] },
            hose(INK, [26, -30, 0], [56, -40, 0], [70, 2, 4], 1.4),
            { g: ball, c: suit, at: [58, -6, 0], size: 15 },
            { g: ball, c: '#8fd3e8', at: [69, -9, 0], size: [6, 6.5, 11] },
            { g: ball, c: '#3a3d45', at: [71, 5, 0], size: 5 },
            rod(suit, [30, 2, 9], [84, 14, 9], 6),
            rod(suit, [24, 2, -12], [52, 12, -14], 5.5),
            ...(gear === 'camera'
              ? [
                  { g: new THREE.BoxGeometry(26, 20, 18), c: '#f2c230', at: [97, 12, 9] as [number, number, number] },
                  { g: new THREE.CylinderGeometry(7, 7, 8, 14).rotateZ(Math.PI / 2), c: '#253447', at: [112, 12, 9] as [number, number, number] },
                ]
              : gear === 'torch'
                ? [{ g: new THREE.CylinderGeometry(5.5, 5.5, 16, 12).rotateZ(Math.PI / 2), c: '#9aa3ad', at: [90, 13, 9] as [number, number, number] }]
                : []),
          ]),
        ),
        paint,
        1.8,
      ),
    ),
  )
  const lights: THREE.Object3D[] = []
  if (gear === 'camera') {
    const led = glow('diver:led', () => [{ g: bead, c: '#e5483b', at: [90, 4, 9], size: 2.2 }])
    inner.add(led)
    lights.push(led)
  }
  if (gear === 'torch') {
    // The beam: a soft cone of light ahead of the torch.
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(52, 160, 20, 1, true).rotateZ(Math.PI / 2).translate(180, -13, 9),
      new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    )
    beam.material.defines = { GLOW: '' }
    inner.add(beam)
  }
  const legs = [-6, 2].map((y, i) => {
    const leg = new THREE.Group()
    leg.position.set(-36, -y, i ? -6 : 6)
    leg.add(
      quiet(
        inked(
          cached(`diver:leg:${suit}`, () =>
            solid([rod(suit, [0, 0, 0], [-44, -4, 0], 6.5), { g: slab([[-42, -10], [-82, -16], [-80, 8], [-42, 4]], 2.5), c: '#f2c230' }]),
          ),
          paint,
          1.8,
        ),
      ),
    )
    inner.add(leg)
    return leg
  })
  const regulator = new THREE.Object3D()
  regulator.position.set(74, -2, 0)
  inner.add(regulator)
  return {
    root,
    lights,
    regulator,
    swim(t, beat) {
      const k = Math.sin(t * (3 + beat * 2))
      legs[0].rotation.z = k * 0.16
      legs[1].rotation.z = -k * 0.16
    },
  }
}

// --- the big ones --------------------------------------------------------------

export function shark(body = '#6f8796'): Model {
  const profile: [number, number][] = [
    [-112, 0],
    [-104, 6],
    [-80, 14],
    [-40, 26],
    [0, 32],
    [40, 33],
    [80, 28],
    [110, 20],
    [130, 12],
    [141, 4],
    [144, 0],
  ]
  const B = [16, 0, 128, 32, 25]
  const { root, inner, pivot } = build(
    300,
    2,
    `shark:${body}`,
    () => [
      { g: spindle(profile), c: body, size: [1, 1, 0.8] },
      { g: spindle(profile, 1.5), c: '#eef3f5', size: [1, 1, 0.8] },
      { g: slab([[18, -28], [-4, -80], ...curve(-4, -80, 34, -62, 56, -28)], 5), c: body },
      { g: slab([[-60, -18], [-72, -36], [-78, -14]], 3), c: body },
      { g: slab([[40, 16], [6, 58], [66, 22]], 4), c: body, at: [0, 0, 18], rot: [0.6, 0, 0] },
      { g: slab([[40, 16], [6, 58], [66, 22]], 4), c: body, at: [0, 0, -18], rot: [-0.6, 0, 0] },
      ...[74, 85, 96].flatMap((x) => spots(INK, B, x, -2, [1.2, 9, 1])),
      ...spots(INK, B, 122, 10, [14, 1.4, 1]),
      ...eyes(B, 112, -10, 4.5),
    ],
    { key: `shark:${body}:tail`, x: -104, parts: () => [{ g: slab([[-100, -4], [-152, -60], ...curve(-152, -60, -132, -4, -150, 46), [-100, 6]], 4), c: body }] },
  )
  return { root, swim: wag(inner, pivot, 0.5, 0.3) }
}

// Whales and dolphins beat their flukes up and down.
function flukes(key: string, color: string, x: number, length: number, span: number) {
  const pivot = new THREE.Group()
  pivot.position.x = x
  pivot.add(
    quiet(
      inked(
        cached(key, () =>
          solid([{ g: slab([[4, 0], [-length, -span], [-length * 0.72, -span * 0.15], [-length * 0.6, 0], [-length * 0.72, span * 0.15], [-length, span]], length * 0.08), c: color, rot: [Math.PI / 2, 0, 0] }]),
        ),
        paint,
        2,
      ),
    ),
  )
  return pivot
}

export function whale(body = '#3f6b8f', belly = '#a9c4d6'): Model {
  const profile: [number, number][] = [
    [-224, 0],
    [-212, 10],
    [-160, 26],
    [-100, 44],
    [-30, 62],
    [40, 72],
    [120, 74],
    [190, 66],
    [230, 50],
    [248, 28],
    [253, 0],
  ]
  const B = [20, 0, 236, 72, 60]
  const { root, inner } = build(524, 2.2, `whale:${body}`, () => [
    { g: spindle(profile), c: body, size: [1, 0.92, 0.82] },
    { g: spindle(profile, 1.6), c: belly, size: [1, 0.92, 0.82] },
    ...[34, 46].flatMap((y) => spots('#2f5574', B, 150, y, [60, 1.4, 1])),
    { g: slab([[-14, -60], [-2, -86], [22, -66]], 8), c: body },
    ...[1, -1].map((side): Part => ({ g: slab([[80, 42], ...curve(80, 42, 46, 104, -14, 98), ...curve(-14, 98, 30, 72, 40, 40)], 6), c: body, at: [0, 0, side * 46], rot: [side * 0.5, 0, 0] })),
    ...spots(INK, B, 205, 22, [46, 1.6, 1]),
    ...eyes(B, 186, 10, 5.5),
  ])
  const tail = flukes(`whale:${body}:flukes`, body, -212, 56, 52)
  inner.add(tail)
  return {
    root,
    swim(t, beat) {
      tail.rotation.z = Math.sin(t * (1.6 + beat)) * 0.32
      inner.rotation.z = -Math.sin(t * (1.6 + beat)) * 0.02
    },
  }
}

export function dolphin(): Model {
  const C = '#7aa6c2'
  const profile: [number, number][] = [
    [-92, 0],
    [-86, 5],
    [-50, 17],
    [0, 27],
    [40, 26],
    [70, 19],
    [86, 9],
    [92, 5],
    [104, 3],
    [108, 0],
  ]
  const B = [8, 0, 100, 26, 22]
  const { root, inner } = build(220, 1.8, 'dolphin', () => [
    { g: spindle(profile), c: C, size: [1, 1, 0.85] },
    { g: spindle(profile, 1.4), c: '#dbe9f1', size: [1, 1, 0.85] },
    { g: slab([[4, -24], [-8, -52], [-30, -62], [-18, -40], [-28, -22]], 4), c: C },
    { g: slab([[28, 16], [12, 42], [46, 18]], 3), c: C, at: [0, 0, 16], rot: [0.6, 0, 0] },
    { g: slab([[28, 16], [12, 42], [46, 18]], 3), c: C, at: [0, 0, -16], rot: [-0.6, 0, 0] },
    ...spots(INK, B, 96, 6, [12, 1.2, 1]),
    ...eyes(B, 64, -7, 3.8),
  ])
  const tail = flukes('dolphin:flukes', C, -88, 24, 28)
  inner.add(tail)
  return {
    root,
    swim(t, beat) {
      tail.rotation.z = Math.sin(t * (3 + beat * 3)) * 0.4
      inner.rotation.z = -Math.sin(t * (3 + beat * 3)) * 0.03
    },
  }
}

// A manta ray, flying through the water on wings that beat slowly up and down.
// In the drawing it's seen from above: forward is up the page, its wings
// spread left and right.
export function manta(): Model {
  const C = '#2d4d70'
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / 420)
  root.add(inner)
  // Drawn as [side, back] from above (SVG x, y), laid flat: forward is -y.
  const flat = (pts: [number, number][], depth: number) => slab(pts.map(([s, b]) => [-b, -s]), depth).rotateX(Math.PI / 2)
  inner.add(
    quiet(
      inked(
        cached('manta', () =>
          solid([
            { g: flat([[-36, -48], [0, -52], [36, -48], [38, 66], [30, 72], [0, 84], [-30, 72], [-38, 66]], 16), c: C },
            { g: new THREE.CylinderGeometry(1.5, 4, 90, 6).rotateZ(Math.PI / 2), c: C, at: [-120, 0, 0] },
            { g: ball, c: '#dfe8ef', at: [0, 6, 0], size: [56, 6, 30] },
            { g: flat([[-22, -46], [-32, -76], [-14, -72], [-14, -48]], 5), c: C },
            { g: flat([[22, -46], [32, -76], [14, -72], [14, -48]], 5), c: C },
            { g: ball, c: '#dfe8ef', at: [30, -2, 22], size: 4 },
            { g: ball, c: '#dfe8ef', at: [30, -2, -22], size: 4 },
          ]),
        ),
        paint,
        2,
      ),
    ),
  )
  const wings = [1, -1].map((side) => {
    const pivot = new THREE.Group()
    pivot.position.z = side * 34
    const pts: [number, number][] = [[0, -48], ...curve(0, -48, 70, -38, 166, 40), ...curve(166, 40, 100, 32, 4, 64)]
    pivot.add(quiet(inked(cached(`manta:wing:${side}`, () => solid([{ g: flat(pts.map(([s, b]) => [s * side, b]), 8), c: C }])), paint, 2)))
    inner.add(pivot)
    return pivot
  })
  return {
    root,
    swim(t, beat) {
      const f = Math.sin(t * (1.4 + beat * 0.8)) * 0.35
      wings[0].rotation.x = -f
      wings[1].rotation.x = f
      // A gentle rise and fall with each beat (inner is in body lengths).
      inner.position.y = -f * 0.03
    },
  }
}

export function turtle(): Model {
  const G = '#79b35a'
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / 260)
  root.add(inner)
  inner.add(
    quiet(
      inked(
        cached('turtle', () =>
          solid([
            { g: ball, c: '#8a6433', size: [92, 38, 62] },
            { g: ball, c: '#c9b27a', at: [0, 8, 0], size: [86, 30, 58] },
            { g: ball, c: '#a5793f', at: [0, -6, 0], size: [56, 34, 38] },
            { g: ball, c: G, at: [112, -4, 0], size: [26, 18, 20] },
            ...eyes([112, -4, 26, 18, 20], 124, -10, 3.5),
          ]),
        ),
        paint,
        2,
      ),
    ),
  )
  const flipper = (x: number, z: number, length: number, width: number, sweep: number) => {
    const pivot = new THREE.Group()
    pivot.position.set(x, 0, z)
    pivot.rotation.y = sweep
    const f = quiet(inked(cached(`turtle:flipper:${length}`, () => solid([{ g: ball, c: G, at: [0, 0, length], size: [width, 5, length] }])), paint, 1.8))
    if (z < 0) f.rotation.y = Math.PI
    pivot.add(f)
    inner.add(pivot)
    return pivot
  }
  const front = [flipper(50, 44, 46, 16, 0.5), flipper(50, -44, 46, 16, -0.5)]
  const back = [flipper(-50, 40, 30, 13, -0.6), flipper(-50, -40, 30, 13, 0.6)]
  return {
    root,
    swim(t, beat) {
      const s = Math.sin(t * (1.6 + beat))
      front[0].rotation.x = -s * 0.5
      front[1].rotation.x = s * 0.5
      back[0].rotation.x = s * 0.2
      back[1].rotation.x = -s * 0.2
    },
  }
}

export function anglerfish(): Model {
  const D = '#3a2d46'
  const B = [5, -5, 125, 83, 70]
  const { root, inner, pivot } = build(
    320,
    2.2,
    'angler',
    () => {
      const teeth: Part[] = []
      for (let i = 0; i < 7; i++) {
        const a = -0.8 + (i / 6) * 1.6
        const x = 98 + Math.cos(a) * 26
        const z = Math.sin(a) * 40
        teeth.push(spike('#f4efe0', [x, 14, z], new THREE.Vector3(0, 1, 0), 12, 3.4, 4))
        if (i % 2 === 0) teeth.push(spike('#f4efe0', [x - 6, 46, z * 0.9], new THREE.Vector3(0, -1, 0), 10, 3, 4))
      }
      return [
        { g: ball, c: D, at: [5, -5, 0], size: [125, 83, 70] },
        { g: ball, c: '#150f1c', at: [96, 30, 0], size: [36, 20, 46] },
        ...teeth,
        hose('#51405d', [40, -70, 0], [80, -160, 0], [150, -112, 0], 3.5),
        ...eyes(B, 40, -30, 16, 6),
        { g: slab([[-40, -84], [-30, -106], [-14, -86]], 5), c: D },
      ]
    },
    { key: 'angler:tail', x: -110, parts: () => [{ g: slab([[-110, -60], [-160, -20], [-110, 30]], 6), c: D }] },
  )
  const lure = glow('angler:lure', () => [{ g: ball, c: '#fff3b8', at: [150, -110, 0], size: 14 }])
  const shine = halo('#ffe28a', 110, 0.6)
  shine.position.set(150, 110, 0)
  inner.add(lure, shine)
  const swim = wag(inner, pivot, 0.6, 0.3)
  return {
    root,
    lights: [lure],
    swim(t, beat) {
      swim(t, beat)
      // The lure glows brighter and dimmer, to draw prey in.
      shine.material.opacity = 0.4 + 0.25 * Math.sin(t * 2.6)
    },
  }
}
