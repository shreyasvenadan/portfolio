// The things on and around the island, built from simple shapes. Units are
// roughly metres; the sea is at y = 0 and the island sits around the origin.
import * as THREE from 'three'
import type { SandMarks } from './sand'
import { inked, jitter, plain, ramp, seeded, toon } from './toon'

export const SAND = '#f1d69e'
const WET_SAND = '#d9b77c'
const TRUNK = '#9b6a3e'
const TRUNK_SHADE = '#7c5230'
const LEAF = '#3f9a58'
const LEAF_SHADE = '#2f7a44'
const COCONUT = '#6b4a2b'
const WOOD = '#b98150'
const MOUNTAIN = '#a9a0b9'
const HILL = '#8a9bb0'

// --- the island -----------------------------------------------------------------

// A low mound of sand, highest in the middle and dipping under the water
// round its edge. The beach runs out towards us (front) further than it goes
// back, so it reaches the bottom of the view like the drawn island did.
export const ISLAND = { cz: 0, rx: 10.5, back: 8.4, front: 13, height: 1.7, sink: 0.3 }

const depthOf = (z: number) => (z > ISLAND.cz ? ISLAND.front : ISLAND.back)
// ...narrowing as it comes, into a spit of sand.
const widthAt = (z: number) => ISLAND.rx * (1 - 0.45 * Math.max(0, (z - ISLAND.cz) / ISLAND.front))

export function groundAt(x: number, z: number) {
  const r = (x / widthAt(z)) ** 2 + ((z - ISLAND.cz) / depthOf(z)) ** 2
  return ISLAND.height * (1 - r) - ISLAND.sink
}

// `marks` is what's been drawn in the sand (sand.ts), darkening it.
export function island(marks: SandMarks) {
  const g = new THREE.PlaneGeometry(ISLAND.rx * 2.4, (ISLAND.back + ISLAND.front) * 1.2, 34, 32)
  g.rotateX(-Math.PI / 2)
  g.translate(0, 0, ISLAND.cz + ((ISLAND.front - ISLAND.back) * 1.2) / 2)
  const pos = g.attributes.position
  const rand = seeded(11)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + (rand() - 0.5) * 0.4
    const z = pos.getZ(i) + (rand() - 0.5) * 0.4
    pos.setXYZ(i, x, Math.max(-0.45, groundAt(x, z) + (rand() - 0.5) * 0.08), z)
  }
  const flat = g.toNonIndexed()
  flat.computeVertexNormals()
  // Wet, darker sand at the water's edge.
  const colors: number[] = []
  const dry = new THREE.Color(SAND)
  const wet = new THREE.Color(WET_SAND)
  const p = flat.attributes.position
  for (let i = 0; i < p.count; i += 3) {
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3
    const c = y < 0.22 ? wet : dry
    for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b)
  }
  flat.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp })
  // From under the water, the sand below the waterline isn't drawn: the rock
  // the island stands on (reef.ts) takes over there.
  const water = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    water.call(material, shader, renderer)
    shader.uniforms.marks = { value: marks.texture }
    shader.uniforms.marksArea = { value: marks.area }
    shader.fragmentShader = `uniform sampler2D marks;\nuniform vec4 marksArea;\n${shader.fragmentShader}`.replace(
      '#include <fog_fragment>',
      /* glsl */ `
  {
    // Marks in dry sand: black is a groove, white its lit lip.
    vec4 m = texture2D( marks, ( vFogWorld.xz - marksArea.xy ) / marksArea.zw );
    gl_FragColor.rgb *= mix( 1.0, mix( 0.68, 1.1, m.r ), m.a * smoothstep( 0.05, 0.2, vFogWorld.y ) );
  }
  #include <fog_fragment>
  if ( cameraPosition.y < 0.0 && vFogWorld.y < 0.35 ) discard;`,
    )
  }
  const mesh = plain(flat, material)
  mesh.name = 'island'

  const group = new THREE.Group()
  group.add(mesh)

  // Grass tufts and a few rocks.
  const blade = new THREE.ConeGeometry(0.07, 0.45, 4)
  for (const [x, z] of [
    [-6.5, -1.5],
    [-2.2, -4.5],
    [5.4, -3.2],
    [7.2, 1.2],
    [-7.6, 2],
  ]) {
    const tuft = new THREE.Group()
    for (let i = 0; i < 5; i++) {
      const b = inked(blade, toon(i % 2 ? LEAF : LEAF_SHADE), 1.5)
      b.position.set((i - 2) * 0.09, 0.18, (i % 2) * 0.06)
      b.rotation.z = (i - 2) * 0.22
      tuft.add(b)
    }
    tuft.position.set(x, groundAt(x, z), z)
    group.add(tuft)
  }
  // The rocks at the water's edge are only seen from above it (world.ts).
  const shore = new THREE.Group()
  shore.name = 'shore'
  group.add(shore)
  const rock = new THREE.DodecahedronGeometry(0.5, 0)
  for (const [x, z, s] of [
    [-9.3, 1.5, 1.2],
    [-8.6, 3.2, 0.7],
    [9.1, 2.6, 1],
    [8.2, -3.6, 0.8],
  ]) {
    const r = inked(rock, toon('#8d8a86'), 2)
    r.scale.set(s, s * 0.7, s)
    r.rotation.set(x, z, s)
    r.position.set(x, Math.max(-0.1, groundAt(x, z)), z)
    shore.add(r)
  }
  return group
}

