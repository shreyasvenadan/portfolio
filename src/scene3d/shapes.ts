// Building blocks for the sea creatures and the reef. A model is drawn as a
// list of coloured parts that are merged into one mesh (one draw, one
// outline), coloured per vertex, so a whole fish costs about as much as a
// single shape. Parts are placed in the drawn (SVG) version's units, x to
// the right and y DOWN, so the 2D art can be copied across directly.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ramp } from './toon'

export type V3 = [number, number, number]
export type Part = {
  g: THREE.BufferGeometry
  c: string
  // Position in SVG units (y down), rotation (radians) and scale.
  at?: V3
  rot?: V3
  q?: THREE.Quaternion
  size?: number | V3
}

// One material for everything coloured per vertex, and one for the parts
// that glow in the dark (unlit, and not dimmed by depth).
export const paint = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp })
export const glowing = new THREE.MeshBasicMaterial({ vertexColors: true })
glowing.defines = { GLOW: '' }

const tmp = new THREE.Object3D()

// Merges parts into one geometry, each part's colour stored per vertex.
export function solid(parts: Part[]) {
  const geos = parts.map(({ g, c, at = [0, 0, 0], rot, q, size = 1 }) => {
    const geo = g.index ? g.toNonIndexed() : g.clone()
    for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal') geo.deleteAttribute(name)
    if (!geo.attributes.normal) geo.computeVertexNormals()
    tmp.position.set(at[0], -at[1], at[2])
    if (q) tmp.quaternion.copy(q)
    else tmp.rotation.set(...(rot ?? [0, 0, 0]))
    if (typeof size === 'number') tmp.scale.setScalar(size)
    else tmp.scale.set(...size)
    tmp.updateMatrix()
    geo.applyMatrix4(tmp.matrix)
    const col = new THREE.Color(c)
    const colors = new Float32Array(geo.attributes.position.count * 3)
    for (let i = 0; i < colors.length; i += 3) colors.set([col.r, col.g, col.b], i)
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  })
  return mergeGeometries(geos)!
}

// Shared geometries, built once each.
const cache = new Map<string, THREE.BufferGeometry>()
export function cached(key: string, build: () => THREE.BufferGeometry) {
  let g = cache.get(key)
  if (!g) cache.set(key, (g = build()))
  return g
}

export const ball = new THREE.SphereGeometry(1, 16, 12)
export const bead = new THREE.SphereGeometry(1, 8, 6)

// A flat shape with some thickness (a fin, a tail), from SVG points, centred
// on z = 0.
export function slab(points: [number, number][], depth: number, bevel = depth * 0.4) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, -y)))
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 4 })
  g.translate(0, 0, -depth / 2)
  return g
}

// Points along a quadratic curve, for slab outlines (the end point included,
// the start not).
export function curve(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, steps = 5): [number, number][] {
  const out: [number, number][] = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const a = (1 - t) * (1 - t)
    const b = 2 * (1 - t) * t
    const c = t * t
    out.push([a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1])
  }
  return out
}

// A body turned on a lathe round the x axis, from [x, radius] pairs running
// tail to nose. With `arc`, only that wedge (centred on straight down) is
// made, a little proud of the body, for a pale belly.
export function spindle(profile: [number, number][], arc?: number) {
  const pts = profile.map(([x, r]) => new THREE.Vector2(r * (arc ? 1.03 : 1), x))
  const g = arc ? new THREE.LatheGeometry(pts, 14, Math.PI / 2 - arc / 2, arc) : new THREE.LatheGeometry(pts, 18)
  // The lathe's axis is y; lay it along x (y → x, x → -y).
  g.rotateZ(-Math.PI / 2)
  return g
}

// A band round an ellipsoid (rx, ry, rz) centred at (cx, cy), between x = a
// and x = b (SVG units), standing a little proud of it: a stripe.
export function band(c: string, [cx, cy, rx, ry, rz]: number[], a: number, b: number, lift = 1.03): Part {
  const clamp = (v: number) => Math.min(1, Math.max(-1, v))
  const t0 = Math.acos(clamp((b - cx) / rx))
  const t1 = Math.acos(clamp((a - cx) / rx))
  const g = new THREE.SphereGeometry(1, 20, 4, 0, Math.PI * 2, t0, t1 - t0).rotateZ(-Math.PI / 2)
  return { g, c, at: [cx, cy, 0], size: [rx * lift, ry * lift, rz * lift] }
}

// A pair of flat spots on either side of an ellipsoid body (a marking, an
// eye), at SVG point (x, y). `body` is [cx, cy, rx, ry, rz].
export function spots(c: string, [cx, cy, rx, ry, rz]: number[], x: number, y: number, r: number | V3, out = 0.4): Part[] {
  const f = 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2
  const z = rz * Math.sqrt(Math.max(0.02, f))
  const size: V3 = typeof r === 'number' ? [r, r, r * out] : r
  return [
    { g: ball, c, at: [x, y, z], size },
    { g: ball, c, at: [x, y, -z], size },
  ]
}

// Eyes on either side: white with a pupil, or just a dark dot.
export function eyes(body: number[], x: number, y: number, r: number, pupil?: number): Part[] {
  if (!pupil) return spots('#120d0a', body, x, y, r, 0.7)
  const [cx, cy, rx, ry, rz] = body
  const f = 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2
  const z = rz * Math.sqrt(Math.max(0.02, f))
  return [
    ...spots('#f4efe0', body, x, y, r, 0.75),
    { g: bead, c: '#120d0a', at: [x + r * 0.25, y, z + r * 0.62], size: pupil },
    { g: bead, c: '#120d0a', at: [x + r * 0.25, y, -z - r * 0.62], size: pupil },
  ]
}

// A cone pointing along a direction (SVG units), from `from` for `length`.
export function spike(c: string, from: V3, dir: THREE.Vector3, length: number, radius: number, sides = 5): Part {
  const g = new THREE.ConeGeometry(radius, length, sides).translate(0, length / 2, 0)
  // In SVG units y points down, so flip it to build the rotation.
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dir.x, -dir.y, dir.z).normalize())
  return { g, c, at: from, q }
}

// A rod between two SVG points.
export function rod(c: string, a: V3, b: V3, radius: number, sides = 8): Part {
  const from = new THREE.Vector3(a[0], -a[1], a[2])
  const to = new THREE.Vector3(b[0], -b[1], b[2])
  const length = from.distanceTo(to)
  const g = new THREE.CapsuleGeometry(radius, Math.max(0.001, length), 2, sides)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize())
  const mid = from.add(to).multiplyScalar(0.5)
  return { g, c, at: [mid.x, -mid.y, mid.z], q }
}

// A tube along a quadratic curve between SVG points.
export function hose(c: string, a: V3, ctrl: V3, b: V3, radius: number): Part {
  const v = ([x, y, z]: V3) => new THREE.Vector3(x, -y, z)
  const g = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(v(a), v(ctrl), v(b)), 12, radius, 6)
  return { g, c }
}
