// The surface in 3D: a little island off Bali at golden hour, built with
// three.js. Everything clickable in the drawn version works here too:
//   sun / moon      day ↔ night
//   cloud           rain; again for lightning; a rainbow after rain by day
//   shooting star   (night) a wish: sparkles and a meteor shower
//   plane           shot down into the sea
//   gull            squawks and steals a coconut
//   coconut         falls, bounces and rolls; grows back
//   football        kicked into the sea, where it bobs
//   pirate ship     cannon hits; it fires back; enough hits sink it, and a
//                   treasure chest washes up (click it to open it)
//   Shreyas         jumps
//   crab            flips over; corner it and it pinches
//   turtles         (night) hatch on the beach; click one to help it along
//   the sand        drag across it to write in it
// Shreyas reacts to all of it (cheers, points, ducks, runs after the ball)
// and says so in his speech balloon (lib/quip.ts), and each is counted as
// it's found (lib/discoveries.ts).
// The camera drifts a little with the cursor, and as the page scrolls it
// sinks through the surface into the ocean below (ocean.ts).
import * as THREE from 'three'
import { discover, foundDiscoveries, type DiscoveryId } from '../lib/discoveries'
import { isNight, toggleNight } from '../lib/night'
import { currentQuip, say } from '../lib/quip'
import { cannonHit, chime, planeCrash, rainfall, sinkingShip, snip, splash, squawk, thud, thunder, whistle } from '../lib/sound'
import { depthPx } from '../lib/world'
import { Character } from './character'
import { Fx } from './fx'
import * as M from './models'
import { createOcean, FRONT, type View } from './ocean'
import { SandMarks } from './sand'
import { inked, outlineUniforms, seeded, toon } from './toon'
import { setWater, WATER_DEPTHS } from './water'

const DAY = { top: '#f0a865', low: '#fbe2b4', sea: '#35a2b1', under: '#a9e4e2', hemi: '#fff2dc', ground: '#c9a46a', sun: '#fff1d6', light: 1.4, fill: 0.9, ambient: 1.35 }
const NIGHT = { top: '#1d2656', low: '#4f5c9c', sea: '#1d4e74', under: '#3b5f8c', hemi: '#8090d0', ground: '#2a3050', sun: '#b4c4ff', light: 0.55, fill: 0.3, ambient: 0.75 }

// The view is framed for a 1600×900 screen and cropped to fit, like the drawn
// scene: narrower screens lose the sides, wider ones the top of the sky.
const FRAME = { w: 1600, h: 900 }
const CAMERA = new THREE.Vector3(0, 5.4, 24)
const TARGET = new THREE.Vector3(0, 3.1, 0)
// How tall the full frame is in the world, where the camera's looking.
const FRAME_HEIGHT = 2 * CAMERA.distanceTo(TARGET) * Math.tan(THREE.MathUtils.degToRad(16))

const HITS_TO_SINK = 4
const smooth = (x: number) => x * x * (3 - 2 * x)

export type World = {
  click(x: number, y: number): boolean
  over(x: number, y: number): boolean
  dispose(): void
}

// `onHead` hears where his face is on the page (in page pixels) and how far
// above it the top of his hair is, so his speech balloon can follow him.
// `onReady` hears when the first frame has been drawn.
type Options = { still: boolean; flash: (strength: number) => void; onHead: (x: number, y: number, top: number) => void; onReady: () => void }