// Foam lapping round the island where the sand meets the water.
export function foam() {
  const shore = Math.sqrt(1 - ISLAND.sink / ISLAND.height)
  const shape = new THREE.Shape()
  const hole = new THREE.Path()
  const n = 48
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const z = Math.sin(a) * depthOf(Math.sin(a)) * shore
    const x = Math.cos(a) * widthAt(z) * shore
    if (i === 0) {
      shape.moveTo(x * 1.06, z * 1.07)
      hole.moveTo(x * 0.97, z * 0.96)
    } else {
      shape.lineTo(x * 1.06, z * 1.07)
      hole.lineTo(x * 0.97, z * 0.96)
    }
  }
  shape.holes.push(hole)
  const g = new THREE.ShapeGeometry(shape)
  g.rotateX(Math.PI / 2)
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#f5fbf4', transparent: true, opacity: 0.9, side: THREE.DoubleSide }))
  mesh.position.set(0, 0.04, ISLAND.cz)
  return mesh
}

// --- palm trees ---------------------------------------------------------------

// A leaf: a long, notched blade, given a little thickness and drooping
// towards its tip. It grows out along +x.
function leafGeometry(length: number, width: number) {
  const shape = new THREE.Shape()
  const steps = 9
  shape.moveTo(0, 0)
  for (let i = 1; i <= steps; i++) {
    const s = i / steps
    const w = width * Math.sin(Math.PI * s) ** 0.7 * (1 - s * 0.35)
    shape.lineTo(length * (s - 0.04), w * 0.62)
    shape.lineTo(length * s, i === steps ? 0 : w)
  }
  for (let i = steps - 1; i >= 1; i--) {
    const s = i / steps
    const w = width * Math.sin(Math.PI * s) ** 0.7 * (1 - s * 0.35)
    shape.lineTo(length * s, -w)
    shape.lineTo(length * (s - 0.04), -w * 0.62)
  }
  shape.lineTo(0, 0)
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false })
  // Lay it flat (width along z), then bend it down along its length.
  g.rotateX(Math.PI / 2)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const s = pos.getX(i) / length
    pos.setY(i, pos.getY(i) + length * (0.35 * s - 0.75 * s * s) - Math.abs(pos.getZ(i)) * 0.25)
  }
  g.computeVertexNormals()
  return g
}

