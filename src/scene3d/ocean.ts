// The ocean under the island, in 3D. The page is a dive: as it scrolls, the
// camera sinks through the surface and down past each section's depth zone
// (src/lib/world.ts):
//   100-200  about       the rock under the island, the reef on its face, sunbeams
//   200-300  work        open blue: jellyfish, bubbles
//   300-400  experience  twilight: glowing jellyfish, the shipwreck (which sinks)
//   400-500  contact     abyss: the sea floor, a message in a bottle, treasure
// Everything that swims wanders its own zone as in the drawn version: drifting
// and turning, schooling, bolting from the cursor. Some swim in front of the
// page text (drawn on a second canvas) and some behind it.
//
// Clicks: a fish near the hook gets hooked (and let go on the next click), a
// diver says "oof", a jellyfish stings, the wreck sounds its horn, and the
// bottle breaks open to a note.
import * as THREE from 'three'
import { openBottle } from '../lib/bottle'
import { oof, shipHorn, thud } from '../lib/sound'
import { depthPx } from '../lib/world'
import { zap } from '../lib/zap'
import * as C from './creatures'
import type { Fx } from './fx'
import * as R from './reef'
import { inked, toon } from './toon'

// How the world lines up with the page this frame (set by world.ts).
export type View = {
  camera: THREE.PerspectiveCamera
  w: number
  h: number
  // Screen pixels per pixel of the 1600×900 design.
  s: number
  // The world height of page pixel `py`, for something `z` into the scene: it
  // lines up with that pixel when the page has scrolled it level with the
  // camera, and drifts by with depth otherwise.
  y(py: number, z: number): number
  // World units per screen pixel at `z`.
  unit(z: number): number
  night: number
  // The block of text being read, on screen (src/lib/focus.ts), if any.
  reading: { left: number; top: number; right: number; bottom: number } | null
}

export type Ocean = {
  update(t: number, dt: number, view: View): void
  click(x: number, y: number): boolean
  over(x: number, y: number): boolean
  dispose(): void
}

// Layer 1 is drawn on the canvas in front of the page text.
export const FRONT = 1

// --- who lives where ------------------------------------------------------------

// size: width in px on a wide screen. zone: depth band. speed: cruising px per
// frame. school: how many swim together (one leader plus followers). bank:
// rolls into turns. calm: isn't startled by the cursor. diver: says "oof".
type Kind = { make: () => C.Model; size: number; zone: [number, number]; speed: number; count?: number; school?: number; bank?: boolean; calm?: boolean; diver?: boolean }

const KINDS: Kind[] = [
  // shallow reef
  { make: C.turtle, size: 260, zone: [150, 185], speed: 0.5 },
  { make: () => C.fish('#ffd23f', '#1f1f1f'), size: 52, zone: [120, 190], speed: 1, school: 7 },
  { make: () => C.fish('#ff8c42', '#fff5e2'), size: 44, zone: [125, 192], speed: 1.1, school: 5 },
  { make: () => C.fish('#e9f3f5'), size: 24, zone: [112, 175], speed: 1.6, school: 9 },
  { make: C.clownfish, size: 50, zone: [128, 150], speed: 0.8, count: 3 },
  { make: () => C.tang(), size: 68, zone: [115, 190], speed: 0.9, count: 3 },
  { make: C.butterflyfish, size: 52, zone: [120, 185], speed: 0.7, count: 3 },
  { make: C.puffer, size: 58, zone: [135, 190], speed: 0.35, count: 2 },
  { make: C.angelfish, size: 56, zone: [125, 180], speed: 0.5, count: 2 },
  { make: () => C.diver('#23262e', '#e2553d', 'camera'), size: 190, zone: [130, 180], speed: 0.4, calm: true, diver: true },
  { make: () => C.fish('#c77dff'), size: 40, zone: [118, 190], speed: 0.9, count: 2 },
  { make: C.dolphin, size: 170, zone: [120, 175], speed: 1.6, school: 3 },
  // open blue
  { make: C.manta, size: 380, zone: [212, 240], speed: 0.7, bank: true },
  { make: () => C.fish('#7fd6e8'), size: 50, zone: [245, 285], speed: 1.1, school: 8 },
  { make: () => C.fish('#d6e4ea'), size: 22, zone: [205, 260], speed: 1.7, school: 11 },
  { make: C.barracuda, size: 150, zone: [215, 290], speed: 1.2, count: 3 },
  { make: C.swordfish, size: 240, zone: [230, 280], speed: 1.5 },
  { make: () => C.diver('#1f3b57', '#f2c230'), size: 180, zone: [225, 285], speed: 0.45, calm: true, diver: true },
  { make: () => C.tang('#3fb57a', '#1d6e47'), size: 62, zone: [205, 250], speed: 0.9, count: 2 },
  { make: () => C.fish('#f25f5c', '#ffe1a8'), size: 46, zone: [210, 290], speed: 1, count: 3 },
  { make: () => C.whale(), size: 560, zone: [222, 262], speed: 0.3, calm: true },
  { make: () => C.shark(), size: 230, zone: [218, 290], speed: 0.9, count: 2, calm: true },
  { make: C.dolphin, size: 160, zone: [205, 250], speed: 1.7, school: 4 },
  // twilight
  { make: () => C.lanternfish(), size: 36, zone: [305, 395], speed: 0.6, count: 6 },
  { make: () => C.lanternfish('#ffb8f2'), size: 30, zone: [310, 395], speed: 0.6, count: 4 },
  { make: C.hatchetfish, size: 40, zone: [305, 380], speed: 0.45, count: 4 },
  { make: () => C.eel(), size: 220, zone: [360, 390], speed: 0.35 },
  { make: () => C.diver('#2a2d36', '#5ad1e6', 'torch'), size: 180, zone: [325, 385], speed: 0.35, calm: true, diver: true },
  { make: C.puffer, size: 50, zone: [320, 380], speed: 0.3 },
  { make: () => C.whale('#2c3e57', '#7d93ab'), size: 620, zone: [318, 350], speed: 0.25, calm: true },
  { make: () => C.shark('#4d5d6b'), size: 250, zone: [330, 392], speed: 0.6, calm: true },
  // abyss
  { make: C.anglerfish, size: 300, zone: [412, 450], speed: 0.3 },
  { make: () => C.lanternfish('#d8ff9f'), size: 30, zone: [405, 455], speed: 0.5, count: 5 },
  { make: () => C.eel('#4b4560'), size: 200, zone: [430, 458], speed: 0.3 },
]

