// What's under the island, in 3D: the rock it stands on with the reef
// growing up its face, light shafts, jellyfish, the shipwreck, the sea floor
// with its message in a bottle and treasure chest. Small pieces face +z (the
// camera), stand on y = 0 and are one unit wide; the ocean (ocean.ts) places
// and sizes them.
import * as THREE from 'three'
import { ISLAND } from './models'
import { ball, bead, cached, curve, glowing, hose, paint, rod, slab, solid, type Part } from './shapes'
import { inked, jitter, seeded } from './toon'

const quiet = <T extends THREE.Object3D>(o: T) => {
  o.traverse((c) => {
    c.castShadow = false
    c.receiveShadow = false
  })
  return o
}

// A piece drawn in SVG units `width` across, standing on y = 0.
function piece(key: string, width: number, parts: () => Part[], px = 1.8) {
  const root = new THREE.Group()
  const mesh = quiet(inked(cached(key, () => solid(parts())), paint, px))
  mesh.scale.setScalar(1 / width)
  root.add(mesh)
  return root
}

// --- the rock under the island -----------------------------------------------------

// Its outline at a few depths: [height, sides, front, back, shift back]. It
// starts just under the island's beach, tucks in under the sandy spit, bulges
// out where the reef grows, then falls away back into the dark.
const LEVELS = [
  [-0.75, 1.0, 1.0, 1.0, 0],
  [-1.5, 1.02, 0.86, 1.0, 0],
  [-2.8, 1.05, 0.6, 1.02, 0],
  [-5, 1.1, 0.54, 1.05, 0],
  [-8.5, 1.14, 0.57, 1.08, 0],
  [-12, 1.12, 0.52, 1.1, -1],
  [-16, 1.0, 0.4, 1.1, -5],
  [-22, 0.85, 0.3, 1.0, -16],
  [-30, 0.7, 0.25, 0.9, -30],
  [-40, 0.5, 0.2, 0.7, -44],
  [-46, 0.08, 0.08, 0.08, -50],
]
const AROUND = 44

// The island's shoreline where the sand is 0.45 under water, as (x, z) per angle.
function shore(a: number): [number, number] {
  const s = Math.sqrt(1 + (0.45 - ISLAND.sink) / ISLAND.height)
  const front = Math.sin(a) > 0
  const z = Math.sin(a) * (front ? ISLAND.front : ISLAND.back) * s
  const width = ISLAND.rx * (1 - 0.45 * Math.max(0, z / ISLAND.front))
  return [Math.cos(a) * width * s, z]
}

const ringAt = (level: number[], a: number): [number, number] => {
  const [x, z] = shore(a)
  return [x * level[1], (z > 0 ? z * level[2] : z * level[3]) + level[4]]
}

// How far forward the rock's face comes at (x, y), so things can sit on it.
export function rockFace(x: number, y: number) {
  let i = 0
  while (i < LEVELS.length - 2 && LEVELS[i + 1][0] > y) i++
  const f = THREE.MathUtils.clamp((LEVELS[i][0] - y) / (LEVELS[i][0] - LEVELS[i + 1][0]), 0, 1)
  const front = (level: number[]) => {
    // Walk the front half of the ring to the segment spanning x.
    let best = -Infinity
    for (let k = 0; k < 64; k++) {
      const [x0, z0] = ringAt(level, (k / 64) * Math.PI)
      const [x1, z1] = ringAt(level, ((k + 1) / 64) * Math.PI)
      if ((x - x0) * (x - x1) <= 0 && x0 !== x1) best = Math.max(best, z0 + ((x - x0) / (x1 - x0)) * (z1 - z0))
    }
    return best
  }
  return THREE.MathUtils.lerp(front(LEVELS[i]), front(LEVELS[i + 1]), f)
}