export type Palm = { group: THREE.Group; crown: THREE.Group; nuts: THREE.Mesh[] }

// A palm that leans as it grows. `lean` is how far the top is out to the side.
export function palm(height: number, lean: number, seed: number): Palm {
  const group = new THREE.Group()
  const rand = seeded(seed)
  const points: THREE.Vector3[] = []
  const N = 9
  for (let i = 0; i <= N; i++) {
    const t = i / N
    points.push(new THREE.Vector3(lean * t * t, height * t, 0))
  }
  for (let i = 0; i < N; i++) {
    const [a, b] = [points[i], points[i + 1]]
    const len = a.distanceTo(b)
    const r0 = 0.34 - (i / N) * 0.14
    const r1 = 0.34 - ((i + 1) / N) * 0.14
    // Each piece a little wider at its top, like the rings of a palm trunk.
    const seg = inked(new THREE.CylinderGeometry(r1 * 1.12, r0 * 0.94, len * 1.02, 7), toon(i % 2 ? TRUNK : TRUNK_SHADE), 2.5)
    seg.position.copy(a).add(b).multiplyScalar(0.5)
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    group.add(seg)
  }

  const crown = new THREE.Group()
  crown.position.copy(points[N])
  group.add(crown)
  const leaf = leafGeometry(3.1, 0.55)
  for (let i = 0; i < 8; i++) {
    const frond = inked(leaf, toon(i % 2 ? LEAF_SHADE : LEAF), 2)
    frond.rotation.y = (i / 8) * Math.PI * 2 + rand() * 0.3
    frond.rotation.z = 0.15 + rand() * 0.25
    frond.scale.setScalar(0.85 + rand() * 0.3)
    crown.add(frond)
  }

  // Coconuts hang under the leaves; each can be knocked down.
  const nutGeo = new THREE.IcosahedronGeometry(0.26, 1)
  const nuts: THREE.Mesh[] = []
  for (const [x, y, z] of [
    [0.22, -0.28, 0.12],
    [-0.18, -0.3, 0.2],
    [0.02, -0.26, -0.24],
  ]) {
    const nut = inked(nutGeo, toon(COCONUT), 2)
    nut.position.set(x, y, z)
    nut.userData.home = nut.position.clone()
    crown.add(nut)
    nuts.push(nut)
  }
  return { group, crown, nuts }
}

// --- props on the sand ------------------------------------------------------

function label(text: string, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = Math.round((512 * height) / width)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  const draw = () => {
    const c = canvas.getContext('2d')!
    c.clearRect(0, 0, canvas.width, canvas.height)
    c.fillStyle = '#120d0a'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.font = `${canvas.height * 0.62}px 'Pencil Child', 'Comic Sans MS', cursive`
    c.fillText(text, canvas.width / 2, canvas.height * 0.55)
    texture.needsUpdate = true
  }
  draw()
  document.fonts?.load(`40px 'Pencil Child'`).then(draw, () => {})
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true }))
  return mesh
}

// The signpost: Melbourne one way, Bali and Jakarta the other.
export function signpost() {
  const group = new THREE.Group()
  // The post finishes just above the top board in a little pointed cap.
  const post = inked(new THREE.BoxGeometry(0.2, 2.95, 0.2), toon(WOOD), 2.5)
  post.position.y = 1.475
  group.add(post)
  const cap = inked(new THREE.ConeGeometry(0.17, 0.2, 4), toon(TRUNK_SHADE), 2)
  cap.rotation.y = Math.PI / 4
  cap.position.y = 3.05
  group.add(cap)
  const boards: [string, number, 1 | -1, number][] = [
    ['melbourne', 2.7, -1, 1.6],
    ['bali', 2.25, 1, 1.05],
    ['jakarta', 1.8, 1, 1.35],
  ]
  for (const [text, y, dir, w] of boards) {
    const s = new THREE.Shape()
    const h = 0.2
    s.moveTo(-w / 2, -h)
    s.lineTo(w / 2, -h)
    s.lineTo(w / 2 + 0.22, 0)
    s.lineTo(w / 2, h)
    s.lineTo(-w / 2, h)
    s.lineTo(-w / 2, -h)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false })
    g.translate(0, 0, -0.04)
    const board = inked(g, toon(WOOD), 2)
    board.scale.x = dir
    board.position.set(dir * (w / 2 - 0.05), y, 0.14)
    board.rotation.y = dir * 0.12
    const text3d = label(text, w * 0.95, 0.38)
    text3d.position.z = 0.05
    text3d.scale.x = dir
    board.add(text3d)
    group.add(board)
  }
  return group
}