// `canvas` sits behind the page and draws everything; `front` sits over the
// page text and draws only the sea creatures swimming in front of it.
export function createWorld(canvas: HTMLCanvasElement, front: HTMLCanvasElement, { still, flash, onHead, onReady }: Options): World {
  const ratio = Math.min(window.devicePixelRatio, 2)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(ratio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  const overlay = new THREE.WebGLRenderer({ canvas: front, antialias: true, alpha: true })
  overlay.setPixelRatio(ratio)
  overlay.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(DAY.low, 70, 340)
  const camera = new THREE.PerspectiveCamera(32, FRAME.w / FRAME.h, 0.5, 1500)
  camera.position.copy(CAMERA)
  camera.lookAt(TARGET)
  const fx = new Fx(scene)

  // --- sky, sun, moon, stars ----------------------------------------------------
  // The sky, and from under the water, the water all round (water.ts).
  const skyUniforms = { top: { value: new THREE.Color(DAY.top) }, low: { value: new THREE.Color(DAY.low) } }
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1000, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...skyUniforms },
      defines: { NO_HAZE: '', GLOW: '' },
      fog: true,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        #include <fog_pars_vertex>
        void main() {
          vDir = normalize(position);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 top;
        uniform vec3 low;
        varying vec3 vDir;
        #include <fog_pars_fragment>
        void main() {
          float h = clamp(vDir.y * 3.2, 0.0, 1.0);
          gl_FragColor = vec4(mix(low, top, pow(h, 0.8)), 1.0);
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    }),
  )
  scene.add(sky)

  const sun = new THREE.Group()
  const sunBall = inked(new THREE.SphereGeometry(13, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffd680', fog: false }), 3)
  sunBall.castShadow = false
  sun.add(sunBall, glow('#ffd680', 70))
  sun.position.set(98, 22, -320)
  scene.add(sun)

  const moon = new THREE.Group()
  const moonBall = inked(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: '#f4f1d8', fog: false }), 3)
  moonBall.castShadow = false
  for (const [x, y, r] of [
    [-3, 2, 1.8],
    [3.2, -2.4, 1.3],
    [2.2, 3.4, 0.9],
  ]) {
    const crater = new THREE.Mesh(new THREE.CircleGeometry(r, 12), new THREE.MeshBasicMaterial({ color: '#dcd6b4', fog: false }))
    crater.position.set(x, y, 8.4)
    moonBall.add(crater)
  }
  moon.add(moonBall, glow('#f4f1d8', 40))
  moon.position.set(90, -30, -320)
  scene.add(moon)

  const stars = (() => {
    const rand = seeded(5)
    const pts: number[] = []
    for (let i = 0; i < 320; i++) {
      const a = (rand() - 0.5) * Math.PI * 0.9
      const e = 0.06 + rand() * 0.5
      pts.push(Math.sin(a) * Math.cos(e) * 900, Math.sin(e) * 900, -Math.cos(a) * Math.cos(e) * 900)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff8dc', size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }))
  })()
  scene.add(stars)

  // A shooting star streaks across the night sky every so often, down and to
  // the left. Its head is at its origin and its tail trails off to the right,
  // tilted up along the path it came from.
  const STAR_FALL = 0.2
  const shootingStar = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0),
    new THREE.MeshBasicMaterial({ color: '#fff8dc', transparent: true, opacity: 0, fog: false, depthWrite: false }),
  )
  shootingStar.scale.set(28, 0.6, 1)
  scene.add(shootingStar)

  // --- light --------------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(DAY.hemi, DAY.ground, DAY.ambient)
  hemi.layers.enableAll()
  scene.add(hemi)
  // Sunlight by day, moonlight by night, from where the sun or moon rests in
  // the sky: behind the island and to the right, so shadows fall forward and
  // to the left. The moon sits higher than the sun, so night shadows are
  // shorter. Both shine from higher than they're drawn, to keep the shadows
  // short. As day turns to night the shadows fade out, the light moves from
  // the sun to the moon while they're gone, and they fade back in; moving the
  // light while they showed would make them crawl.
  const light = new THREE.DirectionalLight(DAY.sun, DAY.light)
  light.layers.enableAll()
  light.target.position.set(0, 0, 1)
  const SUN_AT = sun.position.clone()
  // Where the moon ends up once night has fallen (see the moon's rise below).
  const MOON_AT = moon.position.clone().setY(-30 + 72)
  const aimLight = (night: number) => {
    const from = night < 0.5 ? SUN_AT : MOON_AT
    const out = light.position.copy(from).sub(light.target.position).setY(0).normalize()
    out.multiplyScalar(23).add(light.target.position).setY(from.y * 0.75 + 3)
    // Full by day and by night, gone through the middle of the change.
    light.shadow.intensity = THREE.MathUtils.smoothstep(Math.abs(night - 0.5) * 2, 0.3, 1)
  }
  aimLight(0)
  light.castShadow = true
  light.shadow.mapSize.set(2048, 2048)
  light.shadow.camera.left = -14
  light.shadow.camera.right = 14
  light.shadow.camera.top = 12
  light.shadow.camera.bottom = -10
  light.shadow.camera.far = 70
  light.shadow.bias = -0.0008
  light.shadow.normalBias = 0.02
  // Soft-edged shadows: each one is blurred over this many shadow-map texels.
  light.shadow.radius = 5
  scene.add(light, light.target)
  // A soft light from in front that casts no shadows, so the faces turned to
  // the camera aren't all in shade.
  const fill = new THREE.DirectionalLight(DAY.sun, DAY.fill)
  fill.layers.enableAll()
  fill.position.set(-14, 22, 16)
  fill.target.position.set(0, 0, 1)
  scene.add(fill, fill.target)

  // --- sea ------------------------------------------------------------------------
  const seaGeo = new THREE.PlaneGeometry(760, 440, 150, 88)
  seaGeo.rotateX(-Math.PI / 2)
  seaGeo.translate(0, 0, -150)
  const seaBase = Float32Array.from(seaGeo.attributes.position.array)
  const seaMat = new THREE.MeshLambertMaterial({ color: DAY.sea, flatShading: true })
  // The swell barely tilts each facet, which the moon's low light shows up but
  // the bright day washes out. So by day (`shimmer`) the sea is painted in
  // drifting patches, banded like the toon shading: dark blue troughs, the sea's
  // own blue, lighter water, and white foam where a patch peaks on a facet
  // turned to the sun.
  const seaShimmer = {
    shimmer: { value: 0 },
    sunDir: { value: new THREE.Vector3() },
    seaTime: { value: 0 },
    seaDeep: { value: new THREE.Color('#1a6492') },
    seaLight: { value: new THREE.Color('#62c6cc') },
    seaFoam: { value: new THREE.Color('#eef9f5') },
  }
  const seaWater = seaMat.onBeforeCompile
  seaMat.onBeforeCompile = (shader, renderer) => {
    seaWater.call(seaMat, shader, renderer)
    Object.assign(shader.uniforms, seaShimmer)
    shader.fragmentShader = /* glsl */ `
uniform float shimmer;
uniform vec3 sunDir;
uniform float seaTime;
uniform vec3 seaDeep;
uniform vec3 seaLight;
uniform vec3 seaFoam;
float seaHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
float seaNoise( vec2 p ) {
  vec2 i = floor( p );
  vec2 f = fract( p );
  f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( seaHash( i ), seaHash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( seaHash( i + vec2( 0.0, 1.0 ) ), seaHash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}
${shader.fragmentShader}`.replace(
      '#include <opaque_fragment>',
      /* glsl */ `
  #ifdef USE_FOG
  if ( shimmer > 0.0 ) {
    // The facet's tilt away from level, in the view's space.
    vec3 up = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
    vec3 tilt = normal - up * dot( normal, up );
    // Two layers of patches drifting different ways, so nothing lines up.
    vec2 p = vFogWorld.xz;
    float v = seaNoise( p * 0.11 + vec2( 0.05, 0.03 ) * seaTime ) * 0.6
      + seaNoise( mat2( 0.8, -0.6, 0.6, 0.8 ) * p * 0.29 - vec2( 0.07, -0.05 ) * seaTime ) * 0.4
      + dot( tilt, sunDir ) * 3.0;
    // How lit the sea is here, to light the band colours the same.
    vec3 lit = outgoingLight / max( diffuseColor.rgb, vec3( 0.001 ) );
    vec3 band = v < 0.4 ? seaDeep : v < 0.6 ? diffuseColor.rgb : v < 0.76 ? seaLight : seaFoam;
    outgoingLight = mix( outgoingLight, band * lit, shimmer );
  }
  #endif
  #include <opaque_fragment>`,
    )
  }
  scene.add(new THREE.Mesh(seaGeo, seaMat))
  // Its underside, bright with the sky beyond, seen from below.
  const underMat = new THREE.MeshBasicMaterial({ color: DAY.under, side: THREE.BackSide })
  scene.add(new THREE.Mesh(seaGeo, underMat))
  const waveAt = (x: number, z: number, t: number) =>
    0.13 * Math.sin(x * 0.33 + t * 1.3) +
    0.1 * Math.sin(z * 0.45 + t * 1.05) +
    0.05 * Math.sin((x + z) * 0.9 + t * 2.1) +
    // Crossing swells at odd angles, so the sea doesn't fall into rows.
    0.07 * Math.sin(x * 0.29 - z * 0.38 + t * 1.6) +
    0.05 * Math.sin(-x * 0.52 - z * 0.21 + t * 1.9)

  // --- the island and everything on it ---------------------------------------------
  const marks = new SandMarks()
  const land = M.island(marks)
  scene.add(land)
  const sand = land.getObjectByName('island')!
  const shore = land.getObjectByName('shore')!
  const foam = M.foam()
  scene.add(foam)
  scene.add(M.horizon())

  const palms = [M.palm(7.4, 2.3, 1), M.palm(6.6, -2.1, 2)]
  palms[0].group.position.set(-7, M.groundAt(-7, -1.6), -1.6)
  palms[1].group.position.set(6.8, M.groundAt(6.8, -1), -1)
  palms[1].group.rotation.y = 0.5
  for (const p of palms) scene.add(p.group)
  const nuts = palms.flatMap((p) => p.nuts)

  const sign = M.signpost()
  sign.position.set(-4, M.groundAt(-4, 1.4), 1.4)
  sign.rotation.y = 0.35
  scene.add(sign)

  const tripod = M.tripodCamera()
  tripod.position.set(4.3, M.groundAt(4.3, 1.8), 1.8)
  tripod.rotation.y = Math.PI + 0.55
  scene.add(tripod)

  const BALL_R = 0.36
  const ballHome = new THREE.Vector3(2.3, M.groundAt(2.3, 6.2) + BALL_R, 6.2)
  const ball = M.football(BALL_R)
  ball.position.copy(ballHome)
  scene.add(ball)

  const shreyas = new Character()
  const HOME = new THREE.Vector3(-0.2, M.groundAt(-0.2, 5), 5)
  shreyas.root.position.copy(HOME)
  // He casts a shadow on the sand, but not on himself.
  shreyas.root.traverse((o) => (o.receiveShadow = false))
  scene.add(shreyas.root)

  // --- things passing by: clouds, plane, gulls, pirate ship -------------------------
  type Drifter = { obj: THREE.Object3D; dur: number; delay: number; y: number; z: number }
  const clouds: Drifter[] = [
    { obj: M.cloud(1), dur: 140, delay: 30, y: 21, z: -110 },
    { obj: M.cloud(2), dur: 110, delay: 80, y: 16, z: -80 },
    { obj: M.cloud(3), dur: 170, delay: 130, y: 28, z: -150 },
  ]
  clouds[0].obj.scale.setScalar(3)
  clouds[1].obj.scale.setScalar(2.2)
  clouds[2].obj.scale.setScalar(3.4)
  for (const c of clouds) scene.add(c.obj)

  // How far either side of centre is off-screen at a given depth (plus a margin).
  const offscreen = (z: number, margin = 12) => (CAMERA.z - z) * Math.tan(THREE.MathUtils.degToRad(16)) * (FRAME.w / FRAME.h) + margin

  const plane = M.plane()
  plane.scale.setScalar(1.5)
  scene.add(plane)
  const flight = { crashedAt: -100 }

  const gulls = [M.gull(), M.gull()]
  gulls.forEach((g) => scene.add(g))
  const gullState = gulls.map((_, i) => ({ goneUntil: 0, offset: i * 0.6 }))

  const ship = M.pirateShip()
  ship.scale.setScalar(1.25)
  scene.add(ship)
  const voyage = { hits: 0, sinking: -1, sunkCycle: -1, holes: [] as THREE.Object3D[], firedAt: -100 }

  // What a sunk ship leaves behind: a chest that floats in and washes up.
  const chest = M.treasureChest()
  chest.visible = false
  scene.add(chest)
  type Treasure = { phase: 'none' | 'float' | 'beach' | 'beached' | 'open'; at: number; side: number; from: THREE.Vector3; via: THREE.Vector3; to: THREE.Vector3; glint: number }
  const treasure: Treasure = { phase: 'none', at: 0, side: 1, from: new THREE.Vector3(), via: new THREE.Vector3(), to: new THREE.Vector3(), glint: 0 }

  // --- living on the beach: a crab, and at night, turtles hatching -------------------
  const crab = M.crab()
  crab.scale.setScalar(1.3)
  scene.add(crab)
  // Where it may go: the front of the beach, on dry sand.
  const CRAB_X = 4.6
  const CRAB_Z = [7, 8.4] as const
  const crabState = { x: 3.4, z: 7.6, goal: new THREE.Vector2(3.4, 7.6), nextGoal: 2, flipAt: -100, pinchAt: -100, cornered: 0, phase: 0 }
  const onSand = (x: number, z: number) => Math.abs(x) < CRAB_X && z > CRAB_Z[0] && z < CRAB_Z[1] && M.groundAt(x, z) > 0.12

  type Hatchling = { obj: THREE.Group; bornAt: number; heading: number; phase: number; boostUntil: number }
  const turtles: Hatchling[] = []
  // The eggs they hatch from: up out of the sand, a wobble, then the top
  // flies off (`fling`) and the empty bottom sinks back in.
  type Egg = { obj: THREE.Group; laidAt: number; bornAt: number; phase: number; fling: THREE.Vector3 }
  const eggs: Egg[] = []
  const nest = { nextAt: -1, side: 1 }

  // --- state shared with the frame loop --------------------------------------------
  const pointer = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 3)
  const eased = new THREE.Vector2(0, 0)
  const gaze = { x: 0, y: 0, near: 0 }
  let night = isNight() ? 1 : 0
  let lean = 0
  let lastScroll = window.scrollY
  let size = { w: 0, h: 0 }

  const move = (e: PointerEvent) => pointer.set(e.clientX, e.clientY)
  window.addEventListener('pointermove', move)

  // Writing in the sand: press on the beach and drag. (Not by touch, where
  // dragging scrolls the page.) The click that ends a drag isn't a click.
  const drawing = { down: false, active: false, from: null as THREE.Vector3 | null, x: 0, y: 0, length: 0, drew: false }
  const sandAt = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect()
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObject(sand, false)[0]
    return hit && hit.point.y > 0.12 ? hit.point : null
  }
  const press = (e: PointerEvent) => {
    drawing.drew = false
    if (e.button !== 0 || e.pointerType === 'touch' || sink() > 2) return
    if ((e.target as Element).closest('a, button, dialog, p, h1, h2, h3, li, [data-ui]')) return
    if (pick(e.clientX, e.clientY)) return
    const at = sandAt(e.clientX, e.clientY)
    if (!at) return
    // Otherwise the drag would select text.
    e.preventDefault()
    Object.assign(drawing, { down: true, active: false, from: at, x: e.clientX, y: e.clientY })
  }
  const drag = (e: PointerEvent) => {
    if (!drawing.down) return
    if (!drawing.active && Math.hypot(e.clientX - drawing.x, e.clientY - drawing.y) < 4) return
    drawing.active = true
    const at = sandAt(e.clientX, e.clientY)
    // Off the sand, the line lifts, and starts again where it comes back.
    if (!at) return void (drawing.from = null)
    if (!drawing.from) return void (drawing.from = at)
    const d = at.distanceTo(drawing.from)
    if (d < 0.04) return
    marks.line(drawing.from, at)
    drawing.from = at
    drawing.length += d
    if (drawing.length > 3) discover('sand')
  }
  const lift = () => {
    if (drawing.active) drawing.drew = true
    drawing.down = drawing.active = false
  }
  window.addEventListener('pointerdown', press)
  window.addEventListener('pointermove', drag)
  window.addEventListener('pointerup', lift)
  window.addEventListener('pointercancel', lift)

  // Lining the world up with the page: k is world units per screen pixel
  // where the camera's looking, and the page pixel at `centre` (down from the
  // top of the screen) is what it's looking at.
  const frame = { s: 1, k: 0.01, centre: 0 }
  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === size.w && h === size.h)) return
    size = { w, h }
    renderer.setSize(w, h, false)
    overlay.setSize(w, h, false)
    // Scale the 1600×900 frame to cover the canvas, centred, bottom aligned.
    const s = Math.max(w / FRAME.w, h / FRAME.h)
    const [fw, fh] = [FRAME.w * s, FRAME.h * s]
    camera.setViewOffset(fw, fh, (fw - w) / 2, fh - h, w, h)
    outlineUniforms.resolution.value.set(w, h)
    frame.s = s
    frame.k = FRAME_HEIGHT / fh
    frame.centre = h - fh / 2
  }

  // As the page scrolls, the camera sinks by the same distance, so things in
  // the world keep pace with the page (exactly, where the camera's looking;
  // nearer things pass faster and further ones slower).
  const sink = () => window.scrollY * frame.k
  const view: View = {
    camera,
    w: 0,
    h: 0,
    s: 1,
    night: 0,
    reading: null,
    y: (py, z) => CAMERA.y - (py - frame.centre) * frame.k - ((CAMERA.y - TARGET.y) * (CAMERA.z - z)) / (CAMERA.z - TARGET.z),
    unit: (z) => (frame.k * (CAMERA.z - z)) / (CAMERA.z - TARGET.z),
  }
  const ocean = createOcean(scene, fx, still)

  // --- picking ------------------------------------------------------------------------
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  function pick(x: number, y: number) {
    const r = canvas.getBoundingClientRect()
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return
    // The shooting star is only there for a moment, so it wins over anything
    // behind it, and anywhere along its streak catches it, not just its head.
    if (night > 0.5 && starState.visible) {
      const head = shootingStar.getWorldPosition(new THREE.Vector3())
      const a = toScreen(head)
      const b = toScreen(shootingStar.localToWorld(new THREE.Vector3(1, 0, 0)))
      const k = THREE.MathUtils.clamp(((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / Math.max((b.x - a.x) ** 2 + (b.y - a.y) ** 2, 1), 0, 1)
      if (Math.hypot(a.x + (b.x - a.x) * k - x, a.y + (b.y - a.y) * k - y) < 48) return { kind: 'star', obj: shootingStar, point: head, distance: 0 }
    }
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const targets: [THREE.Object3D, string][] = [
      [shreyas.root, 'shreyas'],
      [ball, 'ball'],
      ...nuts.filter((n) => n.visible && !n.userData.falling).map((n): [THREE.Object3D, string] => [n, 'nut']),
      ...gulls.filter((g, i) => g.visible && gullState[i].goneUntil === 0).map((g): [THREE.Object3D, string] => [g, 'gull']),
      [crab, 'crab'],
      ...turtles.filter((h) => h.obj.visible).map((h): [THREE.Object3D, string] => [h.obj, 'turtle']),
      ...(treasure.phase === 'beached' ? [[chest, 'chest'] as [THREE.Object3D, string]] : []),
      [plane, 'plane'],
      [ship, 'ship'],
      ...clouds.map((c): [THREE.Object3D, string] => [c.obj, 'cloud']),
      [night > 0.5 ? moon : sun, 'sky'],
    ]
    let best: { kind: string; obj: THREE.Object3D; point: THREE.Vector3; distance: number } | undefined
    for (const [obj, kind] of targets) {
      if (!obj.visible) continue
      const hit = ray.intersectObject(obj, true).find((h) => !h.object.userData.outline)
      if (hit && (!best || hit.distance < best.distance)) best = { kind, obj, point: hit.point, distance: hit.distance }
    }
    // Gulls and coconuts are small, so a near miss counts too.
    if (!best) {
      for (const [obj, kind, px] of [
        ...gulls.map((g, i): [THREE.Object3D, string, number] => [g, gullState[i].goneUntil === 0 && g.visible ? 'gull' : '', 26]),
        ...nuts.map((n): [THREE.Object3D, string, number] => [n, n.visible && !n.userData.falling ? 'nut' : '', 12]),
        [crab, 'crab', 24] as [THREE.Object3D, string, number],
        ...turtles.map((h): [THREE.Object3D, string, number] => [h.obj, h.obj.visible ? 'turtle' : '', 22]),
      ]) {
        if (!kind) continue
        const p = toScreen(obj.getWorldPosition(new THREE.Vector3()))
        if (Math.hypot(p.x - x, p.y - y) < px) return { kind, obj, point: obj.getWorldPosition(new THREE.Vector3()), distance: 0 }
      }
    }
    return best
  }

  function toScreen(v: THREE.Vector3) {
    const r = canvas.getBoundingClientRect()
    const p = v.clone().project(camera)
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height }
  }

  // --- clicks -----------------------------------------------------------------------------
  let t = 0

  // He says hello as the page opens, then, while the island's in view and
  // he's nothing else to say, now and then nudges towards something that
  // hasn't been found yet. Playing with the island puts the nudges off.
  const NUDGES: [DiscoveryId, string][] = [
    ['jump', 'psst, you can click on me'],
    ['night', 'try clicking the sun'],
    ['rain', 'go on, poke a cloud'],
    ['coconut', 'those coconuts look ripe…'],
    ['football', 'fancy a kickabout? click the ball'],
    ['gull', 'watch out for the gulls'],
    ['plane', 'click the plane when it flies over'],
    ['ship', 'pirates! fire at their ship'],
    ['crab', "there's a crab on the beach"],
    ['sand', 'try drawing in the sand'],
    ['wish', 'catch a shooting star!'],
    ['turtles', 'something’s hatching on the beach…'],
  ]
  let greeted = false
  let nextNudge = 25
  function chatter() {
    if (!greeted) {
      if (t < 1.2) return
      greeted = true
      say("hi, my name's Shreyas Venadan!", 4.5)
      return
    }
    if (t < nextNudge) return
    nextNudge = t + 25
    if (camera.position.y < 0 || currentQuip() || document.hidden) return
    const found = foundDiscoveries()
    const ideas = NUDGES.filter(([id]) => !found.has(id) && ((id !== 'wish' && id !== 'turtles') || night > 0.5))
    if (ideas.length) say(ideas[Math.floor(Math.random() * ideas.length)][1], 3.5)
  }

  function click(x: number, y: number) {
    nextNudge = t + 25
    if (drawing.drew) {
      drawing.drew = false
      return true
    }
    if (ocean.click(x, y)) return true
    const hit = pick(x, y)
    if (!hit) return false
    switch (hit.kind) {
      case 'shreyas':
        shreyas.jump()
        discover('jump')
        break
      case 'crab':
        flipCrab()
        break
      case 'turtle':
        nudgeTurtle(turtles.find((h) => h.obj === hit.obj)!)
        break
      case 'chest':
        openChest()
        break
      case 'ball':
        kickBall(x)
        break
      case 'nut':
        dropCoconut(hit.obj as THREE.Mesh)
        break
      case 'gull':
        annoyGull(gulls.indexOf(hit.obj as THREE.Group))
        break
      case 'plane':
        crashPlane()
        break
      case 'ship':
        hitShip(hit.point)
        break
      case 'cloud':
        clickCloud(clouds.find((c) => c.obj === hit.obj)!)
        break
      case 'star':
        makeWish()
        break
      case 'sky':
        toggleNight()
        discover('night')
        break
    }
    return true
  }

  // Coconuts drop, bounce and roll to a stop; a new one grows back later.
  function dropCoconut(nut: THREE.Mesh) {
    discover('coconut')
    nut.userData.falling = true
    const at = nut.getWorldPosition(new THREE.Vector3())
    const fallen = nut.clone()
    fallen.position.copy(at)
    nut.visible = false
    const v = new THREE.Vector3((Math.random() < 0.5 ? -1 : 1) * (0.03 + Math.random() * 0.03), 0, 0.02 + Math.random() * 0.03)
    let bounces = 0
    fx.add(fallen, (n, age) => {
      v.y -= 0.012
      n.position.add(v)
      const ground = M.groundAt(n.position.x, n.position.z) + 0.24
      if (n.position.y < ground) {
        n.position.y = ground
        if (bounces === 0) thud()
        v.y = bounces < 2 ? -v.y * 0.35 : 0
        bounces++
        v.x *= 0.95
        v.z *= 0.95
      }
      n.rotation.z -= v.x / 0.26
      n.rotation.x += v.z / 0.26
      // Lies there a while, then sinks into the sand.
      if (age > 400) n.scale.setScalar(Math.max(0.01, 1 - (age - 400) / 40))
      return age < 440
    })
    regrow(nut, 7000)
  }

  function regrow(nut: THREE.Mesh, after: number) {
    window.setTimeout(() => {
      nut.position.copy(nut.userData.home)
      nut.scale.setScalar(0.01)
      nut.visible = true
      fx.add(new THREE.Object3D(), (_, age) => {
        nut.scale.setScalar(Math.min(1, (age + 1) / 50))
        if (age >= 50) delete nut.userData.falling
        return age < 50
      })
    }, after)
  }

  // The football flies off away from the side it was clicked on, into the sea.
  function kickBall(clientX: number) {
    if (ball.userData.kicked) return
    thud()
    discover('football')
    if (still) return
    ball.userData.kicked = true
    const dir = clientX < toScreen(ball.position).x ? 1 : -1
    // Shreyas runs after it, as far as the water.
    if (errand.phase === 'none') Object.assign(errand, { phase: 'wait', until: t + 0.35, side: dir })
    const FLIGHT = 64
    const land = new THREE.Vector3(dir * (11.5 + Math.random() * 3), 0, 2 + Math.random() * 4)
    const v = new THREE.Vector3().subVectors(land, ball.position).divideScalar(FLIGHT)
    const g = 0.012
    v.y = (land.y - ball.position.y + (g * FLIGHT * FLIGHT) / 2) / FLIGHT
    fx.add(new THREE.Object3D(), (_, age) => {
      if (age < FLIGHT) {
        v.y -= g
        ball.position.add(v)
        ball.rotation.z -= dir * 0.25
        ball.rotation.x += 0.1
      } else {
        if (age === FLIGHT) {
          splash()
          fx.splash(ball.position.x, ball.position.z, 1)
        }
        // Bobbing on the swell, drifting slowly on.
        ball.position.x += v.x * 0.03
        ball.position.y = waveAt(ball.position.x, ball.position.z, t) + 0.12 + Math.sin(age / 14) * 0.05
        ball.rotation.z -= dir * 0.006
        const left = FLIGHT + 420 - age
        ball.scale.setScalar(Math.min(1, left / 60))
      }
      if (age < FLIGHT + 420) return true
      // A fresh one back on the sand a little later.
      ball.visible = false
      window.setTimeout(() => {
        ball.position.copy(ballHome)
        ball.rotation.set(0, 0, 0)
        ball.visible = true
        fx.add(new THREE.Object3D(), (_, a) => {
          ball.scale.setScalar(Math.min(1, (a + 1) / 30))
          if (a >= 30) delete ball.userData.kicked
          return a < 30
        })
      }, 2500)
      return false
    })
  }

  // A gull squawks, sheds feathers, then swoops on the nearest coconut and
  // flies off with it. It's back on its usual route a while later.
  function annoyGull(i: number) {
    const gull = gulls[i]
    const state = gullState[i]
    squawk()
    const from = gull.position.clone()
    for (let k = 0; k < 2; k++) fx.feather(from)
    if (still) return
    state.goneUntil = t + 14
    let target: THREE.Mesh | undefined
    let to = new THREE.Vector3(0, 9, 0)
    let best = Infinity
    for (const nut of nuts) {
      if (!nut.visible || nut.userData.falling) continue
      const at = nut.getWorldPosition(new THREE.Vector3())
      const d = at.distanceTo(from)
      if (d < best) [best, target, to] = [d, nut, at]
    }
    if (target) target.userData.falling = true
    const away = new THREE.Vector3(from.x < 0 ? 70 : -70, 30, -40)
    const DIVE = 80
    const ESCAPE = 150
    const curve = (a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, k: number) =>
      new THREE.Vector3().addScaledVector(a, (1 - k) ** 2).addScaledVector(c, 2 * (1 - k) * k).addScaledVector(b, k * k)
    const mid1 = new THREE.Vector3((from.x + to.x) / 2, to.y + 2, (from.z + to.z) / 2)
    const mid2 = new THREE.Vector3(to.x + (away.x - to.x) * 0.3, to.y - 1, to.z)
    let carried: THREE.Mesh | undefined
    fx.add(new THREE.Object3D(), (_, age) => {
      const prev = gull.position.clone()
      if (age < DIVE) gull.position.copy(curve(from, mid1, to.clone().add(new THREE.Vector3(0, 0.6, 0)), age / DIVE))
      else {
        if (age === DIVE && target) {
          discover('gull')
          say('hey, my coconut!', 2.5)
          target.visible = false
          carried = target.clone()
          carried.position.set(0, -0.35, 0)
          carried.scale.setScalar(0.8)
          gull.add(carried)
          squawk()
        }
        gull.position.copy(curve(to.clone().add(new THREE.Vector3(0, 0.6, 0)), mid2, away, (age - DIVE) / ESCAPE))
      }
      gull.lookAt(gull.position.clone().add(gull.position.clone().sub(prev)))
      gull.rotateY(-Math.PI / 2)
      if (age < DIVE + ESCAPE) return true
      if (carried) gull.remove(carried)
      gull.visible = false
      gull.rotation.set(0, 0, 0)
      if (target) regrow(target, 1000)
      return false
    })
  }

  // The plane bursts, nose-dives trailing smoke and splashes into the sea.
  function crashPlane() {
    if (still || t - flight.crashedAt < 20) return
    flight.crashedAt = t
    discover('plane')
    say('mayday!', 2.5)
    shreyas.react('point', 2.6, towards(plane.position))
    const wreck = plane.clone()
    wreck.position.copy(plane.position)
    wreck.rotation.copy(plane.rotation)
    plane.visible = false
    const v = new THREE.Vector3(0.18, -0.05, 0.05)
    const g = 0.006
    planeCrash(Math.sqrt((2 * wreck.position.y) / g) / 60)
    fx.burst(wreck.position.clone(), 2)
    fx.add(wreck, (w, age) => {
      v.y -= g
      v.x *= 0.995
      w.position.add(v)
      w.rotation.z = Math.atan2(v.y, v.x) + Math.sin(age / 4) * 0.14
      w.rotation.x += 0.05
      w.getObjectByName('prop')!.rotation.x += 0.5
      if (age % 3 === 0) fx.smoke(w.localToWorld(new THREE.Vector3(-1.8, 0, 0)), 2.2)
      if (w.position.y > 0) return true
      splash()
      fx.splash(w.position.x, w.position.z, 3)
      return false
    })
  }

  // A cannonball hit (never shown): boom, fire, smoke, splinters and a hole.
  // The ship lurches and lists further with each; enough hits sink it.
  function hitShip(point: THREE.Vector3) {
    if (voyage.sinking >= 0) return
    voyage.hits++
    cannonHit()
    fx.burst(point, 1.5)
    fx.smoke(point, 2.4, 60)
    fx.splinters(point)
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.32, 9), new THREE.MeshBasicMaterial({ color: '#1a0f08' }))
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 9), new THREE.MeshBasicMaterial({ color: '#d9b07a' }))
    hole.add(rim)
    ship.worldToLocal(hole.position.copy(point))
    hole.position.z = 1.16
    hole.rotation.z = Math.random() * 6
    ship.add(hole)
    voyage.holes.push(hole)
    lurchAt = t
    if (voyage.hits >= HITS_TO_SINK) {
      voyage.sinking = t + 0.75
      window.setTimeout(() => sinkingShip(4), 750)
      discover('ship')
      say('nice shot!', 3)
      shreyas.react('cheer', 2.6)
      const x = ship.position.x
      if (!still) window.setTimeout(() => washUp(x), 4500)
    } else if (!still && t - voyage.firedAt > 2.5) {
      // Hit, it fires back.
      voyage.firedAt = t
      window.setTimeout(fireBack, 900)
    }
  }
  let lurchAt = -100

  // From the ship, a cannonball lobbed at the island, landing near Shreyas
  // (never on him): he ducks, and it leaves a crater in the sand.
  function fireBack() {
    if (voyage.sinking >= 0 || !ship.visible) return
    const port = ship.localToWorld(new THREE.Vector3([-1.6, -0.4, 0.8, 2][Math.floor(Math.random() * 4)], 0.35, 1.3))
    cannonHit(0.22)
    fx.burst(port, 1)
    fx.smoke(port, 2.2, 50)
    const me = shreyas.root.position
    let land = new THREE.Vector3(me.x + 2, 0, me.z)
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2
      const d = 1.6 + Math.random() * 1.4
      const x = me.x + Math.cos(a) * d
      const z = me.z + Math.sin(a) * d * 0.7
      if (M.groundAt(x, z) > 0.25) {
        land = new THREE.Vector3(x, 0, z)
        break
      }
    }
    land.y = M.groundAt(land.x, land.z)
    const FLIGHT = 100
    const g = 0.006
    const v = new THREE.Vector3().subVectors(land, port).divideScalar(FLIGHT)
    v.y = (land.y - port.y + (g * FLIGHT * FLIGHT) / 2) / FLIGHT
    whistle(FLIGHT / 60)
    fx.add(M.cannonball(), (b, age) => {
      if (age === 0) b.position.copy(port)
      v.y -= g
      b.position.add(v)
      if (age === FLIGHT - 35) shreyas.react('duck', 1.5)
      if (age < FLIGHT) return true
      thud()
      cannonHit(0.3)
      fx.sandBurst(land, 1.2)
      fx.smoke(land.clone().setY(land.y + 0.3), 1.6, 40)
      marks.crater(land, 0.45)
      say(['hey!', 'missed me!', 'rude!'][Math.floor(Math.random() * 3)], 2)
      if (Math.hypot(crabState.x - land.x, crabState.z - land.z) < 2) flipCrab(true)
      return false
    })
  }

  // The chest bobs in from where the ship went down, round the island to the
  // beach on that side, and up onto the sand.
  function washUp(x: number) {
    if (treasure.phase !== 'none') return
    const side = x < 0 ? -1 : 1
    Object.assign(treasure, { phase: 'float', at: t, side, glint: t })
    treasure.from.set(x, 0, -68)
    treasure.via.set(side * 22, 0, -8)
    treasure.to.set(side * 8.6, 0, 7.4)
    chest.position.copy(treasure.from)
    chest.rotation.set(0, 0, 0)
    chest.scale.setScalar(1)
    ;(chest.userData.lid as THREE.Object3D).rotation.x = 0
    chest.visible = true
  }

  function openChest() {
    treasure.phase = 'open'
    treasure.at = t
    chime()
    discover('treasure')
    say('finders keepers!', 3)
    shreyas.react('cheer', 2)
    const top = chest.localToWorld(new THREE.Vector3(0, 0.7, 0))
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      fx.sparkle(top, new THREE.Vector3(Math.cos(a) * 0.3, 0.5 + Math.abs(Math.sin(a)) * 0.5, 0).normalize().multiplyScalar(0.25), camera, 0.35)
    }
  }

  // Which way something is from Shreyas, on screen (x right, y up).
  function towards(v: THREE.Vector3) {
    const a = toScreen(shreyas.faceAt(new THREE.Vector3()))
    const b = toScreen(v)
    return { x: b.x - a.x, y: a.y - b.y }
  }

  // --- Shreyas running after the football ---------------------------------------------
  type Errand = { phase: 'none' | 'wait' | 'out' | 'look' | 'back'; until: number; side: number }
  const errand: Errand = { phase: 'none', until: 0, side: 1 }
  const RUN_TO = new THREE.Vector3(5.4, 0, 4.8)
  function runErrand(dt: number) {
    const me = shreyas.root.position
    let goal: THREE.Vector3 | null = null
    let speed = 0
    let face = 0
    switch (errand.phase) {
      case 'wait':
        if (t > errand.until) {
          errand.phase = 'out'
          say('my ball!', 2)
        }
        break
      case 'out': {
        // As far as the water, or the edge of the screen on narrow ones.
        const seen = (CAMERA.z - RUN_TO.z) * Math.tan(THREE.MathUtils.degToRad(16)) * (FRAME.w / FRAME.h) * (size.w / (FRAME.w * frame.s))
        goal = RUN_TO.clone().setX(Math.min(RUN_TO.x, seen - 1) * errand.side)
        speed = 3.4
        break
      }
      case 'look':
        // Gazing out to sea after it.
        face = errand.side * 0.7
        if (t > errand.until) errand.phase = 'back'
        break
      case 'back':
        goal = HOME
        speed = 2.2
        break
    }
    let running = 0
    if (goal) {
      const to = new THREE.Vector3(goal.x - me.x, 0, goal.z - me.z)
      const d = to.length()
      if (d < 0.08) {
        if (errand.phase === 'out') {
          Object.assign(errand, { phase: 'look', until: t + 2.2 })
          shreyas.react('shrug', 1.8)
          say("…I'll get another one", 2.4)
        } else errand.phase = 'none'
      } else {
        const step = Math.min(d, speed * dt)
        me.addScaledVector(to.normalize(), step)
        me.y = M.groundAt(me.x, me.z)
        face = Math.atan2(to.x, to.z)
        running = speed / 3.4
      }
    }
    // Turn smoothly to face where he's going (or back to the camera).
    const turn = Math.atan2(Math.sin(face - shreyas.root.rotation.y), Math.cos(face - shreyas.root.rotation.y))
    shreyas.root.rotation.y += turn * Math.min(1, dt * 10)
    shreyas.stride += (running - shreyas.stride) * Math.min(1, dt * 10)
  }

  // --- the crab ----------------------------------------------------------------------------
  // Clicked (or a cannonball lands by it), it's thrown on its back for a moment.
  function flipCrab(blast = false) {
    if (t - crabState.flipAt < 2.6) return
    crabState.flipAt = t
    if (!blast) {
      snip()
      discover('crab')
    }
  }

  // Cornered by the cursor, it lunges and snaps at it.
  function pinch() {
    crabState.pinchAt = t
    crabState.cornered = 0
    snip()
    window.setTimeout(snip, 220)
    discover('pinch')
    say('careful, he pinches!', 2.5)
  }

  function moveCrab(dt: number) {
    const s = crabState
    const body = crab.userData.body as THREE.Object3D
    const legs = crab.userData.legs as THREE.Object3D[]
    const pincers = crab.userData.pincers as THREE.Object3D[]
    const flipped = t - s.flipAt
    const pinching = t - s.pinchAt
    let speed = 0
    if (flipped > 2.6 && pinching > 0.9 && !still) {
      const p = toScreen(crab.position)
      const near = Math.hypot(p.x - pointer.x, p.y - pointer.y)
      if (near < 130) {
        // Run from the cursor; screen-down is towards us (+z).
        const dir = new THREE.Vector2(Math.sign(p.x - pointer.x) || 1, Math.sign(p.y - pointer.y) * 0.5).normalize()
        const step = 3.2 * dt
        const tries = [dir, new THREE.Vector2(dir.x, 0), new THREE.Vector2(0, dir.y)]
        const ok = tries.find((d) => d.lengthSq() > 0 && onSand(s.x + d.x * step, s.z + d.y * step))
        if (ok) {
          s.x += ok.x * step
          s.z += ok.y * step
          s.cornered = 0
          speed = 1
        } else if ((s.cornered += dt) > 0.5 && near < 90) pinch()
        s.goal.set(s.x, s.z)
        s.nextGoal = t + 1.5
      } else {
        s.cornered = 0
        if (t > s.nextGoal) {
          s.goal.set((Math.random() * 2 - 1) * (CRAB_X - 0.6), THREE.MathUtils.lerp(CRAB_Z[0], CRAB_Z[1], Math.random()))
          if (!onSand(s.goal.x, s.goal.y)) s.goal.set(s.x, s.z)
          s.nextGoal = t + 2 + Math.random() * 3
        }
        const to = new THREE.Vector2(s.goal.x - s.x, s.goal.y - s.z)
        const d = to.length()
        if (d > 0.05) {
          const step = Math.min(d, 1.1 * dt)
          s.x += (to.x / d) * step
          s.z += (to.y / d) * step
          speed = 0.5
        }
      }
    }
    s.phase += dt * 16 * speed
    crab.position.set(s.x, M.groundAt(s.x, s.z) - 0.02, s.z)
    // On its back: up and over, legs waving, then back over.
    const over = flipped < 0.3 ? flipped / 0.3 : flipped < 2.2 ? 1 : Math.max(0, 1 - (flipped - 2.2) / 0.4)
    const roll = smooth(over) * Math.PI
    body.rotation.z = roll
    body.position.y = ((1 - Math.cos(roll)) / 2) * 0.36 + (flipped < 0.3 ? Math.sin(over * Math.PI) * 0.5 : 0)
    // Lunging, it jumps at the cursor and snaps.
    const lunge = pinching < 0.9 ? Math.sin((pinching / 0.9) * Math.PI) : 0
    body.position.z = lunge * 0.25
    legs.forEach((leg, i) => {
      const wiggle = over > 0.5 ? Math.sin(t * 30 + i) * 0.5 : Math.sin(s.phase + i * 1.3) * 0.45 * speed
      leg.rotation.x = wiggle
    })
    const snap = pinching < 0.9 ? Math.abs(Math.sin(pinching * 22)) * 0.7 : 0.15 + Math.sin(t * 2) * 0.1
    for (const pincer of pincers) pincer.rotation.x = -snap
    crab.rotation.y = Math.sin(t * 0.7) * 0.15
  }

  // --- turtles -----------------------------------------------------------------------------
  // At night, every so often, a nest on the beach hatches and the babies
  // scurry for the sea on that side.
  function hatch() {
    nest.side = -nest.side
    const at = new THREE.Vector3(nest.side * 4.8, 0, 7)
    at.y = M.groundAt(at.x, at.z)
    fx.sandBurst(at, 0.6)
    discover('turtles')
    say('baby turtles!', 2.5)
    shreyas.react('point', 2, towards(at))
    for (let i = 0; i < 5; i++) {
      const bornAt = t + 1.6 + i * 0.45
      const egg = M.turtleEgg()
      egg.position.set(at.x + (Math.random() - 0.5) * 0.6, at.y, at.z + (Math.random() - 0.5) * 0.5)
      egg.rotation.y = Math.random() * 6
      scene.add(egg)
      eggs.push({ obj: egg, laidAt: t + i * 0.08, bornAt, phase: Math.random() * 6, fling: new THREE.Vector3((Math.random() - 0.5) * 0.8, 1.6, (Math.random() - 0.5) * 0.8) })
      const obj = M.hatchling()
      obj.position.copy(egg.position)
      obj.visible = false
      scene.add(obj)
      turtles.push({ obj, bornAt, heading: Math.atan2(nest.side, 0.45) + (Math.random() - 0.5) * 0.5, phase: Math.random() * 6, boostUntil: 0 })
    }
  }

  function crackEggs(dt: number) {
    for (const e of [...eggs]) {
      const since = t - e.laidAt
      const age = t - e.bornAt
      const { whole, top, bottom } = e.obj.userData as Record<string, THREE.Object3D>
      const ground = M.groundAt(e.obj.position.x, e.obj.position.z)
      if (age < 0) {
        // Pushed up out of the sand, then rocking harder as the turtle gets ready.
        e.obj.visible = since > 0
        e.obj.position.y = ground - 0.13 * (1 - smooth(THREE.MathUtils.clamp(since / 0.5, 0, 1)))
        const rock = Math.max(0, 1 + age / 1.2)
        e.obj.rotation.z = Math.sin(t * 26 + e.phase) * 0.3 * rock * rock
        continue
      }
      if (whole.visible) {
        whole.visible = false
        top.visible = bottom.visible = true
        e.obj.rotation.z = 0
      }
      // The top's flung off, tumbling, and gone when it lands.
      if (top.visible) {
        e.fling.y -= 7 * dt
        top.position.addScaledVector(e.fling, dt / e.obj.scale.y)
        top.rotation.x += dt * 9
        top.visible = top.position.y > -0.05
      }
      // The empty shell stays a while, then sinks into the sand.
      e.obj.position.y = ground - 0.15 * THREE.MathUtils.clamp((age - 2.5) / 1, 0, 1)
      if (age > 3.5) {
        e.obj.removeFromParent()
        eggs.splice(eggs.indexOf(e), 1)
      }
    }
  }

  function nudgeTurtle(h: Hatchling) {
    h.boostUntil = t + 1.2
    chime()
  }

  function crawl(dt: number) {
    for (const h of [...turtles]) {
      const age = t - h.bornAt
      h.obj.visible = age > 0
      if (age < 0) continue
      const boost = t < h.boostUntil ? 2.6 : 1
      h.phase += dt * 9 * boost
      const step = 0.42 * boost * dt
      h.obj.position.x += Math.sin(h.heading) * step
      h.obj.position.z += Math.cos(h.heading) * step
      const ground = M.groundAt(h.obj.position.x, h.obj.position.z)
      h.obj.position.y = ground + (t < h.boostUntil ? Math.abs(Math.sin(h.phase)) * 0.08 : 0)
      h.obj.rotation.y = h.heading + Math.sin(h.phase) * 0.25
      // Climbing up out of its egg.
      h.obj.scale.setScalar(Math.min(1, age / 0.35))
      for (const f of h.obj.userData.flippers as THREE.Object3D[]) f.rotation.y = Math.sin(h.phase) * 0.6 * f.userData.side
      if (ground > 0) continue
      fx.splash(h.obj.position.x, h.obj.position.z, 0.35)
      h.obj.removeFromParent()
      turtles.splice(turtles.indexOf(h), 1)
    }
  }

  // Clouds: rain, then lightning; a rainbow when the rain stops in daylight.
  type Storm = { until: number; stop: () => void }
  const storms = new Map<Drifter, Storm>()
  const grey = toon('#9ea4b0')
  const white = toon('#fff5e2')
  function clickCloud(c: Drifter) {
    const storm = storms.get(c)
    if (storm) {
      storm.until = Math.max(storm.until, t + 4)
      lightning(c)
      return
    }
    c.obj.traverse((o) => {
      if (o.userData.puff) (o as THREE.Mesh).material = grey
    })
    storms.set(c, { until: t + 10, stop: rainfall() })
    discover('rain')
    if (errand.phase !== 'out' && errand.phase !== 'back') shreyas.react('shelter', 10.5)
    say('ugh, rain', 2.2)
  }

  function rainFrom(c: Drifter) {
    const box = new THREE.Box3().setFromObject(c.obj)
    for (let i = 0; i < 3; i++) {
      const drop = new THREE.Mesh(dropGeo, dropMat)
      drop.position.set(THREE.MathUtils.lerp(box.min.x + 1, box.max.x - 1, Math.random()), box.min.y + 1, THREE.MathUtils.lerp(box.min.z, box.max.z, Math.random()))
      fx.add(drop, (d) => {
        d.position.y -= 1.1
        return d.position.y > 0
      })
    }
  }
  const dropGeo = new THREE.BoxGeometry(0.08, 1.4, 0.08)
  const dropMat = new THREE.MeshBasicMaterial({ color: '#d6e6f2', transparent: true, opacity: 0.8 })

  function endStorm(c: Drifter, storm: Storm) {
    storm.stop()
    storms.delete(c)
    c.obj.traverse((o) => {
      if (o.userData.puff) (o as THREE.Mesh).material = white
    })
    if (night < 0.5) rainbow()
  }

  function lightning(c: Drifter) {
    thunder()
    discover('lightning')
    shreyas.react('shelter', storms.get(c)!.until - t + 0.4)
    say('whoa!', 1.6)
    const box = new THREE.Box3().setFromObject(c.obj)
    const bolt = new THREE.Group()
    let p = new THREE.Vector3(THREE.MathUtils.lerp(box.min.x + 2, box.max.x - 2, Math.random()), box.min.y + 1, (box.min.z + box.max.z) / 2)
    const seg = new THREE.CylinderGeometry(0.35, 0.35, 1, 5)
    const mat = new THREE.MeshBasicMaterial({ color: '#fff6b0', fog: false })
    while (p.y > 0) {
      const next = p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 5, -(3 + Math.random() * 3), 0))
      next.y = Math.max(0, next.y)
      const s = inked(seg, mat, 3)
      s.castShadow = false
      s.position.copy(p).add(next).multiplyScalar(0.5)
      s.scale.y = p.distanceTo(next)
      s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), next.clone().sub(p).normalize())
      bolt.add(s)
      p = next
    }
    // On, off, on again, then gone.
    fx.add(bolt, (b, age) => {
      b.visible = age < 4 || (age > 6 && age < 14)
      return age < 18
    })
    fx.splash(p.x, p.z, 2)
    if (!still) flash(0.6)
  }

  let rainbowAt = -100
  const rainbowArcs = new THREE.Group()
  ;['#e5483b', '#f59a3a', '#f7d64a', '#5fbf6a', '#4a8fd6', '#7a5cc4'].forEach((color, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(150 - i * 4.2, 2.2, 4, 64, Math.PI),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, fog: false, depthWrite: false }),
    )
    rainbowArcs.add(arc)
  })
  rainbowArcs.position.set(10, -6, -330)
  rainbowArcs.visible = false
  scene.add(rainbowArcs)
  function rainbow() {
    if (t - rainbowAt < 10) return
    rainbowAt = t
    discover('rainbow')
    say('ooh, a rainbow', 2.6)
    shreyas.react('point', 2.4, towards(rainbowArcs.localToWorld(new THREE.Vector3(0, 150, 0))))
  }

  // Wishing on the shooting star: sparkles, then a meteor shower.
  const starState = { visible: false }
  let wishAt = -100
  function makeWish() {
    if (t - wishAt < 4) return
    wishAt = t
    chime()
    discover('wish')
    say('made a wish ✨', 2.6)
    const head = shootingStar.getWorldPosition(new THREE.Vector3())
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      fx.sparkle(head, new THREE.Vector3(Math.cos(a), Math.sin(a), 0).applyQuaternion(camera.quaternion), camera, 6)
    }
    if (still) return
    for (let i = 0; i < 18; i++) window.setTimeout(meteor, 300 + i * 160 + Math.random() * 120)
  }
  function meteor() {
    const m = new THREE.Mesh(shootingStar.geometry, new THREE.MeshBasicMaterial({ color: '#fff8dc', transparent: true, fog: false, depthWrite: false }))
    const start = new THREE.Vector3(-60 + Math.random() * 260, 40 + Math.random() * 45, -420)
    m.scale.set(18 + Math.random() * 20, 0.5, 1)
    m.rotation.z = STAR_FALL
    fx.add(m, (s, age) => {
      s.position.copy(start).add(new THREE.Vector3(-age * 4.5, -age * 4.5 * Math.tan(STAR_FALL), 0))
      ;(s.material as THREE.MeshBasicMaterial).opacity = Math.min(1, age / 4, (36 - age) / 10)
      return age < 36
    })
  }

  // --- the frame loop --------------------------------------------------------------------
  const sea0 = new THREE.Color()
  const sea1 = new THREE.Color()
  const mix = (a: string, b: string, k: number) => sea0.set(a).lerp(sea1.set(b), k).clone()
  const face = new THREE.Vector3()
  const hair = new THREE.Vector3()
  let start: number | undefined
  let last = 0
  let raf = 0
  let wasDeep = false

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick)
    start ??= now
    t = (now - start) / 1000
    const dt = Math.min(0.05, t - last)
    last = t
    // Ambient motion stops when reduced motion is asked for.
    const at = still ? 24 : t
    resize()
    chatter()

    // Day and night ease into each other over a second or two.
    night += ((isNight() ? 1 : 0) - night) * (1 - Math.exp(-dt * 2.5))
    skyUniforms.top.value.copy(mix(DAY.top, NIGHT.top, night))
    skyUniforms.low.value.copy(mix(DAY.low, NIGHT.low, night))
    ;(scene.fog as THREE.Fog).color.copy(skyUniforms.low.value)
    seaMat.color.copy(mix(DAY.sea, NIGHT.sea, night))
    underMat.color.copy(mix(DAY.under, NIGHT.under, night))
    hemi.color.copy(mix(DAY.hemi, NIGHT.hemi, night))
    hemi.groundColor.copy(mix(DAY.ground, NIGHT.ground, night))
    hemi.intensity = THREE.MathUtils.lerp(DAY.ambient, NIGHT.ambient, night)
    light.color.copy(mix(DAY.sun, NIGHT.sun, night))
    light.intensity = THREE.MathUtils.lerp(DAY.light, NIGHT.light, night)
    fill.color.copy(light.color)
    fill.intensity = THREE.MathUtils.lerp(DAY.fill, NIGHT.fill, night)
    sun.position.y = 22 - night * 60
    moon.position.y = -30 + night * 72
    sun.visible = night < 0.98
    aimLight(night)
    moon.visible = night > 0.02
    ;(stars.material as THREE.PointsMaterial).opacity = night

    // The sea's swell (while it's in sight), and the foam breathing round the island.
    const depth = sink()
    if (depth < 30) {
      const pos = seaGeo.attributes.position
      for (let i = 0; i < pos.count; i++) pos.setY(i, waveAt(seaBase[i * 3], seaBase[i * 3 + 2], at))
      pos.needsUpdate = true
    }
    foam.visible = camera.position.y > 0
    shore.visible = camera.position.y > 0
    // The sky, and what's in it, can't be seen from deep under the water.
    const deep = camera.position.y < -3
    if (deep !== wasDeep) {
      wasDeep = deep
      for (const o of [sun, moon, stars, shootingStar, rainbowArcs, plane, ...gulls, ...clouds.map((c) => c.obj)]) o.traverse((c) => c.layers.set(deep ? 2 : 0))
    }
    foam.scale.setScalar(1 + Math.sin(at * 1.2) * 0.012)
    ;(foam.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(at * 1.2) * 0.15

    // Palms sway; the camera's light blinks.
    palms.forEach((p, i) => {
      p.crown.rotation.z = Math.sin(at * 1.15 + i) * 0.05
      p.crown.rotation.x = Math.sin(at * 0.9 + i * 2) * 0.03
    })
    ;(tripod.userData.light as THREE.Mesh).visible = at % 1.4 < 0.7

    // Clouds drift across; raining ones rain.
    for (const c of clouds) {
      const span = offscreen(c.z, 25)
      const k = (((at + c.delay) / c.dur) % 1 + 1) % 1
      c.obj.position.set(-span + k * span * 2, c.y, c.z)
      const storm = storms.get(c)
      if (storm) {
        if (t < storm.until) rainFrom(c)
        else endStorm(c, storm)
      }
    }
    if (rainbowAt > 0) {
      const age = t - rainbowAt
      rainbowArcs.visible = age < 9
      for (const arc of rainbowArcs.children) ((arc as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.5 * Math.min(1, age / 1.5, Math.max(0, (9 - age) / 2)) * (1 - night)
    }

    // The plane crosses the sky in the last part of each minute.
    {
      const k = ((at + 36) / 60) % 1
      const f = (k - 0.8) / 0.2
      const span = offscreen(-90, 15)
      plane.position.set(-span + f * span * 2, 18 + f * 2 + Math.sin(at * 2.8) * 0.3, -90)
      plane.rotation.set(Math.sin(at * 2) * 0.06, 0, 0.04)
      plane.getObjectByName('prop')!.rotation.x += 0.9
      // Shot down, it's gone until its next pass.
      plane.visible = f > 0 && f < 1 && t - flight.crashedAt > 15
    }

    // Gulls glide past together, flapping.
    gulls.forEach((g, i) => {
      const state = gullState[i]
      const wings = g.userData.wings as THREE.Object3D[]
      const flap = Math.sin(at * 7 + i) * 0.5
      wings[0].rotation.x = flap
      wings[1].rotation.x = -flap
      if (state.goneUntil > 0) {
        if (t < state.goneUntil) return
        state.goneUntil = 0
        g.visible = true
      }
      const k = ((at + 4 + state.offset) / 38) % 1
      const span = offscreen(-35, 8)
      g.position.set(-span + k * span * 2 + i * 1.2, 9 + k * 2 + i * 0.6 + Math.sin(at * 1.3 + i) * 0.3, -35 - i * 2)
      g.rotation.set(0, 0, Math.sin(at * 1.3 + i) * 0.1)
    })

    // The pirate ship sails past every hundred seconds, rocking on the swell.
    {
      const cycle = Math.floor((at + 38) / 100)
      const k = ((at + 38) / 100) % 1
      const f = (k - 0.45) / 0.55
      const span = offscreen(-70, 20)
      const sailing = f > 0 && f < 1
      // Repaired once it's out of sight.
      if (!sailing && (voyage.hits || voyage.sinking >= 0) && voyage.sunkCycle !== cycle) {
        for (const h of voyage.holes) ship.remove(h)
        voyage.holes = []
        voyage.hits = 0
        voyage.sinking = -1
      }
      const x = -span + f * span * 2
      const listed = voyage.hits * 0.05 + 0.12 * Math.exp(-(t - lurchAt) * 3) * Math.sin((t - lurchAt) * 14)
      let sink = 0
      let roll = 0
      if (voyage.sinking >= 0 && t > voyage.sinking) {
        const s = Math.min(1, (t - voyage.sinking) / 4)
        sink = s * s * 9
        roll = s * s * 0.5
        voyage.sunkCycle = cycle
        if (s < 1 && Math.random() < 0.4) fx.bubble(ship.position.x + (Math.random() - 0.5) * 8, ship.position.z + 1.5)
      }
      ship.visible = sailing && sink < 9
      // Stays where it was hit while it goes down.
      if (voyage.sinking < 0) ship.position.x = x
      ship.position.set(ship.position.x, waveAt(ship.position.x, -70, at) - 0.2 - voyage.hits * 0.12 - sink, -70)
      ship.rotation.set(listed + roll, 0, Math.sin(at * 1.6) * 0.04)
      ;(ship.userData.flag as THREE.Mesh).rotation.y = Math.sin(at * 5) * 0.25
    }

    // The shooting star, at night.
    {
      const k = (at % 11) / 11
      const f = (k - 0.02) / 0.2
      starState.visible = night > 0.5 && f > 0 && f < 1
      const m = shootingStar.material as THREE.MeshBasicMaterial
      m.opacity = starState.visible ? night * Math.min(1, f * 4, (1 - f) * 4) : 0
      shootingStar.position.set(150 - f * 200, 72 - f * 200 * Math.tan(STAR_FALL), -400)
      shootingStar.rotation.z = STAR_FALL
    }

    // The chest: bobbing in, washing up, opened, then sinking into the sand.
    if (treasure.phase !== 'none') {
      const age = t - treasure.at
      if (treasure.phase === 'float') {
        const k = THREE.MathUtils.smootherstep(Math.min(1, age / 11), 0, 1)
        const a = treasure.from
        const b = treasure.via
        const c = treasure.to
        chest.position.set(
          (1 - k) ** 2 * a.x + 2 * (1 - k) * k * b.x + k * k * c.x,
          waveAt(chest.position.x, chest.position.z, at) - 0.15,
          (1 - k) ** 2 * a.z + 2 * (1 - k) * k * b.z + k * k * c.z,
        )
        chest.rotation.set(Math.sin(at * 1.7) * 0.12, at * 0.2, Math.sin(at * 1.3) * 0.1)
        if (k >= 1) Object.assign(treasure, { phase: 'beach', at: t })
      } else if (treasure.phase === 'beach') {
        // Pushed up the sand by a wave.
        const k = THREE.MathUtils.smoothstep(age / 1.4, 0, 1)
        const x = THREE.MathUtils.lerp(treasure.to.x, treasure.side * 5.6, k)
        const z = THREE.MathUtils.lerp(treasure.to.z, 6.5, k)
        chest.position.set(x, Math.max(M.groundAt(x, z), waveAt(x, z, at) - 0.15), z)
        chest.rotation.set(chest.rotation.x * 0.9, THREE.MathUtils.lerp(chest.rotation.y % (Math.PI * 2), -treasure.side * 0.5, k), chest.rotation.z * 0.9)
        if (k >= 1) {
          treasure.phase = 'beached'
          say('ooh, treasure!', 2.6)
          shreyas.react('point', 2.2, towards(chest.position))
        }
      } else if (treasure.phase === 'open') {
        ;(chest.userData.lid as THREE.Object3D).rotation.x = -1.9 * THREE.MathUtils.smoothstep(age / 0.5, 0, 1)
        if (age > 8) chest.position.y = M.groundAt(chest.position.x, chest.position.z) - (age - 8) * 0.6
        if (age > 9.5) {
          chest.visible = false
          treasure.phase = 'none'
        }
      }
      // A glint now and then, so it's noticed.
      if (treasure.phase !== 'open' && t - treasure.glint > 1.6) {
        treasure.glint = t
        fx.sparkle(chest.localToWorld(new THREE.Vector3(0.3, 0.75, 0.3)), new THREE.Vector3(0, 0.02, 0), camera, treasure.phase === 'float' ? 1.2 : 0.4)
      }
    }

    // The crab, the turtles, Shreyas's errands and the sand.
    moveCrab(dt)
    if (night > 0.9 && !still && depth < 3) {
      if (nest.nextAt < 0) nest.nextAt = t + 8
      if (t > nest.nextAt && turtles.length === 0) {
        hatch()
        nest.nextAt = t + 35
      }
    } else if (night < 0.5) nest.nextAt = -1
    crackEggs(dt)
    crawl(dt)
    runErrand(dt)
    marks.step()

    // Shreyas: eyes and head follow the cursor.
    const head = toScreen(shreyas.faceAt(face))
    const top = toScreen(shreyas.topAt(hair))
    onHead(head.x + window.scrollX, head.y + window.scrollY, head.y - top.y)
    const dx = pointer.x - head.x
    const dy = pointer.y - head.y
    const len = Math.hypot(dx, dy) || 1
    const reach = Math.min(1, len / 380)
    gaze.x += ((dx / len) * reach - gaze.x) * 0.12
    gaze.y += ((dy / len) * reach - gaze.y) * 0.12
    gaze.near = Math.max(0, Math.min(1, 1 - len / 90))
    // Lean into fast scrolling, then settle back.
    const velocity = dt > 0 ? (window.scrollY - lastScroll) / window.innerHeight / dt : 0
    lastScroll = window.scrollY
    lean += (Math.max(-7, Math.min(7, velocity * 5)) - lean) * 0.08
    shreyas.update(t, gaze, lean, still)

    // The camera drifts a little with the cursor.
    if (!still) {
      eased.x += ((pointer.x / window.innerWidth - 0.5) - eased.x) * 0.04
      eased.y += ((pointer.y / window.innerHeight - 0.5) - eased.y) * 0.04
    }
    camera.position.set(CAMERA.x + eased.x * 2.2, CAMERA.y - eased.y * 0.8 - depth, CAMERA.z)
    camera.lookAt(TARGET.x, TARGET.y - depth, TARGET.z)
    camera.updateMatrixWorld()
    // Which way, level with the sea, the sun shines from, as the view sees it.
    seaShimmer.shimmer.value = 0.6 * (1 - night)
    seaShimmer.seaTime.value = at
    seaShimmer.sunDir.value.copy(light.position).sub(light.target.position).setY(0).normalize().transformDirection(camera.matrixWorldInverse)

    // The ocean, and the water's colour from the surface down.
    view.w = size.w
    view.h = size.h
    view.s = frame.s
    view.night = night
    // Where the block being read is, which the sea creatures make way for (ocean.ts).
    view.reading = document.querySelector('.reading-card.shown')?.getBoundingClientRect() ?? null
    ocean.update(t, dt, view)
    setWater(
      WATER_DEPTHS.map((d) => view.y(depthPx(d), 0)),
      night,
      camera,
    )

    fx.step()
    camera.layers.set(0)
    renderer.render(scene, camera)
    camera.layers.set(FRONT)
    overlay.render(scene, camera)
    camera.layers.set(0)
    if (!ready) {
      ready = true
      onReady()
    }
  }
  let ready = false

  raf = requestAnimationFrame(tick)

  return {
    click,
    over: (x, y) => ocean.over(x, y) || !!pick(x, y),
    dispose() {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointermove', drag)
      window.removeEventListener('pointerup', lift)
      window.removeEventListener('pointercancel', lift)
      for (const s of storms.values()) s.stop()
      ocean.dispose()
      renderer.dispose()
      overlay.dispose()
    },
  }
}

// A soft round glow behind the sun or moon, always facing the camera.
function glow(color: string, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const c = canvas.getContext('2d')!
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, color)
  g.addColorStop(0.35, `${color}88`)
  g.addColorStop(1, `${color}00`)
  c.fillStyle = g
  c.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, fog: false, depthWrite: false, transparent: true, opacity: 0.6 }))
  sprite.scale.setScalar(size)
  sprite.position.z = -1
  return sprite
}