export function seamount() {
  const pos: number[] = []
  const colors: number[] = []
  const rand = seeded(23)
  const rock = new THREE.Color('#5f7e74')
  const dark = new THREE.Color('#50695f')
  const deep = new THREE.Color('#34504c')
  const pt = (j: number, i: number) => {
    const [x, z] = ringAt(LEVELS[j], (i / AROUND) * Math.PI * 2)
    return [x, LEVELS[j][0], z]
  }
  for (let j = 0; j < LEVELS.length - 1; j++) {
    for (let i = 0; i < AROUND; i++) {
      const a = pt(j, i)
      const b = pt(j, i + 1)
      const c = pt(j + 1, i)
      const d = pt(j + 1, i + 1)
      for (const tri of [
        [a, b, c],
        [b, d, c],
      ]) {
        const y = (tri[0][1] + tri[1][1] + tri[2][1]) / 3
        const col = (rand() < 0.3 ? dark : rock).clone().lerp(deep, Math.min(1, -y / 30))
        for (const p of tri) {
          pos.push(...p)
          colors.push(col.r, col.g, col.b)
        }
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  jitter(g, 0.5, 4)
  // Its top stays clear of the troughs between waves.
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) p.setY(i, Math.min(p.getY(i), -0.6))
  g.computeVertexNormals()
  const mesh = inked(g, paint, 2.5)
  mesh.castShadow = false
  return mesh
}

// --- reef pieces (each one unit wide, standing on y = 0) -----------------------------

export function rock(shape: number, color: string) {
  return piece(`rock:${shape}:${color}`, 1, () => {
    const lump = (seed: number) => jitter(new THREE.DodecahedronGeometry(1, 1), 0.25, seed)
    const lumps: [number, number, number, number, number][] = [
      [[0, 0.12, 0, 0.5, 0.32]],
      [[0, 0.16, 0, 0.46, 0.4]],
      [
        [-0.24, 0.12, 0, 0.26, 0.24],
        [0.2, 0.14, 0, 0.3, 0.3],
      ],
    ][shape] as [number, number, number, number, number][]
    return lumps.map(([x, y, z, w, h], i) => ({ g: lump(shape * 3 + i + 1), c: color, at: [x, -y, z] as [number, number, number], size: [w, h, w * 0.7] as [number, number, number] }))
  })
}

export function tableCoral(color: string) {
  return piece(`table:${color}`, 160, () => {
    const plate = jitter(new THREE.CylinderGeometry(76, 70, 10, 18, 1), 4, 9)
    return [
      { g: new THREE.CylinderGeometry(10, 16, 70, 10), c: color, at: [80 - 80, -35, 0] },
      { g: plate, c: color, at: [0, -78, 0] },
      ...[-40, -10, 22, 46, 0].map((x, i): Part => ({ g: bead, c: '#2a6b62', at: [x, -84, (i - 2) * 16], size: 3.4 })),
    ]
  })
}

export function brainCoral(color: string) {
  return piece(`brain:${color}`, 160, () => {
    const g = new THREE.SphereGeometry(78, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      // Wandering grooves.
      const r = 1 + 0.05 * Math.sin(v.x * 0.16 + Math.sin(v.z * 0.12) * 2) * Math.min(1, v.y / 20)
      p.setXYZ(i, v.x * r, v.y * r * 0.62, v.z * r * 0.8)
    }
    g.computeVertexNormals()
    return [{ g, c: color }]
  })
}

export function seaFan(color: string) {
  const root = piece(`fan:${color}`, 160, () => {
    const outline: [number, number][] = [[80, 130], ...curve(80, 130, 10, 120, 12, 60), ...curve(12, 60, 20, 6, 80, 4), ...curve(80, 4, 140, 6, 148, 60), ...curve(148, 60, 150, 120, 80, 130).slice(0, -1)]
    const fan = slab(outline.map(([x, y]) => [x - 80, y - 180]), 5, 1.5)
    const ribs: Part[] = [
      [40, 40],
      [80, 12],
      [120, 40],
      [24, 80],
      [136, 80],
    ].map(([x, y]) => rod('#2a1830', [0, -50, 3.5], [x - 80, y - 180, 3.5], 1.6, 4))
    return [{ g: fan, c: color }, ...ribs, rod(color, [0, 0, 0], [0, -52, 0], 5)]
  })
  root.userData.sway = 0.08
  return root
}

export function tubeCoral(color: string, rim: string) {
  return piece(`tube:${color}`, 132, () =>
    [
      [18, 62, 4],
      [42, 96, -6],
      [66, 78, 8],
      [90, 112, -4],
      [114, 58, 6],
    ].flatMap(([x, h, z]): Part[] => [
      { g: new THREE.CylinderGeometry(11, 12, h, 12), c: color, at: [x - 66, -h / 2, z] },
      { g: new THREE.CircleGeometry(7, 12).rotateX(-Math.PI / 2), c: rim, at: [x - 66, -h - 0.4, z] },
    ]),
  )
}

export function anemone(color: string, base: string) {
  const root = piece(`anemone:base:${base}`, 144, () => [{ g: ball, c: base, at: [0, -8, 0], size: [44, 18, 34] }])
  const arms = new THREE.Group()
  arms.scale.setScalar(1 / 144)
  const rand = seeded(color.length * 7)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.3
    const k = i % 3
    // Built leaning out along +x, then turned to face its own way.
    const tip: [number, number, number] = [26 + k * 8, -(64 + k * 12), 0]
    const arm = quiet(
      inked(
        cached(`anemone:arm:${color}:${k}`, () =>
          solid([hose(color, [0, 0, 0], [tip[0] * 0.2, tip[1] * 0.6, 0], tip, 4.2), { g: bead, c: color, at: tip, size: 4.4 }]),
        ),
        paint,
        1.6,
      ),
    )
    const r = 16 + rand() * 10
    arm.position.set(Math.cos(a) * r, 12, Math.sin(a) * r * 0.8)
    arm.rotation.y = -a
    arms.add(arm)
  }
  root.add(arms)
  root.userData.sway = 0.1
  root.userData.arms = arms
  return root
}

export function branchCoral(color: string) {
  return piece(`branch:${color}`, 120, () => {
    const segs: [number, number, number, number, number, number][] = [
      [60, 200, 0, 60, 120, 0],
      [60, 120, 0, 28, 78, 14],
      [28, 78, 14, 28, 36, 8],
      [60, 120, 0, 94, 72, -10],
      [94, 72, -10, 94, 26, -4],
      [60, 150, 0, 100, 122, 12],
      [28, 78, 14, 8, 58, 4],
      [94, 72, -10, 114, 56, -18],
    ]
    return segs.flatMap(([x0, y0, z0, x1, y1, z1]) => [rod(color, [x0 - 60, y0 - 200, z0], [x1 - 60, y1 - 200, z1], 7, 7)])
  })
}

export function starfish(color: string) {
  return piece(`star:${color}`, 100, () => {
    const pts: [number, number][] = Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 ? 17 : 44
      return [Math.cos(a) * r, Math.sin(a) * r - 44]
    })
    return [
      { g: slab(pts, 8, 4), c: color, rot: [-0.25, 0, 0] },
      ...[0, 1, 2, 3, 4].map((i): Part => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        return { g: bead, c: '#fff4dc', at: [Math.cos(a) * 24, Math.sin(a) * 24 - 44, 8], size: 3 }
      }),
    ]
  })
}