// A football: white with black patches round each of the twelve corners of an
// icosahedron, like the pentagons on a real one.
export function football(radius: number) {
  const g = new THREE.IcosahedronGeometry(radius, 1).toNonIndexed()
  const corners = new THREE.IcosahedronGeometry(1, 0)
  const tips: THREE.Vector3[] = []
  const cp = corners.attributes.position
  for (let i = 0; i < cp.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(cp, i).normalize()
    if (!tips.some((t) => t.distanceTo(v) < 0.01)) tips.push(v)
  }
  const pos = g.attributes.position
  const colors: number[] = []
  const white = new THREE.Color('#fffdf6')
  const black = new THREE.Color('#1d1d22')
  for (let i = 0; i < pos.count; i += 3) {
    const c = new THREE.Vector3()
    for (let k = 0; k < 3; k++) c.add(new THREE.Vector3().fromBufferAttribute(pos, i + k))
    c.normalize()
    const col = tips.some((t) => t.dot(c) > 0.94) ? black : white
    for (let k = 0; k < 3; k++) colors.push(col.r, col.g, col.b)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return inked(g, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp }), 2.5)
}

// A video camera on a tripod, its red light blinking: it's recording.
export function tripodCamera() {
  const group = new THREE.Group()
  // Three legs from a head under the camera, splayed out to the sand.
  const top = new THREE.Vector3(0, 1.85, 0)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4
    const foot = new THREE.Vector3(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6)
    const l = inked(new THREE.CylinderGeometry(0.035, 0.045, top.distanceTo(foot), 6), toon('#2c2c33'), 2)
    l.position.copy(top).add(foot).multiplyScalar(0.5)
    l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize())
    group.add(l)
  }
  const head = inked(new THREE.CylinderGeometry(0.13, 0.1, 0.16, 8), toon('#2c2c33'), 2)
  head.position.y = 1.88
  group.add(head)
  const body = inked(new THREE.BoxGeometry(0.75, 0.48, 0.42), toon('#2c2c33'), 2.5)
  body.position.y = 2.2
  group.add(body)
  const handle = inked(new THREE.BoxGeometry(0.28, 0.14, 0.2), toon('#2c2c33'), 2)
  handle.position.set(-0.12, 0.3, 0)
  body.add(handle)
  const lens = inked(new THREE.CylinderGeometry(0.17, 0.2, 0.3, 10), toon('#4b5563'), 2)
  lens.rotation.z = Math.PI / 2
  lens.position.x = 0.5
  body.add(lens)
  const glass = plain(new THREE.CircleGeometry(0.11, 10), new THREE.MeshBasicMaterial({ color: '#8fd3e8' }))
  glass.rotation.y = Math.PI / 2
  glass.position.x = 0.66
  body.add(glass)
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#e5483b' }))
  light.position.set(0.25, 0.18, 0.22)
  body.add(light)
  group.userData.light = light
  return group
}

// --- far away: Mount Agung and the hills on the horizon -------------------------

