// The SeaLens page's scene: Shreyas diving over a reef, filming the fish
// that swim past. Whatever swims into his camera's view gets what SeaLens
// would draw round it: a box, what it is, how sure, and a track number.
// The boxes are drawn on a 2D canvas over the 3D one.
//
// On wide screens he hovers on the left with the page's text on the right;
// on narrow ones he's at the top and the text scrolls up over the scene.
import * as THREE from 'three'
import * as C from './creatures'
import { DiverMe } from './diverMe'
import { Fx } from './fx'
import * as R from './reef'
import { outlineUniforms, seeded, toon } from './toon'
import { setWater } from './water'

const SEABED = -13.2
const CAMERA = new THREE.Vector3(0, -8.4, 14)
const LOOK = new THREE.Vector3(0, -9.3, 0)
// The water's colour stops, from the surface down (water.ts): a sunny,
// shallow reef.
const WATER = [0, -14, -30, -60, -90, -120]
// What the camera can see: how far, and how far off the line of the lens.
const RANGE = 12
const CONE = 0.6
const BOX = '#f2c230'

// Who swims past. len: length in world units. school: how many swim
// together. speed: units a second. label: what SeaLens calls it. subject:
// loops round in front of his camera, so there's always something in shot.
type Kind = { make: () => C.Model; len: number; label: string; count?: number; school?: number; speed: number; deep?: boolean; subject?: boolean }
const KINDS: Kind[] = [
  { make: C.clownfish, len: 0.5, label: 'clownfish', school: 2, speed: 0.55, subject: true },
  { make: C.butterflyfish, len: 0.55, label: 'butterflyfish', speed: 0.45, subject: true },
  { make: C.angelfish, len: 0.6, label: 'angelfish', speed: 0.4, subject: true },
  { make: C.clownfish, len: 0.55, label: 'clownfish', speed: 0.7 },
  { make: () => C.tang(), len: 0.75, label: 'blue tang', count: 2, speed: 0.9 },
  { make: C.butterflyfish, len: 0.6, label: 'butterflyfish', count: 2, speed: 0.6 },
  { make: C.angelfish, len: 0.65, label: 'angelfish', speed: 0.5 },
  { make: C.puffer, len: 0.6, label: 'pufferfish', speed: 0.35 },
  { make: () => C.fish('#ffd23f', '#1f1f1f'), len: 0.45, label: 'sergeant major', school: 6, speed: 0.9 },
  { make: () => C.fish('#ff8c42', '#fff5e2'), len: 0.42, label: 'anthias', school: 5, speed: 1 },
  { make: () => C.fish('#e9f3f5'), len: 0.26, label: 'silverside', school: 9, speed: 1.3 },
  { make: C.turtle, len: 2.4, label: 'green turtle', speed: 0.45, deep: true },
]

// The reef: [x, z, size, piece].
const REEF: [number, number, number, () => THREE.Object3D][] = [
  [-9, -6, 3, () => R.brainCoral('#c77d5a')],
  [-15, -13, 2.6, () => R.tableCoral('#7fb3a8')],
  [-12.5, -3, 2.2, () => R.seaFan('#d9566b')],
  [-3.5, -4, 1.7, () => R.anemone('#ff9d7a', '#b4566b')],
  [-1, -11, 2.4, () => R.seaweed()],
  [0.8, -6, 1.1, () => R.starfish('#e2553d')],
  [3, -8.5, 3.6, () => R.rock(0, '#6d7f86')],
  [5.5, -2.5, 1.7, () => R.seaweed('#2f7a4a')],
  [7.5, -5, 2.2, () => R.tubeCoral('#e2a33d', '#7a3b1c')],
  [10.5, -9, 3, () => R.branchCoral('#d26a8a')],
  [13.5, -4, 2.6, () => R.seaFan('#8a5fc7')],
  [12, -13, 4.5, () => R.rock(2, '#5c6b78')],
  [-15.5, -10, 4.5, () => R.rock(1, '#6d7f86')],
  [-7, -1.5, 1.4, () => R.brainCoral('#9fb86a')],
  [16.5, -8, 2.4, () => R.seaweed('#3e8f55')],
  [-18, -5, 2.6, () => R.branchCoral('#e07a5f')],
]

