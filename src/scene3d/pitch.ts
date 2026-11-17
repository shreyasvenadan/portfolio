// The football page's scene: Shreyas in his club kit doing keepy-uppies on a
// pitch at golden hour, in the island's cel-shaded, ink-outlined style.
// Click him or the ball (or call shoot()) and he turns and strikes it into
// the goal behind him, then celebrates; a new ball drops in and he starts
// again. After dark (night mode) the floodlights are on.
//
// On wide screens he stands on the left with the page's text on the right;
// on narrow ones he's at the top and the text scrolls up over the scene.
import * as THREE from 'three'
import { Character, KICK_CONTACT, TAP } from './character'
import { cloud, football } from './models'
import { inked, outlineUniforms, plain, seeded, toon } from './toon'

const DAY = { top: '#f0a865', low: '#fbe2b4', hemi: '#fff2dc', ground: '#6f8f4a', sun: '#ffe2b0', light: 1.5, ambient: 1.3 }
const NIGHT = { top: '#141b40', low: '#3d4a86', hemi: '#8a96d0', ground: '#2a3a3a', sun: '#e8ecff', light: 1.1, ambient: 0.8 }

const BALL = 0.22
// The goal, behind him and a little to the left, facing him.
const GOAL = new THREE.Vector3(-1.6, 0, -9)
const GOAL_W = 5.4
const GOAL_H = 2.1
const GOAL_D = 1.6
// One keepy-uppy, foot to foot, in seconds.
const JUGGLE = 0.78

export type PitchStats = { juggles: number; goals: number }
export type Pitch = { shoot(): void; dispose(): void }