export function horizon() {
  const group = new THREE.Group()
  const agung = inked(jitter(new THREE.ConeGeometry(48, 42, 9, 3, true), 3, 4), toon(MOUNTAIN), 2)
  agung.position.set(-70, 20, -230)
  group.add(agung)
  const snow = inked(jitter(new THREE.ConeGeometry(11.5, 10.5, 9, 1), 0.8, 7), toon('#f4efe6'), 2)
  snow.position.set(-70, 36.4, -230)
  group.add(snow)
  for (const [x, z, rx, h] of [
    [-25, -200, 30, 12],
    [95, -220, 40, 9],
    [140, -240, 30, 15],
  ]) {
    const hill = inked(jitter(new THREE.SphereGeometry(1, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0.08, x), toon(HILL), 2)
    hill.scale.set(rx, h, rx * 0.5)
    hill.position.set(x, 0, z)
    group.add(hill)
  }
  return group
}

// --- the sky -----------------------------------------------------------------

// A puffy cloud: a few lumpy balls with a flat bottom.
export function cloud(seed: number) {
  const group = new THREE.Group()
  const rand = seeded(seed)
  const ball = new THREE.IcosahedronGeometry(1, 1)
  const puffs: [number, number, number, number][] = [
    [0, 0.2, 0, 1.6],
    [-1.6, -0.2, 0.2, 1.15],
    [1.7, -0.15, 0, 1.25],
    [-0.6, 0.9, -0.3, 1.1],
    [0.8, 0.7, 0.3, 1.05],
  ]
  for (const [x, y, z, s] of puffs) {
    const p = inked(ball, toon('#fff5e2'), 2.5)
    p.position.set(x + (rand() - 0.5) * 0.3, y, z)
    p.scale.set(s, s * 0.85, s)
    p.castShadow = false
    p.userData.puff = true
    group.add(p)
  }
  return group
}

// A little red-and-white propeller plane, flying along +x.
export function plane() {
  const group = new THREE.Group()
  const white = toon('#f4efe6')
  const red = toon('#e5483b')
  const body = inked(new THREE.CapsuleGeometry(0.42, 2.6, 3, 8), white, 2.5)
  body.rotation.z = Math.PI / 2
  group.add(body)
  const stripe = inked(new THREE.CylinderGeometry(0.44, 0.44, 0.25, 10), red, 1.5)
  stripe.rotation.z = Math.PI / 2
  stripe.position.x = -0.2
  group.add(stripe)
  const wing = inked(new THREE.BoxGeometry(0.9, 0.1, 4.6), red, 2.5)
  wing.position.set(0.2, -0.1, 0)
  group.add(wing)
  const tail = inked(new THREE.BoxGeometry(0.6, 0.85, 0.1), red, 2)
  tail.position.set(-1.65, 0.5, 0)
  group.add(tail)
  const fin = inked(new THREE.BoxGeometry(0.5, 0.08, 1.6), red, 2)
  fin.position.set(-1.65, 0.1, 0)
  group.add(fin)
  const glass = inked(new THREE.SphereGeometry(0.32, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon('#8fd3e8'), 2)
  glass.position.set(0.55, 0.3, 0)
  group.add(glass)
  const prop = inked(new THREE.BoxGeometry(0.06, 1.3, 0.14), toon('#2c2c33'), 1.5)
  prop.position.x = 1.78
  // Found by name, so copies of the plane (the wreck) have their own.
  prop.name = 'prop'
  group.add(prop)
  return group
}

// A gull: a white body and two wings that flap.
export function gull() {
  const group = new THREE.Group()
  const body = inked(new THREE.CapsuleGeometry(0.16, 0.5, 2, 6), toon('#fbfaf5'), 2)
  body.rotation.z = Math.PI / 2
  group.add(body)
  const beak = inked(new THREE.ConeGeometry(0.06, 0.2, 4), toon('#f2a33a'), 1.5)
  beak.rotation.z = -Math.PI / 2
  beak.position.x = 0.48
  group.add(beak)
  const wing = new THREE.BoxGeometry(0.34, 0.04, 1)
  wing.translate(0, 0, 0.5)
  const wings: THREE.Object3D[] = []
  for (const side of [1, -1]) {
    const pivot = new THREE.Group()
    const w = inked(wing, toon('#fbfaf5'), 2)
    const tip = inked(new THREE.BoxGeometry(0.3, 0.045, 0.3), toon('#3a3a40'), 1.5)
    tip.position.z = 0.88
    w.add(tip)
    pivot.add(w)
    pivot.scale.z = side
    group.add(pivot)
    wings.push(pivot)
  }
  group.userData.wings = wings
  return group
}

// A pirate ship with black sails and a skull and crossbones, sailing along +x.
export function pirateShip() {
  const group = new THREE.Group()
  const hullShape = new THREE.Shape()
  hullShape.moveTo(-3.6, 1.1)
  hullShape.lineTo(3.4, 1.1)
  hullShape.quadraticCurveTo(3.2, 0, 2.2, -0.3)
  hullShape.lineTo(-2.8, -0.3)
  hullShape.quadraticCurveTo(-3.5, 0, -3.6, 1.1)
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 1.8, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.2, bevelSegments: 1 })
  hullGeo.translate(0, 0, -0.9)
  const hull = inked(hullGeo, toon('#6b4226'), 2.5)
  group.add(hull)
  const stripe = inked(new THREE.BoxGeometry(6.9, 0.16, 2.25), toon('#d9a441'), 1.5)
  stripe.position.y = 0.75
  group.add(stripe)
  const stern = inked(new THREE.BoxGeometry(1.5, 0.8, 1.9), toon('#5a361e'), 2)
  stern.position.set(-2.8, 1.5, 0)
  group.add(stern)
  for (const x of [-1.6, -0.4, 0.8, 2]) {
    const port = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8), new THREE.MeshBasicMaterial({ color: '#120d0a' }))
    port.position.set(x, 0.35, 1.13)
    group.add(port)
  }
  const sail = sailTexture()
  for (const [x, h, w] of [
    [-1.5, 3.6, 1.9],
    [0.9, 5, 2.6],
  ]) {
    const mast = inked(new THREE.CylinderGeometry(0.09, 0.11, h, 6), toon(WOOD), 2)
    mast.position.set(x, 1.1 + h / 2, 0)
    group.add(mast)
    // Billowing sails: a curved sheet bulging forwards.
    const g = new THREE.PlaneGeometry(w, h * 0.55, 6, 4)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.35 * Math.cos((pos.getX(i) / w) * Math.PI) * Math.cos((pos.getY(i) / (h * 0.55)) * Math.PI))
    g.rotateY(Math.PI / 2)
    g.computeVertexNormals()
    const sheet = new THREE.Mesh(g, x > 0 ? new THREE.MeshToonMaterial({ map: sail, side: THREE.DoubleSide }) : toon('#2b2b30', { side: THREE.DoubleSide }))
    sheet.rotation.y = -Math.PI / 2
    sheet.position.set(x + 0.15, 1.3 + h * 0.55, 0)
    sheet.castShadow = true
    group.add(sheet)
  }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45, 4, 1), toon('#2b2b30', { side: THREE.DoubleSide }))
  flag.position.set(1.3, 6.35, 0)
  group.add(flag)
  group.userData.flag = flag
  // An unseen box round the whole ship, so clicks between the sails count.
  const target = new THREE.Mesh(new THREE.BoxGeometry(7.6, 7, 2.6), new THREE.MeshBasicMaterial({ visible: false }))
  target.position.y = 2.9
  group.add(target)
  return group
}