type Fish = {
  model: C.Model
  kind: Kind
  // Place in its school, and its own small wander.
  off: THREE.Vector3
  phase: number
  id: number
  sure: number
  seen: number
}
type School = { fish: Fish[]; kind: Kind; x: number; y: number; z: number; dir: number; speed: number; phase: number; yaw: number }

export type Dive = { dispose(): void }

// `onReady` is called once the scene has drawn its first frame.
export function createDive(
  canvas: HTMLCanvasElement,
  boxes: HTMLCanvasElement,
  { still, night, onReady }: { still: boolean; night: boolean; onReady?: () => void },
): Dive {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const ctx = boxes.getContext('2d')!
  const scene = new THREE.Scene()
  // The water shading needs fog switched on; its haze is only for above water.
  scene.fog = new THREE.Fog('#a9e4e2', 1000, 2000)
  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 1200)
  camera.position.copy(CAMERA)
  camera.lookAt(LOOK)
  const fx = new Fx(scene)
  const rand = seeded(11)

  // The water all round: a far shell the water shading colours in, lighter
  // looking up and darker looking down.
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.MeshBasicMaterial({ color: '#000000', side: THREE.BackSide })))

  scene.add(new THREE.HemisphereLight('#d8f4ff', '#2d5a6a', 1.7))
  const sun = new THREE.DirectionalLight('#fff3d6', 1.3)
  sun.position.set(4, 20, 8)
  scene.add(sun)

  // --- the sea floor and the reef
  const sandGeo = new THREE.PlaneGeometry(220, 130, 70, 40).rotateX(-Math.PI / 2)
  const sp = sandGeo.attributes.position
  for (let i = 0; i < sp.count; i++) sp.setY(i, Math.sin(sp.getX(i) * 0.35) * 0.12 + Math.sin(sp.getZ(i) * 0.5 + sp.getX(i) * 0.1) * 0.1)
  sandGeo.computeVertexNormals()
  const sand = new THREE.Mesh(sandGeo, toon('#d8c28f'))
  sand.position.set(0, SEABED, -45)
  scene.add(sand)
  const reef = REEF.map(([x, z, size, make]) => {
    const piece = make()
    piece.position.set(x, SEABED + 0.05, z)
    piece.scale.setScalar(size)
    piece.rotation.y = (rand() - 0.5) * 0.8
    scene.add(piece)
    return piece
  })

  // --- light from the surface, and specks drifting in the water
  const beams = [-13, -6, 1, 8, 15].map((x, i) => {
    const beam = R.sunbeam()
    beam.material = beam.material.clone()
    beam.position.set(x, 0, -6 - (i % 3) * 3)
    beam.rotation.z = -0.18 + (i % 2) * 0.1
    beam.scale.set(28 + i * 3, 16, 28 + i * 3)
    scene.add(beam)
    return beam
  })
  const SNOW = 260
  const snowAt = new Float32Array(SNOW * 3)
  for (let i = 0; i < SNOW; i++) snowAt.set([(rand() - 0.5) * 44, SEABED + rand() * 12, -16 + rand() * 24], i * 3)
  const snowGeo = new THREE.BufferGeometry()
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowAt, 3))
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({ map: R.speckTexture(false), color: '#e8f4f0', size: 0.09, transparent: true, opacity: 0.55, depthWrite: false }),
  )
  scene.add(snow)

  // --- him
  const me = new DiverMe()
  scene.add(me.root)

  // --- the fish
  // How far across the view reaches at depth z, either side of the middle.
  const reach = (z: number) => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (CAMERA.z - z) * camera.aspect
  // Puts a school in a lane, `along` of the way across (-1 left, 1 right).
  function enter(s: School, along: number) {
    s.z = s.kind.deep ? -9 + rand() * 3 : -8 + rand() * 11
    s.y = SEABED + 1.2 + rand() * (s.kind.deep ? 3 : 5.5)
    s.x = along * (reach(s.z) + 3)
  }

  let nextId = 1
  const schools: School[] = KINDS.flatMap((kind) =>
    Array.from({ length: kind.count ?? 1 }, () => {
      const n = kind.school ?? 1
      const fish = Array.from({ length: n }, (_, i): Fish => {
        const model = kind.make()
        model.root.scale.setScalar(kind.len)
        scene.add(model.root)
        const spread = kind.len * 2.2
        return {
          model,
          kind,
          off: i ? new THREE.Vector3((rand() - 0.5) * spread * 2, (rand() - 0.5) * spread, (rand() - 0.5) * spread) : new THREE.Vector3(),
          phase: rand() * 6,
          id: nextId++,
          sure: 0.86 + rand() * 0.12,
          seen: 0,
        }
      })
      const school: School = { fish, kind, x: 0, y: 0, z: 0, dir: rand() < 0.5 ? -1 : 1, speed: kind.speed * (0.85 + rand() * 0.3), phase: rand() * 6, yaw: 0 }
      enter(school, (rand() - 0.5) * 2)
      return school
    }),
  )

  // --- framing: him on the left (or at the top), the text beside (or below)
  let size = { w: 0, h: 0 }
  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === size.w && h === size.h)) return
    size = { w, h }
    renderer.setSize(w, h, false)
    const ratio = Math.min(window.devicePixelRatio, 2)
    boxes.width = w * ratio
    boxes.height = h * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    outlineUniforms.resolution.value.set(w, h)
    const wide = w >= 768
    // Where on screen his middle goes, and where in the world that is.
    const spot = wide ? new THREE.Vector2(-0.74, -0.12) : new THREE.Vector2(-0.35, 0.4)
    const ray = new THREE.Vector3(spot.x, spot.y, 0.5).unproject(camera).sub(camera.position).normalize()
    const at = camera.position.clone().addScaledVector(ray, -camera.position.z / ray.z)
    const scale = wide ? 1 : 0.78
    me.root.scale.setScalar(scale)
    me.root.position.copy(at).y -= 2 * scale
    me.root.rotation.y = 0.85
  }
  resize()

  // --- the loop
  const lens = new THREE.Vector3()
  const aim = new THREE.Vector3()
  const p = new THREE.Vector3()
  const forward = new THREE.Vector3()
  let last = performance.now()
  let t = 0
  let breath = 1.5
  let raf = 0

  function tick(now: number) {
    resize()
    // (The first frame's timestamp can be from just before the scene started.)
    const dt = still ? 0 : THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05)
    last = now
    t += dt

    me.update(t, still)
    for (const piece of reef) if (piece.userData.sway) piece.rotation.z = Math.sin(t * 0.8 + piece.position.x) * piece.userData.sway
    beams.forEach((b, i) => ((b.material as THREE.ShaderMaterial).uniforms.opacity.value = 0.11 + 0.05 * Math.sin(t * 0.5 + i * 1.7)))
    for (let i = 0; i < SNOW; i++) {
      let y = snowAt[i * 3 + 1] - dt * 0.12
      if (y < SEABED) y += 12
      snowAt[i * 3 + 1] = y
      snowAt[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.05
    }
    snowGeo.attributes.position.needsUpdate = true

    // He breathes out every few seconds: a burst of bubbles.
    breath -= dt
    if (breath <= 0 && !still) {
      breath = 3 + Math.random()
      for (let i = 0; i < 5; i++) window.setTimeout(() => fx.rise(me.regulator.getWorldPosition(new THREE.Vector3()), 0.08 + Math.random() * 0.08, 260), i * 110)
    }
    fx.step()

    // Where his camera is pointing: the subjects loop round a spot a few
    // units in front of the lens.
    me.root.updateMatrixWorld()
    me.aim(lens, aim)
    const k = me.root.scale.x
    const spot = lens.clone().addScaledVector(aim, 2.7 * k)
    for (const s of schools) {
      if (s.kind.subject) {
        // A lazy loop, each on its own part of it.
        const a = t * s.speed * 0.5 + s.phase
        const x = spot.x + Math.cos(a) * 0.8 * k
        const z = spot.z + Math.sin(a) * 0.8 * k
        // Facing the way it's going round.
        s.yaw = Math.atan2(-Math.cos(a), -Math.sin(a))
        s.x = x
        s.z = z
        s.y = spot.y + Math.sin(a * 2 + s.phase) * 0.45 * k
      } else {
        s.x += s.dir * s.speed * dt
        if (s.x * s.dir > reach(s.z) + 3) {
          s.dir = Math.random() < 0.5 ? -1 : 1
          enter(s, -s.dir)
        }
        s.yaw = s.dir > 0 ? 0 : Math.PI
      }
      const turn = new THREE.Euler(0, s.yaw, 0)
      for (const f of s.fish) {
        const bob = Math.sin(t * 0.7 + f.phase) * 0.18
        const off = f.off.clone().applyEuler(turn)
        f.model.root.position.set(s.x + off.x, s.y + off.y + bob, s.z + off.z)
        f.model.root.rotation.set(0, s.yaw, Math.cos(t * 0.7 + f.phase) * 0.1)
        f.model.swim(t + f.phase, 1)
      }
    }

    camera.updateMatrixWorld()
    setWater(WATER, night ? 1 : 0, camera)
    renderer.render(scene, camera)
    drawBoxes(dt)
    if (onReady) {
      onReady()
      onReady = undefined
    }
    if (!still) raf = requestAnimationFrame(tick)
  }

  // SeaLens at work: a box round everything in front of the lens.
  function drawBoxes(dt: number) {
    const { w, h } = size
    ctx.clearRect(0, 0, w, h)
    camera.getWorldDirection(forward)
    const perUnit = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    ctx.font = '600 12px Figtree, system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 2
    for (const s of schools) {
      for (const f of s.fish) {
        f.model.root.getWorldPosition(p)
        const to = p.clone().sub(lens)
        const inView = to.length() < RANGE && to.angleTo(aim) < CONE
        f.seen += ((inView ? 1 : 0) - f.seen) * (still ? 1 : Math.min(1, dt * 6))
        if (f.seen < 0.02) continue
        const depth = p.clone().sub(camera.position).dot(forward)
        const k = perUnit / depth
        const bw = f.kind.len * 1.15 * k
        const bh = f.kind.len * (f.kind.deep ? 0.75 : 0.62) * k
        const c = p.clone().project(camera)
        const x = ((c.x + 1) / 2) * w - bw / 2
        const y = ((1 - c.y) / 2) * h - bh / 2
        ctx.globalAlpha = f.seen
        // Corner brackets.
        const arm = Math.min(bw, bh) * 0.3
        ctx.strokeStyle = BOX
        ctx.beginPath()
        for (const [cx, cy, sx, sy] of [
          [x, y, 1, 1],
          [x + bw, y, -1, 1],
          [x, y + bh, 1, -1],
          [x + bw, y + bh, -1, -1],
        ]) {
          ctx.moveTo(cx + sx * arm, cy)
          ctx.lineTo(cx, cy)
          ctx.lineTo(cx, cy + sy * arm)
        }
        ctx.stroke()
        // Its label: what it is, how sure, and its track.
        if (bw > 26) {
          const sure = Math.min(0.99, f.sure + Math.sin(t * 3 + f.phase) * 0.01)
          const text = `${f.kind.label} ${sure.toFixed(2)}  #${String(f.id).padStart(2, '0')}`
          const tw = ctx.measureText(text).width + 12
          ctx.fillStyle = 'rgba(8, 22, 34, 0.78)'
          ctx.fillRect(x, y - 20, tw, 18)
          ctx.fillStyle = BOX
          ctx.fillText(text, x + 6, y - 11)
        }
      }
    }
    ctx.globalAlpha = 1
  }

  // Compile the shaders before the first frame, off the main thread where
  // the GPU driver allows, so starting up doesn't freeze the page.
  let disposed = false
  renderer
    .compileAsync(scene, camera)
    .catch(() => {})
    .then(() => {
      if (!disposed) raf = requestAnimationFrame(tick)
    })
  const onResize = () => still && requestAnimationFrame(tick)
  window.addEventListener('resize', onResize)

  return {
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    },
  }
}