export function seaweed(color = '#3e8f55') {
  const root = piece(`weed:${color}`, 80, () => [
    { g: slab([[20, 240], ...curve(20, 240, 0, 200, 22, 160), ...curve(22, 160, 44, 120, 20, 80), ...curve(20, 80, 0, 40, 18, 0), ...curve(18, 0, 36, 40, 34, 80), ...curve(34, 80, 54, 120, 38, 160), ...curve(38, 160, 24, 200, 40, 240).slice(0, -1)].map(([x, y]) => [x - 40, y - 240]), 4, 1), c: color },
    { g: slab([[44, 240], ...curve(44, 240, 34, 200, 52, 170), ...curve(52, 170, 72, 140, 58, 100), ...curve(58, 100, 76, 130, 70, 170), ...curve(70, 170, 62, 200, 66, 240).slice(0, -1)].map(([x, y]) => [x - 40, y - 240]), 4, 1), c: color, at: [0, 0, -8] },
  ])
  root.userData.sway = 0.09
  return root
}

// --- jellyfish -----------------------------------------------------------------------

export type Jelly = { root: THREE.Group; bell: THREE.Object3D; arms: THREE.Group[]; color: string; flash: (on: boolean) => void }

// A bell with a scalloped rim, a soft highlight and trailing tentacles that
// ripple. Glowing ones (in the dark) shine with their own light. One unit
// wide, hanging from y = 0.
export function jellyfish(color: string, glows: boolean): Jelly {
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / 120)
  root.add(inner)
  const bellGeo = cached(`jelly:bell:${color}`, () => {
    const dome = new THREE.SphereGeometry(55, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2)
    const p = dome.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const z = p.getZ(i)
      const a = Math.atan2(z, x)
      if (p.getY(i) < 1) p.setY(i, -4 + Math.cos(a * 8) * 3)
    }
    dome.scale(1, 1.05, 1)
    dome.computeVertexNormals()
    const under = new THREE.CircleGeometry(55, 24).rotateX(Math.PI / 2)
    const q = under.attributes.position
    for (let i = 0; i < q.count; i++) {
      const a = Math.atan2(q.getZ(i), q.getX(i))
      q.setY(i, q.getX(i) === 0 && q.getZ(i) === 0 ? 6 : -4 + Math.cos(a * 8) * 3)
    }
    return solid([
      { g: dome, c: color },
      { g: under, c: new THREE.Color(color).multiplyScalar(0.8).getStyle() },
      { g: ball, c: '#ffffff', at: [-22, -36, 28], size: [14, 6, 4], rot: [0.5, 0.5, 0.6] },
    ])
  })
  const material = glows ? glowing : paint
  const bell = quiet(inked(bellGeo, material, 2.2))
  inner.add(bell)
  // Glowing ones shine in their own shape: a soft shell of light round the
  // bell, and a fainter one along each tentacle.
  const aura = glows ? auraMaterial(color, 0.42) : undefined
  const armAura = glows ? auraMaterial(color, 0.16) : undefined
  if (aura) {
    const shell = new THREE.Mesh(cached('jelly:aura', () => new THREE.SphereGeometry(78, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.15, 1)), aura)
    shell.position.y = -6
    inner.add(shell)
  }
  const arms: THREE.Group[] = []
  const armGeo = cached('jelly:arm', () => new THREE.CapsuleGeometry(2.6, 26, 2, 5).translate(0, -13, 0))
  const armMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
  if (glows) armMat.defines = { GLOW: '' }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    let parent: THREE.Object3D = inner
    const chain = new THREE.Group()
    chain.position.set(Math.cos(a) * 34, -2, Math.sin(a) * 30)
    inner.add(chain)
    parent = chain
    for (let k = 0; k < 4; k++) {
      const seg = new THREE.Group()
      if (k) seg.position.y = -26
      seg.add(new THREE.Mesh(armGeo, armMat))
      if (armAura) seg.add(new THREE.Mesh(cached('jelly:arm:aura', () => new THREE.CapsuleGeometry(8, 30, 3, 8).translate(0, -13, 0)), armAura))
      parent.add(seg)
      parent = seg
    }
    arms.push(chain)
  }
  let lit = false
  const base = new THREE.Color(color)
  const hot = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  hot.defines = { GLOW: '' }
  return {
    root,
    bell,
    arms,
    color,
    flash(on) {
      if (on === lit) return
      lit = on
      // Lit up white-hot while it stings.
      bell.material = on ? hot : material
      armMat.color.set(on ? '#ffffff' : base)
    },
  }
}