// The reef on the rock's face: [top % of the reef band, left % of the
// screen, width as min(vw, px), piece], as laid out in the drawn version.
const REEF: [number, number, number, number, () => THREE.Group][] = [
  [16, 31, 5, 64, () => R.rock(2, '#7d8a77')],
  [18, 21, 12, 150, () => R.tableCoral('#5cc6b5')],
  [16, 79, 7, 90, () => R.anemone('#ffa25c', '#c75a3a')],
  [24, 57, 7, 90, () => R.brainCoral('#8fcf6a')],
  [22, 67, 11, 140, () => R.seaFan('#9b6fd0')],
  [28, 38, 7, 88, () => R.tubeCoral('#f2694c', '#7a2618')],
  [30, 84, 10, 130, () => R.rock(1, '#6d7f86')],
  [34, 27, 9, 110, () => R.branchCoral('#f07c8c')],
  [38, 70, 4, 50, () => R.starfish('#ff8a5b')],
  [40, 75, 8, 100, () => R.branchCoral('#ffcf5c')],
  [42, 35, 12, 150, () => R.brainCoral('#f5a55a')],
  [48, 80, 6, 72, () => R.tubeCoral('#b48cf0', '#4b2f7a')],
  [48, 58, 9, 110, () => R.anemone('#ff8fc8', '#8c3d6b')],
  [50, 14, 6, 80, () => R.seaweed('#4aa060')],
  [52, 45, 16, 200, () => R.rock(0, '#5c6b78')],
  [56, 30, 4, 48, () => R.starfish('#ffd166')],
  [58, 18, 7, 80, () => R.branchCoral('#9fb8ff')],
  [60, 9, 7, 90, () => R.seaweed()],
  [62, 64, 7, 90, () => R.rock(2, '#6d7f86')],
  [64, 37, 8, 100, () => R.seaFan('#e0566b')],
  [66, 80, 9, 110, () => R.tableCoral('#e7c35a')],
  [70, 93, 7, 90, () => R.seaweed('#4aa060')],
]

// Sunbeams either side of the island: [x in design px from the middle,
// lean in degrees (positive leans out to the left), width in design px].
const BEAMS = [
  [-600, 24, 110],
  [-780, 30, 80],
  [-950, 36, 120],
  [600, -24, 120],
  [770, -30, 90],
  [940, -35, 110],
]

const JELLIES = [
  { depth: 250, left: 0.86, vw: 8, px: 100, color: '#ffb3c7', glows: false, z: 5, delay: 0 },
  { depth: 284, left: 0.12, vw: 6, px: 80, color: '#c9b3ff', glows: false, z: 3, delay: 2 },
  { depth: 318, left: 0.86, vw: 9, px: 110, color: '#ff7ad9', glows: true, z: 3, delay: 0 },
  { depth: 366, left: 0.8, vw: 6, px: 80, color: '#7af0ff', glows: true, z: 5, delay: 3 },
  { depth: 330, left: 0.08, vw: 5, px: 64, color: '#a98bff', glows: true, z: 4, delay: 1 },
]

// The cursor is a fishing hook: anything narrower than CATCHABLE (px) near it
// can be hooked, hanging by its mouth from the bend of the hook (BEND, from
// the hotspot) until the next click lets it go.
const CATCHABLE = 70
const BEND = { x: 6.5, y: 20 }
const SLOP = 24