export function createPitch(
  canvas: HTMLCanvasElement,
  { still, night, onStats, onReady }: { still: boolean; night: boolean; onStats?: (s: PitchStats) => void; onReady?: () => void },
): Pitch {
  const look = night ? NIGHT : DAY
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(look.low, 40, 110)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 1200)
  const rand = seeded(7)

  // --- sky
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: { top: { value: new THREE.Color(look.top) }, low: { value: new THREE.Color(look.low) } },
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 low;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y * 3.2, 0.0, 1.0);
            gl_FragColor = vec4(mix(low, top, pow(h, 0.8)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    ),
  )
  // A low sun (or moon) behind, over the far trees.
  const disc = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshBasicMaterial({ color: night ? '#eef0ff' : '#ffe08a', fog: false }))
  disc.position.set(-30, 14, -120)
  scene.add(disc)
  for (const [x, y, z, s, seed] of [
    [-26, 15, -90, 2.4, 1],
    [18, 19, -100, 3, 2],
    [44, 12, -110, 2.6, 3],
  ]) {
    const c = cloud(seed)
    c.position.set(x, y, z)
    c.scale.setScalar(s)
    scene.add(c)
  }

  // --- light: warm and low from behind-left, so shadows fall towards us
  scene.add(new THREE.HemisphereLight(look.hemi, look.ground, look.ambient))
  const sun = new THREE.DirectionalLight(look.sun, look.light)
  sun.position.set(night ? 2 : -8, night ? 16 : 9, night ? 6 : -10)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 60 })
  scene.add(sun)

  // --- the pitch: mown stripes, white lines
  const stripes = document.createElement('canvas')
  stripes.width = 2
  stripes.height = 16
  const sctx = stripes.getContext('2d')!
  for (let i = 0; i < 16; i++) {
    sctx.fillStyle = (i >> 1) % 2 ? '#6fae4f' : '#7cbd59'
    sctx.fillRect(0, i, 2, 1)
  }
  const grassMap = new THREE.CanvasTexture(stripes)
  grassMap.magFilter = THREE.NearestFilter
  grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping
  grassMap.repeat.set(1, 10)
  grassMap.colorSpace = THREE.SRGBColorSpace
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(160, 160).rotateX(-Math.PI / 2), toon('#ffffff', { map: grassMap }))
  grass.receiveShadow = true
  scene.add(grass)

  const lineMat = new THREE.MeshBasicMaterial({ color: '#f6f2ea' })
  const line = (x: number, z: number, w: number, d: number) => {
    const m = plain(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), lineMat)
    m.position.set(x, 0.01, z)
    scene.add(m)
  }
  // The goal line, the six-yard and the eighteen-yard boxes, the penalty spot.
  line(GOAL.x, GOAL.z, 60, 0.12)
  for (const [w, d] of [
    [GOAL_W + 4, 2.4],
    [GOAL_W + 13, 7.5],
  ]) {
    line(GOAL.x - w / 2, GOAL.z + d / 2, 0.12, d)
    line(GOAL.x + w / 2, GOAL.z + d / 2, 0.12, d)
    line(GOAL.x, GOAL.z + d, w, 0.12)
  }
  const spot = plain(new THREE.CircleGeometry(0.14, 12).rotateX(-Math.PI / 2), lineMat)
  spot.position.set(GOAL.x, 0.01, GOAL.z + 5)
  scene.add(spot)
  // The D at the top of the box.
  const arc = plain(new THREE.RingGeometry(3.6, 3.72, 40, 1, Math.PI * 0.22, Math.PI * 0.56).rotateX(-Math.PI / 2), lineMat)
  arc.position.set(GOAL.x, 0.01, GOAL.z + 5)
  arc.rotation.y = Math.PI
  scene.add(arc)

  // --- the goal: white posts and a net that bulges when it's hit
  const goal = new THREE.Group()
  goal.position.copy(GOAL)
  scene.add(goal)
  const white = toon('#f6f2ea')
  const post = (a: THREE.Vector3, b: THREE.Vector3, r = 0.08) => {
    const len = a.distanceTo(b)
    const m = inked(new THREE.CylinderGeometry(r, r, len, 10), white, 2.5)
    m.position.copy(a).add(b).multiplyScalar(0.5)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    goal.add(m)
  }
  const hw = GOAL_W / 2
  post(new THREE.Vector3(-hw, 0, 0), new THREE.Vector3(-hw, GOAL_H, 0))
  post(new THREE.Vector3(hw, 0, 0), new THREE.Vector3(hw, GOAL_H, 0))
  post(new THREE.Vector3(-hw - 0.08, GOAL_H, 0), new THREE.Vector3(hw + 0.08, GOAL_H, 0))
  for (const x of [-hw, hw]) post(new THREE.Vector3(x, GOAL_H, 0), new THREE.Vector3(x, 0, -GOAL_D), 0.035)
  post(new THREE.Vector3(-hw, 0.02, -GOAL_D), new THREE.Vector3(hw, 0.02, -GOAL_D), 0.035)
  // The net: grids over the back and the sides.
  const netMat = new THREE.LineBasicMaterial({ color: '#fbf7ee', transparent: true, opacity: 0.75 })
  const grid = (w: number, h: number, step: number) => {
    const pts: number[] = []
    for (let x = 0; x <= w + 1e-6; x += step) pts.push(x, 0, 0, x, h, 0)
    for (let y = 0; y <= h + 1e-6; y += step) pts.push(0, y, 0, w, y, 0)
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  }
  // The back of the net slopes from the crossbar down to the ground behind;
  // it's in a group pivoting on the crossbar, so it can bulge back.
  const back = new THREE.Group()
  back.position.y = GOAL_H
  goal.add(back)
  const slope = new THREE.LineSegments(grid(GOAL_W, Math.hypot(GOAL_H, GOAL_D), 0.3), netMat)
  slope.position.x = -hw
  slope.rotation.x = Math.atan2(-GOAL_D, -GOAL_H)
  back.add(slope)
  for (const side of [-1, 1]) {
    const pts: number[] = []
    for (let z = 0; z <= GOAL_D + 1e-6; z += 0.3) {
      const top = GOAL_H * (1 - z / GOAL_D)
      pts.push(0, 0, -z, 0, top, -z)
    }
    for (let y = 0; y <= GOAL_H + 1e-6; y += 0.3) pts.push(0, y, 0, 0, y, -GOAL_D * (1 - y / GOAL_H))
    const sideNet = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), netMat)
    sideNet.position.x = side * hw
    goal.add(sideNet)
  }

  // --- round the pitch: cones, a corner flag, floodlights, trees
  const cone = new THREE.ConeGeometry(0.22, 0.5, 10)
  for (const [x, z] of [
    [3.6, -1.5],
    [4.4, -3.2],
    [5.2, -4.9],
    [6, -6.6],
  ]) {
    const c = inked(cone, toon('#ff8a3d'), 2)
    c.position.set(x, 0.25, z)
    scene.add(c)
  }
  const flag = new THREE.Group()
  const pole = inked(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6), toon('#f6f2ea'), 1.5)
  pole.position.y = 0.8
  const cloth = new THREE.Shape()
  cloth.moveTo(0, 0)
  cloth.lineTo(0.55, -0.15)
  cloth.lineTo(0, -0.38)
  const flagCloth = inked(new THREE.ExtrudeGeometry(cloth, { depth: 0.02, bevelEnabled: false }), toon('#d8343a', { side: THREE.DoubleSide }), 1.5)
  flagCloth.position.y = 1.58
  flag.add(pole, flagCloth)
  flag.position.set(GOAL.x + 26, 0, GOAL.z)
  scene.add(flag)

  const lamps: THREE.Mesh[] = []
  for (const [x, z] of [
    [-22, -26],
    [24, -30],
  ]) {
    const tower = new THREE.Group()
    const mast = inked(new THREE.CylinderGeometry(0.22, 0.32, 16, 8), toon('#4a4f5c'), 2)
    mast.position.y = 8
    const head = inked(new THREE.BoxGeometry(3, 1.6, 0.4), toon('#3a3f4a'), 2)
    head.position.set(0, 16.4, 0.2)
    tower.add(mast, head)
    for (let i = 0; i < 6; i++) {
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), new THREE.MeshBasicMaterial({ color: night ? '#fff8d8' : '#c9ccd4', fog: false }))
      lamp.position.set(-1 + (i % 3), 16.05 + Math.floor(i / 3) * 0.7, 0.42)
      tower.add(lamp)
      lamps.push(lamp)
    }
    tower.position.set(x, 0, z)
    tower.lookAt(0, 0, 0)
    scene.add(tower)
  }
  const leaf = new THREE.IcosahedronGeometry(1, 0)
  for (let i = 0; i < 28; i++) {
    const x = -60 + i * 4.4 + (rand() - 0.5) * 2
    const s = 1.6 + rand() * 1.6
    const tree = inked(leaf, toon(rand() < 0.5 ? '#3f7a3a' : '#4d8a43'), 2)
    tree.position.set(x, s * 0.9, -44 - rand() * 6)
    tree.scale.set(s, s * 1.2, s)
    tree.rotation.y = rand() * 3
    scene.add(tree)
  }

  // --- him, and the ball
  const me = new Character({ kit: true })
  scene.add(me.root)
  me.focus = 1
  const ball = football(BALL)
  scene.add(ball)

  // --- framing: him on the left (or at the top), the text beside (or below)
  let size = { w: 0, h: 0 }
  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === size.w && h === size.h)) return
    size = { w, h }
    renderer.setSize(w, h, false)
    outlineUniforms.resolution.value.set(w, h)
    const wide = w >= 768
    // He's drawn as if in the middle of a bigger frame, of which we see the
    // part that puts him `fx` across and `fy` down the window.
    const fx = wide ? 0.21 : 0.5
    const fy = wide ? 0.54 : 0.3
    const fullW = 2 * w * (1 - fx)
    const fullH = 2 * h * (1 - fy)
    camera.aspect = fullW / fullH
    camera.setViewOffset(fullW, fullH, fullW - w, fullH - h, w, h)
    camera.position.set(0, wide ? 3.4 : 4.6, wide ? 17 : 29)
    camera.lookAt(0, 1.6, 0)
    camera.updateProjectionMatrix()
  }
  resize()

  // --- what the ball is doing
  type Flight = { from: THREE.Vector3; to: THREE.Vector3; at: number; dur: number; arc: number }
  type State = { kind: 'juggle'; foot: 0 | 1; next: 0 | 1; tapped: boolean } | { kind: 'shot'; struck: boolean; kicked: boolean } | { kind: 'goal'; at: number } | { kind: 'drop' }
  let state: State = { kind: 'juggle', foot: 0, next: 1, tapped: false }
  let flight: Flight
  let t = 0
  const stats: PitchStats = { juggles: 0, goals: 0 }
  const tell = () => onStats?.({ ...stats })
  // Where a foot meets the ball, in his frame: in front and up a little.
  const footAt = (foot: 0 | 1) => new THREE.Vector3(foot ? 0.21 : -0.21, 0.72, 0.88)
  const fly = (from: THREE.Vector3, to: THREE.Vector3, dur: number, arc: number) => (flight = { from, to, at: t, dur, arc })
  const heights = [1.2, 1.5, 1.1, 1.8, 1.3]
  const juggle = (foot: 0 | 1, next: 0 | 1) => {
    state = { kind: 'juggle', foot, next, tapped: false }
    fly(me.root.localToWorld(footAt(foot)), me.root.localToWorld(footAt(next)), JUGGLE, heights[stats.juggles % heights.length])
  }
  // He faces a little to the right of the camera while juggling.
  const REST_YAW = 0.25
  let yaw = REST_YAW
  let yawTo = REST_YAW
  me.root.rotation.y = yaw
  me.root.updateMatrixWorld()
  juggle(0, 1)

  function shoot() {
    if (still || state.kind !== 'juggle') return
    // He turns to the goal while the ball drops to his striking foot.
    const toGoal = GOAL.clone().sub(me.root.position)
    yawTo = Math.atan2(toGoal.x, toGoal.z)
    const turned = new THREE.Object3D()
    turned.rotation.y = yawTo
    turned.updateMatrixWorld()
    const strike = turned.localToWorld(new THREE.Vector3(-0.21, BALL + 0.05, 0.75))
    state = { kind: 'shot', struck: false, kicked: false }
    fly(ball.position.clone(), strike, 0.55, 0.5)
  }

  // --- pointing at him or the ball, and clicking
  const ray = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const gaze = { x: 0, y: 0, near: 0 }
  const pick = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(mouse, camera)
    return ray.intersectObjects([ball, me.hitTarget()], true).length > 0
  }
  const onMove = (e: PointerEvent) => {
    canvas.style.cursor = !still && state.kind === 'juggle' && pick(e) ? 'var(--cursor-pointer)' : ''
  }
  const onClick = (e: PointerEvent) => pick(e) && shoot()
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('click', onClick as (e: Event) => void)

  // --- the loop
  const local = new THREE.Vector3()
  let last = performance.now()
  let raf = 0
  function tick(now: number) {
    resize()
    const dt = still ? 0 : THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05)
    last = now
    t += dt

    // Turning, gently.
    yaw += (yawTo - yaw) * Math.min(1, dt * 8)
    me.root.rotation.y = yaw
    me.root.updateMatrixWorld()

    // How far along the current flight the ball is. (Worked out again
    // below, after any of these hands it on to a new flight.)
    let u = Math.min(1, (t - flight.at) / flight.dur)
    if (state.kind === 'juggle') {
      // Flick the foot so it meets the ball as it comes down.
      if (!state.tapped && t >= flight.at + flight.dur - TAP / 2) {
        me.tap(state.next)
        state.tapped = true
      }
      if (u >= 1) {
        stats.juggles++
        tell()
        // Mostly foot to foot, now and then the same foot twice.
        const next: 0 | 1 = rand() < 0.75 ? (state.next ? 0 : 1) : state.next
        juggle(state.next, next)
      }
    } else if (state.kind === 'shot' && !state.kicked && !state.struck && t >= flight.at + flight.dur - KICK_CONTACT) {
      // Swing, on the scene's clock, so foot and ball meet even if frames drop.
      me.kick()
      state.kicked = true
    } else if (state.kind === 'shot' && u >= 1) {
      if (!state.struck) {
        // Struck: off to a corner of the net.
        state.struck = true
        const aim = GOAL.clone().add(new THREE.Vector3((rand() - 0.5) * (GOAL_W - 1.2), 0.45 + rand() * (GOAL_H - 1), -0.35))
        fly(ball.position.clone(), aim, 0.6, 0.6)
      } else {
        stats.goals++
        stats.juggles = 0
        tell()
        state = { kind: 'goal', at: t }
        me.react('cheer', 2.4)
        // It drops to the bottom of the net.
        fly(ball.position.clone(), new THREE.Vector3(ball.position.x, BALL, GOAL.z - GOAL_D + 0.35), 0.5, 0)
      }
    } else if (state.kind === 'goal') {
      if (t - state.at > 0.6) yawTo = REST_YAW
      if (t - state.at > 2.6) {
        // A new ball, dropped in from above onto his foot.
        state = { kind: 'drop' }
        fly(new THREE.Vector3(2.5, 9, 1.5), me.root.localToWorld(footAt(0)), 0.9, 0)
      }
    } else if (state.kind === 'drop' && u >= 1) juggle(0, 1)

    // The net bulges out as the ball hits it.
    const hit = state.kind === 'goal' ? t - state.at : 10
    back.scale.z = 1 + Math.sin(Math.min(1, hit / 0.5) * Math.PI) * 0.4

    // The ball along its flight, spinning.
    u = Math.min(1, (t - flight.at) / flight.dur)
    ball.position.lerpVectors(flight.from, flight.to, state.kind === 'drop' ? u * u : u)
    ball.position.y += 4 * flight.arc * u * (1 - u)
    if (state.kind === 'shot' || state.kind === 'drop') ball.position.y = Math.max(BALL, ball.position.y)
    ball.rotation.x -= dt * (state.kind === 'shot' ? 14 : 5)
    ball.rotation.z += dt * 1.5

    // He watches the ball.
    local.copy(ball.position)
    me.root.worldToLocal(local)
    gaze.x = THREE.MathUtils.clamp(local.x / 2, -1, 1)
    gaze.y = THREE.MathUtils.clamp((3.1 - local.y) / 2.4, -0.6, 1)
    if (state.kind === 'goal') gaze.y = -0.2
    me.update(t, gaze, 0, still)

    renderer.render(scene, camera)
    if (onReady) {
      onReady()
      onReady = undefined
    }
    if (!still) raf = requestAnimationFrame(tick)
  }

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
    shoot,
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('click', onClick as (e: Event) => void)
      renderer.dispose()
    },
  }
}