// A little shore crab, facing +z: a wide shell, eyes on stalks (userData.eyes,
// which fold back), a claw each
// side (whose top pincer opens, userData.pincers) and three legs a side
// (userData.legs, for scuttling).
export function crab() {
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)
  group.userData.body = body
  const shell = toon('#d9532f')
  const dark = toon('#a83a20')
  const top = inked(new THREE.SphereGeometry(0.3, 14, 10), shell, 2)
  top.scale.set(1, 0.42, 0.78)
  top.position.y = 0.16
  body.add(top)
  // Each eye and its stalk, hinged where the stalk meets the shell, so they
  // can fold back flat when it sleeps (userData.eyes).
  const eyes: THREE.Object3D[] = []
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group()
    hinge.position.set(side * 0.08, 0.2, 0.15)
    const stalk = inked(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 5), dark, 1.2)
    stalk.position.y = 0.07
    hinge.add(stalk)
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#120d0a' }))
    eye.position.y = 0.15
    hinge.add(eye)
    body.add(hinge)
    eyes.push(hinge)
  }
  group.userData.eyes = eyes
  const legs: THREE.Object3D[] = []
  // Each leg rises out to a knee, then reaches down to the sand: the hip is
  // 0.14 up, the knee 0.09 above that, and the foot back on the ground.
  const UPPER = 0.18
  const LOWER = 0.25
  const upperLeg = new THREE.CapsuleGeometry(0.025, UPPER, 2, 5).rotateZ(Math.PI / 2).translate(UPPER / 2, 0, 0)
  const lowerLeg = new THREE.CapsuleGeometry(0.022, LOWER, 2, 5).rotateZ(Math.PI / 2).translate(LOWER / 2, 0, 0)
  const rise = Math.asin(0.09 / UPPER)
  const drop = Math.asin((0.14 + 0.09) / LOWER)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const hip = new THREE.Group()
      hip.position.set(side * 0.22, 0.14, 0.08 - i * 0.1)
      // Mirrored for the left side, so +x always runs out from the shell.
      hip.scale.x = side
      hip.rotation.y = side * (0.2 - i * 0.25)
      const upper = inked(upperLeg, dark, 1.2)
      upper.rotation.z = rise
      hip.add(upper)
      const knee = new THREE.Group()
      knee.position.set(Math.cos(rise) * UPPER, 0.09, 0)
      knee.rotation.z = -drop
      knee.add(inked(lowerLeg, dark, 1.2))
      hip.add(knee)
      hip.userData.side = side
      body.add(hip)
      legs.push(hip)
    }
  }
  const pincers: THREE.Object3D[] = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * 0.24, 0.17, 0.18)
    arm.rotation.y = -side * 0.5
    const upper = inked(new THREE.CapsuleGeometry(0.035, 0.12, 2, 6), shell, 1.2)
    upper.rotation.x = Math.PI / 2
    upper.position.z = 0.08
    arm.add(upper)
    const claw = inked(new THREE.SphereGeometry(0.08, 10, 8), shell, 1.5)
    claw.scale.set(0.8, 0.6, 1.2)
    claw.position.z = 0.22
    arm.add(claw)
    const pincer = new THREE.Group()
    pincer.position.set(0, 0.03, 0.27)
    const jaw = inked(new THREE.CapsuleGeometry(0.025, 0.08, 2, 5), shell, 1.2)
    jaw.rotation.x = Math.PI / 2
    jaw.position.z = 0.05
    pincer.add(jaw)
    arm.add(pincer)
    body.add(arm)
    pincers.push(pincer)
  }
  group.userData.legs = legs
  group.userData.pincers = pincers
  // An unseen box round it, since it's small.
  const target = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.8), new THREE.MeshBasicMaterial({ visible: false }))
  target.position.y = 0.2
  group.add(target)
  return group
}