// Light glowing off a shape: brightest where the shape is thickest in view,
// fading to nothing at its edges, so it hugs the outline it's drawn on.
function auraMaterial(color: string, strength: number) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, strength: { value: strength } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalMatrix * normal;
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float strength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        gl_FragColor = vec4(color * pow(facing, 2.2) * strength, 1.0);
      }`,
  })
}

// --- the deep: shipwreck, sea floor, bottle, chest --------------------------------

export function shipwreck() {
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / 440)
  root.add(inner)
  const hull = '#35303a'
  const ship = quiet(
    inked(
      cached('wreck', () =>
        solid([
          { g: slab([[20, 170], [420, 170], [380, 250], [70, 250]].map(([x, y]) => [x - 220, y - 250]), 90, 8), c: hull },
          { g: new THREE.BoxGeometry(240, 40, 70), c: '#2b2730', at: [180 - 220, 150 - 250, 0] },
          rod(hull, [180 - 220, 130 - 250, 0], [190 - 220, 20 - 250, 0], 5),
          rod(hull, [190 - 220, 20 - 250, 0], [250 - 220, 60 - 250, 6], 4),
          rod(hull, [150 - 220, 130 - 250, 20], [150 - 220, 90 - 250, 20], 4),
          rod(hull, [150 - 220, 90 - 250, 20], [200 - 220, 90 - 250, 20], 4),
          { g: new THREE.ConeGeometry(22, 30, 4), c: hull, at: [350 - 220, 155 - 250, 0] },
          ...[120, 190, 260, 330].flatMap((x): Part[] =>
            [1, -1].map((side): Part => ({ g: new THREE.CylinderGeometry(12, 12, 4, 14).rotateX(Math.PI / 2), c: '#1b3a52', at: [x - 220, 205 - 250, side * 54] })),
          ),
          hose('#2f6b54', [40 - 220, 0, 30], [50 - 220, -40, 34], [36 - 220, -80, 30], 5),
          hose('#2f6b54', [400 - 220, 0, -30], [390 - 220, -50, -34], [406 - 220, -90, -30], 5),
          hose('#2f6b54', [300 - 220, 0, 46], [310 - 220, -30, 50], [296 - 220, -60, 46], 4),
        ]),
      ),
      paint,
      2.4,
    ),
  )
  inner.add(ship)
  return root
}

// The sea floor: low dunes with mounds and weed, a hundred units wide, its
// surface at y = 0 near the middle.
export function seaFloor() {
  const g = new THREE.PlaneGeometry(140, 80, 70, 40)
  g.rotateX(-Math.PI / 2)
  g.translate(0, 0, -20)
  const p = g.attributes.position
  const rand = seeded(31)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    p.setY(i, 0.25 * Math.sin(x * 0.35 + z * 0.2) + 0.18 * Math.sin(z * 0.5 - x * 0.1) + (rand() - 0.5) * 0.12)
  }
  const flat = g.toNonIndexed()
  flat.computeVertexNormals()
  const colors: number[] = []
  const sand = new THREE.Color('#3b4a5c')
  const dim = new THREE.Color('#2a3544')
  const q = flat.attributes.position
  for (let i = 0; i < q.count; i += 3) {
    const c = q.getY(i) + q.getY(i + 1) + q.getY(i + 2) > 0.3 ? sand : dim
    for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b)
  }
  flat.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const root = new THREE.Group()
  const floor = new THREE.Mesh(flat, paint)
  root.add(floor)
  const mound = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)
  for (const [x, z, r] of [
    [-9, -6, 1.6],
    [10, -9, 2],
    [3, -14, 1.2],
    [-16, -16, 2.4],
    [17, -4, 1.3],
  ]) {
    const m = quiet(inked(cached(`mound:${x}`, () => solid([{ g: jitter(mound.clone(), 0.15, x + 50), c: '#2a3444' }])), paint, 2))
    m.scale.set(r, r * 0.6, r)
    m.position.set(x, -0.1, z)
    root.add(m)
  }
  for (const [x, z] of [
    [-12, -3],
    [6.5, -5],
    [-3, -9],
    [13, -11],
  ]) {
    const weed = quiet(inked(cached(`floorweed`, () => solid([hose('#28594c', [0, 0, 0], [-6, -60, 0], [8, -110, 0], 4.5), hose('#28594c', [10, 0, 0], [20, -50, 0], [4, -90, 0], 4.5)])), paint, 1.6))
    weed.scale.setScalar(1 / 60)
    weed.position.set(x, 0, z)
    weed.userData.sway = 0.1
    root.add(weed)
  }
  return root
}

// The message in a bottle, lying on its side: glass, a cork, the rolled-up
// note inside. One unit long.
export function bottle() {
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / 150)
  root.add(inner)
  const glass = new THREE.LatheGeometry(
    [
      [0, -60],
      [21, -60],
      [24, -50],
      [24, 22],
      [20, 34],
      [9, 46],
      [7, 68],
      [0, 68],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    20,
  ).rotateZ(-Math.PI / 2)
  const glassMat = new THREE.MeshToonMaterial({ color: '#bfe3ef', gradientMap: paint.gradientMap, transparent: true, opacity: 0.5, depthWrite: false })
  const shell = quiet(inked(glass, glassMat, 2))
  inner.add(shell)
  const insides = quiet(
    inked(
      cached('bottle:insides', () =>
        solid([
          { g: new THREE.CylinderGeometry(9, 9, 22, 12).rotateZ(Math.PI / 2), c: '#a0703f', at: [72, 0, 0] },
          { g: new THREE.CylinderGeometry(12, 12, 70, 14).rotateZ(Math.PI / 2), c: '#f6ecd2', at: [-14, 4, 0] },
          { g: new THREE.TorusGeometry(12.4, 1, 4, 16).rotateY(Math.PI / 2), c: '#8a7a5c', at: [-30, 4, 0] },
          { g: new THREE.TorusGeometry(12.4, 1, 4, 16).rotateY(Math.PI / 2), c: '#8a7a5c', at: [2, 4, 0] },
        ]),
      ),
      paint,
      1.6,
    ),
  )
  inner.add(insides)
  root.userData.parts = { shell, insides }
  return root
}

export function chest() {
  const root = new THREE.Group()
  const inner = new THREE.Group()
  inner.scale.setScalar(1 / 160)
  root.add(inner)
  inner.add(
    quiet(
      inked(
        cached('chest', () =>
          solid([
            { g: new THREE.BoxGeometry(120, 56, 70), c: '#7a4a24', at: [0, -28, 0] },
            // The lid, hinged at the back and thrown open.
            { g: new THREE.CylinderGeometry(35, 35, 120, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).translate(0, 0, 35), c: '#8f5a2c', at: [0, -56, -35], rot: [-1.9, 0, 0] },
            { g: new THREE.BoxGeometry(20, 22, 6), c: '#e9b949', at: [0, -40, 36] },
            { g: new THREE.BoxGeometry(124, 8, 74), c: '#5b3519', at: [0, -10, 0] },
          ]),
        ),
        paint,
        2,
      ),
    ),
  )
  const gold = new THREE.Mesh(
    cached('chest:gold', () =>
      solid(
        Array.from({ length: 16 }, (_, i): Part => ({ g: bead, c: i % 3 ? '#ffd166' : '#ffe9a8', at: [-46 + (i % 8) * 13, -58 - (i % 3) * 4, -14 + Math.floor(i / 8) * 24], size: 8 })),
      ),
    ),
    glowing,
  )
  inner.add(gold)
  return root
}

// --- light and specks -------------------------------------------------------------------

// A shaft of sunlight reaching down from the surface: a soft, open cone,
// bright at the top and fading out as it goes. Hangs from y = 0, one unit long.
export function sunbeam() {
  const g = new THREE.CylinderGeometry(0.03, 0.12, 1, 16, 8, true).translate(0, -0.5, 0)
  const m = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0.2 }, color: { value: new THREE.Color('#fff3c8') } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying float vFade;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vFade = pow(1.0 + position.y, 1.6) * smoothstep(0.0, 0.25, -position.y);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalMatrix * normal;
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    // Brightest through its middle and fading to nothing at its edges and
    // its foot, so it reads as light rather than a solid cone.
    fragmentShader: /* glsl */ `
      uniform float opacity;
      uniform vec3 color;
      varying float vFade;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        gl_FragColor = vec4(color * vFade * pow(facing, 2.5) * opacity, 1.0);
      }`,
  })
  return new THREE.Mesh(g, m)
}

// Round soft-edged sprites, for bubbles (a ring) and marine snow (a dot).
export function speckTexture(ring: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const c = canvas.getContext('2d')!
  if (ring) {
    c.strokeStyle = 'rgba(255,255,255,0.85)'
    c.lineWidth = 6
    c.beginPath()
    c.arc(32, 32, 24, 0, Math.PI * 2)
    c.stroke()
    c.fillStyle = 'rgba(255,255,255,0.18)'
    c.fill()
    c.fillStyle = 'rgba(255,255,255,0.9)'
    c.beginPath()
    c.arc(23, 23, 5, 0, Math.PI * 2)
    c.fill()
  } else {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.6)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 64, 64)
  }
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// A soft round halo of light, for things that glow.
export function halo(color: string, size: number, opacity = 0.5) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: haloTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  s.material.defines = { GLOW: '' }
  s.scale.setScalar(size)
  return s
}
let haloMap: THREE.Texture | undefined
const haloTexture = () => (haloMap ??= speckTexture(false))