type Body = {
  model: C.Model
  kind: Kind
  front: boolean
  leader?: Body
  ox: number
  oy: number
  // Position (x, depth-down d, lane z) and velocity in world units per frame.
  x: number
  d: number
  z: number
  lane: number
  vx: number
  vd: number
  heading: number
  turn: number
  cruise: number
  panic: number
  face: number
  nerve: number
  phase: number
  // How far it's rolled into a turn (rays bank).
  roll: number
  len: number
  // Projected on screen this frame, and half its length in screen px.
  sx: number
  sy: number
  half: number
  // Where its depth zone is, for noticing when the page's layout moves it.
  top: number
  bottom: number
  // Slipped behind the text, having strayed over what's being read.
  tucked: boolean
}

const coin = () => Math.random() < 0.5

export function createOcean(scene: THREE.Scene, fx: Fx, still: boolean): Ocean {
  const group = new THREE.Group()
  scene.add(group)

  // --- the rock and the reef --------------------------------------------------------
  group.add(R.seamount())
  const reef = REEF.map(([top, left, vw, px, make], i) => {
    const piece = make()
    piece.rotation.y = (((i * 37) % 11) / 11 - 0.5) * 0.8
    group.add(piece)
    return { piece, top, left, vw, px, base: { x: 0, z: 0 } }
  })

  const beams = BEAMS.map(([x, lean, width], i) => {
    const beam = R.sunbeam()
    beam.position.z = 11 + (i % 3)
    beam.rotation.z = (-lean * Math.PI) / 180
    beam.material = beam.material.clone()
    beam.userData = { x, width }
    group.add(beam)
    return beam
  })

  // --- jellyfish ------------------------------------------------------------------------
  const jellies = JELLIES.map((spec) => {
    const jelly = R.jellyfish(spec.color, spec.glows)
    if (spec.glows) {
      const h = R.halo(spec.color, 1.4, 0.55)
      h.position.y = 0.2
      jelly.root.add(h)
    }
    group.add(jelly.root)
    return { ...spec, jelly, width: 1 }
  })

  // --- the shipwreck, the floor, the bottle and the chest ----------------------------
  const floor = R.seaFloor()
  group.add(floor)
  const wreck = R.shipwreck()
  group.add(wreck)
  const sinking = { state: still ? 'landed' : 'adrift', start: 0, honk: -10, width: 1 }

  const bottle = R.bottle()
  const bottleHalo = R.halo('#bfe9ff', 2.2, 0.45)
  bottle.add(bottleHalo)
  group.add(bottle)
  const chest = R.chest()
  const chestHalo = R.halo('#ffd166', 2.4, 0.5)
  chestHalo.position.y = 0.4
  chest.add(chestHalo)
  group.add(chest)

  // --- bubbles and marine snow ----------------------------------------------------------
  const ring = R.speckTexture(true)
  const bubbles = Array.from({ length: 18 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ring, transparent: true, depthWrite: false }))
    group.add(s)
    return {
      s,
      left: ([12, 16, 84, 88, 50][i % 5] + (Math.random() - 0.5) * 4) / 100,
      depth: 130 + Math.random() * 180,
      size: 6 + Math.random() * 12,
      delay: Math.random() * 8,
      z: 6 + Math.random() * 5,
    }
  })
  const SNOW = 160
  const snowSeeds = Array.from({ length: SNOW }, () => ({ left: Math.random(), depth: 220 + Math.random() * 270, z: -10 + Math.random() * 22, delay: Math.random() * 12 }))
  const snowGeo = new THREE.BufferGeometry()
  snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SNOW * 3), 3))
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({ map: R.speckTexture(false), color: '#e8f2f4', size: 0.09, transparent: true, opacity: 0.7, depthWrite: false }),
  )
  snow.frustumCulled = false
  group.add(snow)

  // --- swimmers -----------------------------------------------------------------------
  const bodies: Body[] = []
  for (const kind of KINDS) {
    const make = (front: boolean, leader?: Body): Body => {
      const model = kind.make()
      model.root.rotation.order = 'YZX'
      if (front) model.root.traverse((o) => o.layers.set(FRONT))
      group.add(model.root)
      const heading = (coin() ? 0 : Math.PI) + (Math.random() - 0.5) * 0.4
      return {
        model,
        kind,
        front,
        leader,
        ox: leader ? 0.4 + Math.random() * 1.6 : 0,
        oy: leader ? (Math.random() - 0.5) * 2.4 : 0,
        x: NaN,
        d: 0,
        z: 0,
        lane: 0,
        vx: 0,
        vd: 0,
        heading,
        turn: 0,
        cruise: 0.6 + Math.random() * 0.4,
        panic: 0,
        face: Math.cos(heading) > 0 ? 1 : -1,
        nerve: 0.7 + Math.random() * 0.6,
        phase: Math.random() * 10,
        roll: 0,
        len: 1,
        sx: 0,
        sy: 0,
        half: 0,
        top: 0,
        bottom: 0,
        tucked: false,
      }
    }
    if (kind.school) {
      const front = coin()
      const leader = make(front)
      bodies.push(leader)
      for (let i = 1; i < kind.school; i++) bodies.push(make(front, leader))
    } else for (let i = 0; i < (kind.count ?? 1); i++) bodies.push(make(coin()))
  }

  // --- the cursor -------------------------------------------------------------------------
  let pointer: { x: number; y: number } | null = null
  // Where the hook is; unlike pointer, kept when the cursor leaves the page.
  let hook = { x: 0, y: 0 }
  const track = (e: PointerEvent) => (pointer = hook = { x: e.clientX, y: e.clientY })
  const untrack = () => (pointer = null)
  window.addEventListener('pointermove', track)
  document.documentElement.addEventListener('pointerleave', untrack)
  let caught: Body | null = null

  // --- this frame's view ------------------------------------------------------------------
  let view: View | undefined
  const v = new THREE.Vector3()
  const toScreen = (p: THREE.Vector3) => {
    v.copy(p).project(view!.camera)
    return { x: ((v.x + 1) / 2) * view!.w, y: ((1 - v.y) / 2) * view!.h }
  }
  // Where a screen point lands at depth z (on the plane facing the camera).
  const ray = new THREE.Raycaster()
  const fromScreen = (x: number, y: number, z: number) => {
    ray.setFromCamera(new THREE.Vector2((x / view!.w) * 2 - 1, -(y / view!.h) * 2 + 1), view!.camera)
    const k = (z - ray.ray.origin.z) / ray.ray.direction.z
    return ray.ray.origin.clone().addScaledVector(ray.ray.direction, k)
  }
  const across = (left: number, z: number) => (left - 0.5) * view!.w * view!.unit(z)
  const cssWidth = (vw: number, px: number) => Math.min((vw * view!.w) / 100, px)
  const at = (depth: number, z: number) => view!.y(depthPx(depth), z)

  // --- laying things out for the screen -----------------------------------------------------
  let laidOut = ''
  let floorY = 0
  function layout() {
    const vw = view!
    const key = `${vw.w}x${vw.h}:${Math.round(depthPx(500))}`
    if (key === laidOut) return
    const first = !laidOut
    laidOut = key
    // The reef: each piece on the rock's face, across the screen as drawn.
    for (const r of reef) {
      const py = depthPx(100) + (r.top / 100 + 0.06) * 460 * vw.s
      let z = 7.5
      const x = across(r.left / 100, z)
      for (let k = 0; k < 2; k++) z = R.rockFace(x, vw.y(py, z)) - 0.15
      const width = cssWidth(r.vw, r.px) * vw.unit(z)
      r.piece.position.set(x, vw.y(py, z), z)
      r.piece.scale.setScalar(width)
      r.piece.rotation.x = 0.12
    }
    // The sea floor and what's on it.
    floorY = at(473, 0)
    floor.position.y = floorY
    const bw = cssWidth(12, 150) * vw.unit(1.5)
    bottle.position.set(across(0.24, 1.5), floorY + bw * 0.14, 1.5)
    bottle.scale.setScalar(bw)
    bottle.rotation.set(0, 0.35, 0.06)
    const cw = cssWidth(12, 150) * vw.unit(-0.5)
    chest.position.set(across(0.78, -0.5), floorY - 0.05, -0.5)
    chest.scale.setScalar(cw)
    chest.rotation.y = -0.35
    // The wreck keeps where it got to, by the page.
    sinking.width = cssWidth(34, 420) * vw.unit(-2)
    wreck.scale.setScalar(sinking.width)
    wreck.position.x = across(0.16, -2)
    wreck.position.z = -2
    for (const j of jellies) j.width = cssWidth(j.vw, j.px) * vw.unit(j.z)
    // Sunbeams either side of the reef, as far out on the screen as drawn.
    for (const beam of beams) {
      const u = vw.unit(beam.position.z) * vw.s
      beam.position.x = beam.userData.x * u
      beam.scale.x = beam.scale.z = (beam.userData.width * u) / 0.24
    }
    // Swimmers: sized for the screen, kept at the same place in their zone.
    const scale = Math.max(0.5, Math.min(1, vw.w / 1400))
    for (const b of bodies) {
      const reefy = b.kind.zone[0] < 200
      if (first) {
        const [lo, hi] = reefy ? (b.front ? [12.5, 15] : [9.5, 12.5]) : b.front ? [8, 13] : [-6, 7]
        b.lane = b.leader?.lane ?? lo + Math.random() * (hi - lo)
        if (b.leader) b.lane += (Math.random() - 0.5) * 0.6
        b.z = b.lane
      }
      b.len = Math.max(b.kind.size * 0.45, Math.min((b.kind.size / 12) * (vw.w / 100), b.kind.size)) * vw.unit(b.lane)
      b.model.root.scale.setScalar(b.len)
      const top = -at(b.kind.zone[0], b.lane)
      const bottom = -at(b.kind.zone[1], b.lane)
      if (first || Number.isNaN(b.x)) {
        b.x = (Math.random() - 0.5) * vw.w * vw.unit(b.lane)
        b.d = top + Math.random() * (bottom - top)
        b.vx = Math.cos(b.heading) * b.kind.speed * scale * vw.unit(b.lane)
      } else {
        // Same place in the zone as before.
        b.d = top + ((b.d - b.top) / (b.bottom - b.top || 1)) * (bottom - top)
      }
      b.top = top
      b.bottom = bottom
    }
    for (const b of bodies) {
      if (!first || !b.leader) continue
      b.x = b.leader.x - b.leader.face * b.ox * b.leader.len
      b.d = b.leader.d + b.oy * b.leader.len
      b.heading = b.leader.heading
      b.face = b.leader.face
    }
  }

  // --- the frame -----------------------------------------------------------------------------
  let t = 0
  let breathAt = 0
  function update(time: number, dt: number, next: View) {
    view = next
    t = time
    layout()
    const vw = view
    const f = Math.min(3, dt * 60)
    const cam = vw.camera.position
    // Nothing down here shows from above the water.
    group.visible = cam.y < 1.5
    const at2 = still ? 0 : t

    // Reef and weed sway; the anemones' arms wave.
    for (const [i, r] of reef.entries()) {
      const sway = r.piece.userData.sway as number | undefined
      if (sway) r.piece.rotation.z = Math.sin(at2 * 0.63 + i) * sway
      const arms = r.piece.userData.arms as THREE.Group | undefined
      if (arms) arms.children.forEach((a, k) => (a.rotation.z = Math.sin(at2 * 1.3 + k) * 0.18))
    }
    for (const weed of floor.children) if (weed.userData.sway) weed.rotation.z = Math.sin(at2 * 0.7 + weed.position.x) * weed.userData.sway

    // Sunbeams brighten and fade; at night they're faint moonbeams.
    beams.forEach((beam, i) => {
      beam.scale.y = -at(220, beam.position.z)
      beam.material.uniforms.opacity.value = (0.09 + 0.05 * Math.sin(at2 * 0.45 + i * 1.7)) * (1 - vw.night * 0.75)
    })

    // Jellyfish bob and pulse, trailing their tentacles.
    for (const j of jellies) {
      const bob = -10 + 22 * (0.5 - 0.5 * Math.cos((Math.PI * (at2 + j.delay)) / 4.5))
      j.jelly.root.scale.setScalar(j.width)
      j.jelly.root.position.set(across(j.left, j.z), vw.y(depthPx(j.depth) + bob * vw.s, j.z) - j.width * 0.5, j.z)
      const pulse = Math.sin(at2 * 2.2 + j.delay)
      j.jelly.bell.scale.set(1 - pulse * 0.04, 1 + pulse * 0.07, 1 - pulse * 0.04)
      j.jelly.arms.forEach((chain, i) => {
        let seg: THREE.Object3D | undefined = chain
        let k = 0
        while (seg) {
          seg.rotation.x = Math.sin(at2 * 1.6 + k * 0.9 + i) * 0.22
          seg.rotation.z = Math.cos(at2 * 1.3 + k * 0.8 + i * 2) * 0.2
          seg = seg.children.find((c) => c.type === 'Group')
          k++
        }
      })
    }

    // The wreck drifts in the twilight until first seen, then sinks to the floor.
    {
      const w = sinking.width
      const startY = at(352, -2) - w * 0.6
      const landY = floorY - w * 0.04
      let y = startY
      let roll = -0.21
      if (sinking.state === 'adrift') {
        const p = toScreen(wreck.position.clone().setY(startY + w * 0.28))
        if (p.y > vw.h * 0.15 && p.y < vw.h * 0.85 && cam.y < 0) [sinking.state, sinking.start] = ['sinking', t]
      }
      if (sinking.state === 'sinking') {
        const u = Math.min(1, (t - sinking.start) / 25)
        // Slow to start, gathering speed, easing a little before the bottom.
        const e = u * u * (2.2 - 1.2 * u)
        y = startY + (landY - startY) * e
        roll = -0.21 + Math.sin(((t - sinking.start) * Math.PI * 2) / 10) * 0.05
        if (Math.random() < 0.25 * f) fx.rise(wreck.localToWorld(new THREE.Vector3((Math.random() - 0.3) * 0.7, 0.4, 0)), w * 0.03)
        if (u >= 1) {
          sinking.state = 'landed'
          if (navigator.userActivation?.hasBeenActive ?? true) thud()
          fx.silt(new THREE.Vector3(wreck.position.x, landY + w * 0.05, wreck.position.z + 0.5), w)
        }
      }
      if (sinking.state === 'landed') {
        y = landY
        roll = 0.07
      }
      // Rocking when its horn sounds.
      const honk = t - sinking.honk
      if (honk < 2.6 && !still) roll += Math.sin((honk / 2.6) * Math.PI * 4) * 0.045 * (1 - honk / 2.6)
      wreck.position.y = y
      wreck.rotation.set(0.12, 0.25, roll)
    }

    // Bubble columns rising through the shallows.
    for (const b of bubbles) {
      const k = still ? 0.5 : ((at2 + b.delay) / 8) % 1
      const px = b.size * vw.s
      b.s.position.set(across(b.left, b.z) + Math.sin(k * 6) * px * vw.unit(b.z) * 0.5, vw.y(depthPx(b.depth) - k * vw.h * 0.6, b.z), b.z)
      b.s.scale.setScalar(px * vw.unit(b.z))
      ;(b.s.material as THREE.SpriteMaterial).opacity = Math.min(1, k * 10, (1 - k) * 10) * 0.9
    }
    // Marine snow drifting down in the deep.
    {
      const p = snowGeo.attributes.position
      snowSeeds.forEach((s, i) => {
        const k = still ? 0.5 : ((at2 + s.delay) / 12) % 1
        p.setXYZ(i, across(s.left, s.z) + k * 10 * vw.unit(s.z), vw.y(depthPx(s.depth) + (k * 60 - 20) * vw.s, s.z), s.z)
      })
      p.needsUpdate = true
      ;(snow.material as THREE.PointsMaterial).size = 3.2 * vw.unit(0)
    }

    swim(f)

    // Divers breathe out every so often.
    if (!still && t - breathAt > 0.7) {
      breathAt = t
      for (const b of bodies)
        if (b.kind.diver && b.model.regulator && Math.abs(b.sy - vw.h / 2) < vw.h) {
          fx.rise(b.model.regulator.getWorldPosition(new THREE.Vector3()), b.len * 0.05)
        }
    }
    // The diver's camera light blinks.
    for (const b of bodies) if (b.kind.diver) for (const l of b.model.lights ?? []) l.visible = at2 % 1.4 < 0.7
  }

  // --- swimming ----------------------------------------------------------------------------
  function swim(f: number) {
    const vw = view!
    const scale = Math.max(0.5, Math.min(1, vw.w / 1400))
    const p = new THREE.Vector3()
    const R = vw.reading
    for (const b of bodies) {
      const u = vw.unit(b.lane)
      const ceiling = -at(100, b.lane)
      if (b === caught && -b.d + b.len / 2 > -ceiling) {
        // Pulled up to the top: it wriggles off the hook and dives.
        caught = null
        b.heading = Math.PI / 2 + (Math.random() - 0.5) * 1.2
        b.vx = Math.cos(b.heading) * 2 * u
        b.vd = 3 * u
        b.face = Math.cos(b.heading) > 0 ? 1 : -1
        b.panic = 120
      }
      if (b === caught) {
        // Hung by the mouth from the bend of the hook, nose up, swinging and
        // thrashing about it.
        const swing = Math.sin(t * 9) * 0.35 + Math.sin(t * 21) * 0.12
        const mouth = fromScreen(hook.x + BEND.x, hook.y + BEND.y, b.z)
        const a = Math.PI / 2 + swing
        b.x = mouth.x - Math.cos(a) * b.len * 0.44
        b.d = -(mouth.y - Math.sin(a) * b.len * 0.44)
        b.vx = b.vd = 0
        b.face = 1
        b.model.root.position.set(b.x, -b.d, b.z)
        b.model.root.rotation.set(0, 0, a)
        b.model.swim(t, 2.5)
        project(b, p)
        continue
      }
      const { kind } = b
      const top = b.top
      const bottom = b.bottom
      let max = kind.speed * scale * u * (b.panic > 0 ? 3.2 : 1)
      let ax = 0
      let ad = 0
      const L = b.leader
      if (!still) {
        if (L && L !== caught && b.panic <= 0 && L.panic <= 0) {
          // Keep station behind the leader, matching its speed.
          const tx = L.x - Math.sign(L.face) * b.ox * L.len
          const td = L.d + b.oy * L.len
          ax += (tx - b.x) * 0.002 + (L.vx - b.vx) * 0.05
          ad += (td - b.d) * 0.002 + (L.vd - b.vd) * 0.05
          b.heading = Math.atan2(b.vd, b.vx)
          max *= 1.8
        } else {
          // Wander: the heading drifts by a random, smoothly varying turn.
          b.turn += (Math.random() - 0.5) * 0.006 * f
          b.turn *= 0.96 ** f
          b.heading += b.turn * f
          if (Math.random() < 0.004 * f) b.cruise = 0.25 + Math.random() * 0.85
          // Turn back at the edges of the zone and just past the screen sides.
          const margin = b.len
          const edge = (vw.w / 2) * u
          if ((b.d < top && Math.sin(b.heading) < 0) || (b.d > bottom && Math.sin(b.heading) > 0)) b.heading = -b.heading
          if ((b.x < -edge - margin && Math.cos(b.heading) < 0) || (b.x > edge + margin && Math.cos(b.heading) > 0)) b.heading = Math.PI - b.heading
          const speed = (b.panic > 0 ? 1 : b.cruise) * max
          ax += (Math.cos(b.heading) * speed - b.vx) * 0.03
          ad += (Math.sin(b.heading) * speed * (b.panic > 0 ? 1 : 0.45) - b.vd) * 0.03
        }
        if (b.d < top - 40 * u) ad += 0.02 * u
        if (b.d > bottom + 40 * u) ad -= 0.02 * u

        // In front of the text, the block being read is like a rock: seeing
        // it ahead, it swims over or under, whichever is nearer.
        if (R && b.front) {
          const pad = b.half * 0.5 + 30
          const inside = (x: number, y: number) => x > R.left - pad && x < R.right + pad && y > R.top - pad && y < R.bottom + pad
          if (inside(b.sx, b.sy) || inside(b.sx + (b.vx / u) * 50, b.sy + (b.vd / u) * 50)) {
            const dir = b.sy - (R.top - pad) < R.bottom + pad - b.sy ? -1 : 1
            const strength = kind.calm ? 0.5 : 1
            ad += dir * 0.05 * u * strength
            const course = Math.atan2(dir * 0.8, Math.cos(b.heading) >= 0 ? 1 : -1)
            b.heading += Math.atan2(Math.sin(course - b.heading), Math.cos(course - b.heading)) * 0.06 * f * strength
          }
        }

        if (pointer) {
          const dx = b.sx - pointer.x
          const dy = b.sy - pointer.y
          if (!kind.calm) {
            // Startled by the cursor: bolt directly away, and keep going.
            const dist = Math.hypot(dx, dy) || 1
            const reach = (b.half + 80) * b.nerve
            if (dist < reach) {
              const push = 0.8 * (1 - dist / reach) * u
              ax += (dx / dist) * push
              ad += (dy / dist) * push
              if (b.panic <= 0) b.heading = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6
              b.panic = 50 + Math.random() * 40
            }
          } else {
            // The calm ones ease out of the cursor's way, so they don't park
            // over what's being read.
            const near = 1 - Math.hypot(dx / (b.half + 100), dy / (b.half / 2 + 100))
            if (near > 0) {
              const dist = Math.hypot(dx, dy) || 1
              ax += (dx / dist) * 0.12 * near * u
              ad += (dy / dist) * 0.12 * near * u
              const away = Math.atan2(dy * 0.5, dx)
              b.heading += Math.atan2(Math.sin(away - b.heading), Math.cos(away - b.heading)) * 0.03 * f
              max *= 1 + near * 1.5
            }
          }
        }
        b.panic -= f

        b.vx += ax * f
        b.vd += ad * f
        const s = Math.hypot(b.vx, b.vd)
        if (s > max) {
          const k = (max / s) ** Math.min(1, 0.15 * f)
          b.vx *= k
          b.vd *= k
        }
        b.x += b.vx * f
        b.d += b.vd * f
        // Bump into the ceiling and turn back down.
        if (b.d - b.len / 2 < ceiling) {
          b.d = ceiling + b.len / 2
          b.vd = Math.max(0, b.vd)
          if (Math.sin(b.heading) < 0) b.heading = -b.heading
        }
        // Turn round to face the way it's swimming.
        const want = b.vx > 0.12 * u ? 1 : b.vx < -0.12 * u ? -1 : Math.sign(b.face) || 1
        b.face += (want - b.face) * Math.min(1, 0.08 * f)
        b.z = b.lane + Math.sin(t * 0.3 + b.phase) * 0.4
      }

      const root = b.model.root
      root.position.set(b.x, -b.d, b.z)
      // Turning round, it swings its head towards us; it noses up and down
      // with its course; rays roll into their turns.
      const yaw = -Math.acos(Math.max(-1, Math.min(1, b.face)))
      const pitch = Math.max(-0.3, Math.min(0.3, Math.atan2(-b.vd, Math.abs(b.vx) + 1e-6)))
      // The wander's turn is jittery from frame to frame, so the roll eases
      // slowly after it.
      if (kind.bank && !still) b.roll += (Math.max(-0.35, Math.min(0.35, b.turn * 25)) - b.roll) * Math.min(1, 0.02 * f)
      root.rotation.set(b.roll, yaw, pitch)
      project(b, p)
      // One that ends up over the text anyway slips behind it until it's past.
      const tuck = !!R && b.front && b.sx > R.left && b.sx < R.right && b.sy > R.top && b.sy < R.bottom
      if (tuck !== b.tucked) {
        b.tucked = tuck
        root.traverse((o) => o.layers.set(tuck ? 0 : FRONT))
      }
      if (Math.abs(b.sy - vw.h / 2) < vw.h * 1.2) b.model.swim(still ? 0 : t + b.phase, b.panic > 0 ? 2.5 : b.cruise)
    }
  }

  function project(b: Body, p: THREE.Vector3) {
    const s = toScreen(p.set(b.x, -b.d, b.z))
    b.sx = s.x
    b.sy = s.y
    b.half = b.len / 2 / view!.unit(b.z)
  }

  // --- clicks ------------------------------------------------------------------------------
  const nearest = (x: number, y: number) => {
    let best: Body | null = null
    let bestDist = Infinity
    for (const b of bodies) {
      if (b.kind.size > CATCHABLE) continue
      const dist = Math.hypot(b.sx - x, b.sy - y)
      if (dist < b.half + SLOP && dist < bestDist) [best, bestDist] = [b, dist]
    }
    return best
  }
  // A diver is about twice as long as tall, so hit-test an ellipse.
  const diverAt = (x: number, y: number) => bodies.find((b) => b.kind.diver && ((b.sx - x) / b.half) ** 2 + ((b.sy - y) / (b.half / 2)) ** 2 < 1)

  // A thing's box on screen, from its world box, padded.
  const box = new THREE.Box3()
  const inBox = (obj: THREE.Object3D, x: number, y: number, pad: number) => {
    if (!view || !group.visible) return false
    box.setFromObject(obj)
    let [l, r, tp, bt] = [Infinity, -Infinity, Infinity, -Infinity]
    for (const cx of [box.min.x, box.max.x])
      for (const cy of [box.min.y, box.max.y])
        for (const cz of [box.min.z, box.max.z]) {
          const s = toScreen(new THREE.Vector3(cx, cy, cz))
          ;[l, r, tp, bt] = [Math.min(l, s.x), Math.max(r, s.x), Math.min(tp, s.y), Math.max(bt, s.y)]
        }
    return x > l - pad && x < r + pad && y > tp - pad && y < bt + pad
  }
  const overJelly = (x: number, y: number) => jellies.find((j) => inBox(j.jelly.root, x, y, 4))
  const overBottle = (x: number, y: number) => bottle.visible && inBox(bottle, x, y, 6)
  const overWreck = (x: number, y: number) => {
    if (!view || !group.visible) return false
    ray.setFromCamera(new THREE.Vector2((x / view.w) * 2 - 1, -(y / view.h) * 2 + 1), view.camera)
    return ray.intersectObject(wreck, true).some((h) => !h.object.userData.outline)
  }

  function click(x: number, y: number) {
    if (!view || !group.visible) return false
    // A fish on the hook: any click lets it go, darting off downwards.
    if (caught) {
      const u = view.unit(caught.lane)
      caught.heading = Math.PI / 2 + (Math.random() - 0.5) * 1.4
      caught.vx = Math.cos(caught.heading) * 2 * u
      caught.vd = 3 * u
      caught.face = Math.cos(caught.heading) > 0 ? 1 : -1
      caught.panic = 90
      caught = null
      return true
    }
    const diver = diverAt(x, y)
    if (diver) {
      oof()
      diver.vd -= 2.5 * view.unit(diver.lane)
      return true
    }
    const fish = still ? null : nearest(x, y)
    if (fish) {
      caught = fish
      hook = { x, y }
      return true
    }
    if (overBottle(x, y)) {
      breakBottle()
      return true
    }
    const jelly = overJelly(x, y)
    if (jelly) {
      // The bolts stay on the touched spot as the jellyfish drifts.
      const local = jelly.jelly.root.worldToLocal(fromScreen(x, y, jelly.z))
      zap(x, y, jelly.color, {
        at: () => {
          const s = toScreen(jelly.jelly.root.localToWorld(local.clone()))
          return [s.x, s.y]
        },
        lit: (on) => jelly.jelly.flash(on),
      })
      return true
    }
    if (overWreck(x, y)) {
      shipHorn()
      sinking.honk = t
      for (let i = 0; i < 6; i++) fx.rise(wreck.localToWorld(new THREE.Vector3(0.1 + Math.random() * 0.4, 0.5, 0)), sinking.width * 0.03)
      return true
    }
    return false
  }

  // The bottle shatters: glass flies, the cork pops off and the note floats up.
  function breakBottle() {
    openBottle(
      (quick) => {
        bottle.visible = false
        if (quick) return
        const w = bottle.scale.x
        fx.shards(bottle.position, w)
        const cork = inked(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 10), toon('#a0703f'), 1.6)
        cork.scale.setScalar(w)
        cork.position.copy(bottle.localToWorld(new THREE.Vector3(0.48, 0, 0)))
        const cv = new THREE.Vector3(w * 0.012, w * 0.035, 0)
        fx.add(cork, (m, age) => {
          cv.y -= w * 0.0008
          m.position.add(cv)
          m.rotation.z += 0.25
          return age < 60
        })
        const note = inked(new THREE.CylinderGeometry(0.08, 0.08, 0.47, 12).rotateZ(Math.PI / 2), toon('#f6ecd2'), 1.6)
        note.position.copy(bottle.position)
        fx.add(note, (m, age) => {
          m.position.y += w * 0.01
          m.scale.setScalar(w * (1 + age * 0.012))
          m.rotation.z = -age * 0.004
          return age < 48
        })
      },
      () => {
        // A fresh bottle washes back in.
        bottle.visible = true
        const w = bottle.scale.x
        fx.add(new THREE.Object3D(), (_, age) => {
          bottle.scale.setScalar(w * Math.min(1, (age + 1) / 70))
          return age < 70
        })
      },
    )
  }

  function over(x: number, y: number) {
    if (!view || !group.visible) return false
    return (!caught && !still && !!nearest(x, y)) || !!diverAt(x, y) || !!overJelly(x, y) || overWreck(x, y) || overBottle(x, y)
  }

  return {
    update,
    click,
    over,
    dispose() {
      window.removeEventListener('pointermove', track)
      document.documentElement.removeEventListener('pointerleave', untrack)
    },
  }
}