// A baby turtle, facing +z, with flippers that row (userData.flippers).
export function hatchling() {
  const group = new THREE.Group()
  const shell = inked(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#5f9a52'), 1.5)
  shell.scale.set(0.85, 0.6, 1)
  shell.position.y = 0.06
  group.add(shell)
  const skin = toon('#a9c98a')
  const head = inked(new THREE.SphereGeometry(0.07, 10, 8), skin, 1.2)
  head.position.set(0, 0.09, 0.23)
  group.add(head)
  const flippers: THREE.Object3D[] = []
  for (const [x, z] of [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ]) {
    const pivot = new THREE.Group()
    pivot.position.set(x * 0.15, 0.05, z * 0.1)
    const f = inked(new THREE.SphereGeometry(1, 8, 6), skin, 1.2)
    f.scale.set(z > 0 ? 0.11 : 0.07, 0.02, 0.05)
    f.position.x = x * (z > 0 ? 0.08 : 0.05)
    pivot.add(f)
    pivot.userData.side = x
    group.add(pivot)
    flippers.push(pivot)
  }
  group.userData.flippers = flippers
  return group
}

// A turtle's egg, sitting at its middle. Whole (userData.whole) until it
// cracks; then two open halves, unoutlined since their insides show: the top
// (userData.top) comes off and the bottom (userData.bottom) stays behind.
export function turtleEgg() {
  const group = new THREE.Group()
  group.scale.set(1, 1.2, 1)
  const whole = inked(new THREE.SphereGeometry(0.11, 12, 8), toon('#f6efdc'), 1.2)
  const shell = toon('#f6efdc', { side: THREE.DoubleSide })
  const top = plain(new THREE.SphereGeometry(0.11, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2), shell)
  const bottom = plain(new THREE.SphereGeometry(0.11, 12, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shell)
  top.visible = bottom.visible = false
  group.add(whole, top, bottom)
  Object.assign(group.userData, { whole, top, bottom })
  return group
}

// A small sea chest with its lid shut (userData.lid, hinged at the back) and
// gold inside (userData.gold), for when it's opened.
export function treasureChest() {
  const group = new THREE.Group()
  const wood = toon('#7a4a24')
  const band = toon('#e9b949')
  const box = inked(new THREE.BoxGeometry(0.9, 0.5, 0.56), wood, 2)
  box.position.y = 0.25
  group.add(box)
  for (const x of [-0.3, 0.3]) {
    const strap = inked(new THREE.BoxGeometry(0.08, 0.52, 0.58), band, 1.2)
    strap.position.set(x, 0.25, 0)
    group.add(strap)
  }
  const gold = new THREE.Group()
  const coin = new THREE.SphereGeometry(0.07, 8, 6)
  const shine = new THREE.MeshBasicMaterial({ color: '#ffd166' })
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(coin, shine)
    c.position.set(-0.3 + (i % 5) * 0.15, 0.48 + (i % 2) * 0.04, i < 5 ? -0.08 : 0.1)
    gold.add(c)
  }
  group.add(gold)
  group.userData.gold = gold
  const lid = new THREE.Group()
  lid.position.set(0, 0.5, -0.28)
  const top = inked(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), toon('#8f5a2c'), 2)
  top.position.z = 0.28
  lid.add(top)
  const lock = inked(new THREE.BoxGeometry(0.14, 0.16, 0.05), band, 1.2)
  lock.position.set(0, -0.02, 0.57)
  lid.add(lock)
  group.add(lid)
  group.userData.lid = lid
  return group
}

export function cannonball() {
  return inked(new THREE.SphereGeometry(0.22, 12, 8), toon('#2a2a2e'), 2)
}

function sailTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const c = canvas.getContext('2d')!
  c.fillStyle = '#2b2b30'
  c.fillRect(0, 0, 256, 256)
  c.fillStyle = c.strokeStyle = '#f4efe6'
  c.lineWidth = 22
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(78, 200)
  c.lineTo(178, 150)
  c.moveTo(78, 150)
  c.lineTo(178, 200)
  c.stroke()
  c.beginPath()
  c.arc(128, 98, 46, 0, Math.PI * 2)
  c.fill()
  c.fillRect(104, 120, 48, 34)
  c.fillStyle = '#2b2b30'
  for (const x of [110, 146]) {
    c.beginPath()
    c.arc(x, 96, 12, 0, Math.PI * 2)
    c.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
