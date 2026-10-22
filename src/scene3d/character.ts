// Shreyas in 3D: curly black hair, a long-sleeve blue button-up, black jeans
// and black shoes. Stands with his feet at the origin, facing +z (the camera).
// Every few seconds he waves, looks around, shrugs or laughs; his eyes and
// head follow the cursor, and clicking him makes him jump. He reacts to what
// happens round him (react()), and can run about (stride, set by world.ts).
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { INK, inked, seeded, toon } from './toon'

const SKIN = '#c98652'
const HAIR = '#1b120d'
const HAIR_LIGHT = '#33231a'
const TOP = '#2f62a3'
const TOP_DARK = '#234c80'
const JEANS = '#24242a'
const SHOE = '#1d1d22'
const SHOE_TRIM = '#b7392f'
const MOUTH = '#6e211d'

type Action = 'wave' | 'look' | 'shrug' | 'laugh'
const ACTIONS: Action[] = ['wave', 'look', 'shrug', 'laugh']
const DURATION: Record<Action | 'jump', number> = { wave: 2.8, look: 3, shrug: 2, laugh: 2.2, jump: 0.95 }
const ACTION_GAP = 6.5

// Things he does in response to what happens on the island:
//   cheer    arms up, hopping       point    an arm out at something
//   duck     crouched, arms up      shelter  under an umbrella
//   shrug    as when idle
export type Reaction = 'cheer' | 'point' | 'duck' | 'shelter' | 'shrug'

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const smooth = (x: number) => x * x * (3 - 2 * x)
// 0 → 1 → 0 over an action, easing in and out over the first/last 20%.
const envelope = (x: number) => (x <= 0 || x >= 1 ? 0 : smooth(clamp(Math.min(x, 1 - x) / 0.2, 0, 1)))
const rad = THREE.MathUtils.degToRad

function blinkAt(t: number) {
  const cycle = Math.floor(t / 4.3)
  const phase = t % 4.3
  const one = (p: number) => (p > 0 && p < 0.14 ? Math.sin((p / 0.14) * Math.PI) : 0)
  // Every third blink is a quick double blink.
  return Math.max(one(phase), cycle % 3 === 0 ? one(phase - 0.24) : 0)
}

export type Gaze = { x: number; y: number; near: number }

// His head, facing +z with its base (the neck) at y = 0: skull with a jaw,
// ears, nose, eyes, brows and curly hair, but no mouth (the island character
// smiles; the diver has a regulator in). `faceZ` is how far forward the face
// comes at (x, y), for putting things on it.
export function buildHead(skin = toon(SKIN)) {
  const head = new THREE.Group()
  const hair = new THREE.Group()
  const brows = new THREE.Group()
  const eyes: THREE.Group[] = []
  const pupils: THREE.Group[] = []
  // Skull: a sphere whose lower half narrows into a jaw and a flattish
  // chin, so the face isn't a ball.
  const jaw = (y: number) => (y < 0 ? 1 - 0.3 * (-y / 0.6) ** 1.6 : 1)
  let skullGeometry: THREE.BufferGeometry = new THREE.SphereGeometry(0.6, 28, 20)
  skullGeometry.deleteAttribute('uv')
  skullGeometry.deleteAttribute('normal')
  skullGeometry = mergeVertices(skullGeometry)
  const sp = skullGeometry.attributes.position
  for (let v = 0; v < sp.count; v++) {
    const y = sp.getY(v)
    sp.setX(v, sp.getX(v) * jaw(y))
    if (y < -0.46) sp.setY(v, -0.46 + (y + 0.46) * 0.45)
  }
  skullGeometry.computeVertexNormals()
  const skull = inked(skullGeometry, skin, 3)
  skull.scale.set(0.9, 1.02, 0.9)
  skull.position.y = 0.52
  head.add(skull)
  for (const side of [-1, 1]) {
    const ear = inked(new THREE.SphereGeometry(0.12, 10, 8), skin, 2)
    ear.scale.set(0.6, 1, 0.8)
    ear.position.set(side * 0.53, 0.48, -0.02)
    head.add(ear)
  }
  const nose = inked(new THREE.SphereGeometry(0.07, 10, 8), skin, 1.8)
  nose.scale.set(1, 0.85, 0.9)
  nose.position.set(0, 0.42, 0.56)
  head.add(nose)

  // Eyes: dark ovals with a glint, on the front of the face.
  const ink = new THREE.MeshBasicMaterial({ color: INK })
  const glint = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  for (const side of [-1, 1]) {
    const eye = new THREE.Group()
    eye.position.set(side * 0.2, 0.55, 0.5)
    eye.rotation.y = side * 0.32
    const pupil = new THREE.Group()
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), ink)
    ball.scale.set(0.85, 1.25, 0.5)
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), glint)
    shine.position.set(0.025, 0.04, 0.035)
    pupil.add(ball, shine)
    eye.add(pupil)
    head.add(eye)
    eyes.push(eye)
    pupils.push(pupil)
  }
  head.add(brows)
  for (const side of [-1, 1]) {
    const brow = inked(new THREE.CapsuleGeometry(0.035, 0.14, 2, 6), toon(HAIR), 1.2)
    brow.rotation.z = Math.PI / 2 + side * 0.15
    brow.position.set(side * 0.21, 0.73, 0.485)
    brow.rotation.y = side * 0.32
    brows.add(brow)
  }
  // Curly hair: a mop of little balls over the top and back of the head,
  // with a fringe of curls over the forehead.
  head.add(hair)
  const rand = seeded(3)
  const curl = new THREE.IcosahedronGeometry(1, 1)
  const curls: [number, number, number][] = []
  for (let lat = 20; lat <= 90; lat += 14) {
    const ring = Math.max(1, Math.round(Math.cos(rad(lat)) * 16))
    for (let i = 0; i < ring; i++) {
      const lon = (i / ring) * 360 + lat * 3
      // Leave the face clear below the hairline.
      const front = Math.cos(rad(lon - 90))
      if (front > 0.35 && lat < 48) continue
      curls.push([lat, lon, 0.15 + rand() * 0.04])
    }
  }
  for (let i = 0; i < 7; i++) curls.push([50 + rand() * 6, 90 + (i - 3) * 17 + rand() * 4, 0.13 + rand() * 0.03])
  for (const [lat, lon, r] of curls) {
    const ball = inked(curl, toon(rand() < 0.3 ? HAIR_LIGHT : HAIR), 1.8)
    ball.scale.setScalar(r)
    const d = 0.6
    ball.position.set(Math.cos(rad(lat)) * Math.cos(rad(lon)) * d * 0.94, 0.56 + Math.sin(rad(lat)) * d * 1.04, Math.cos(rad(lat)) * Math.sin(rad(lon)) * d * 0.92)
    ball.rotation.set(rand() * 3, rand() * 3, 0)
    hair.add(ball)
  }

  const faceZ = (x: number, y: number) => {
    const ly = (y - 0.52) / 1.02
    return 0.9 * Math.sqrt(0.36 - (x / 0.9 / jaw(ly)) ** 2 - ly ** 2)
  }
  return { head, hair, brows, eyes, pupils, faceZ }
}

export class Character {
  readonly root = new THREE.Group()
  // Everything that moves when he jumps, leans and breathes.
  private body = new THREE.Group()
  private torso = new THREE.Group()
  private head: THREE.Group
  private hair: THREE.Group
  private brows: THREE.Group
  private eyes: THREE.Group[]
  private pupils: THREE.Group[]
  private shoulders: THREE.Group[] = []
  private elbows: THREE.Group[] = []
  private hips: THREE.Group[] = []
  private umbrella: THREE.Group
  private mouths: Record<'grin' | 'laugh' | 'oh', THREE.Object3D>
  private jumpAt = -10
  private t = 0
  private reaction = { kind: 'shrug' as Reaction, at: -100, dur: 0, dir: new THREE.Vector2() }
  // How fast he's running, 0 (standing) to 1, and where in his stride he is.
  stride = 0
  private phase = 0

  constructor() {
    this.root.add(this.body)
    const skin = toon(SKIN)

    // --- legs and shoes, swinging from the hip
    const HIP = 1.25
    for (const side of [-1, 1]) {
      const hip = new THREE.Group()
      hip.position.set(side * 0.21, HIP, 0)
      this.body.add(hip)
      this.hips.push(hip)
      const leg = inked(new THREE.CapsuleGeometry(0.15, 0.87, 3, 10), toon(JEANS), 2.5)
      leg.position.set(0, 0.72 - HIP, 0)
      hip.add(leg)
      const shoe = inked(new THREE.CapsuleGeometry(0.16, 0.26, 3, 10), toon(SHOE), 2.5)
      shoe.rotation.x = Math.PI / 2
      shoe.scale.set(1.1, 1, 0.75)
      shoe.position.set(side * 0.01, 0.14 - HIP, 0.1)
      hip.add(shoe)
      const trim = inked(new THREE.BoxGeometry(0.34, 0.05, 0.6), toon(SHOE_TRIM), 1.5)
      trim.position.set(side * 0.01, 0.03 - HIP, 0.1)
      hip.add(trim)
    }

    // --- torso: blue button-up, tucked into black jeans
    this.body.add(this.torso)
    const hips = inked(new THREE.CapsuleGeometry(0.33, 0.25, 3, 12), toon(JEANS), 2.5)
    hips.scale.set(1, 1, 0.7)
    hips.position.y = 1.3
    this.torso.add(hips)
    // Squared-off shoulders tapering to the waist, rather than a round barrel.
    const shirtProfile = [
      [0, 1.45], [0.35, 1.45], [0.36, 1.55], [0.43, 1.9], [0.47, 2.3], [0.43, 2.41], [0.3, 2.48], [0, 2.5],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    const shirt = inked(new THREE.LatheGeometry(shirtProfile, 18), toon(TOP), 2.5)
    shirt.scale.z = 0.68
    this.torso.add(shirt)
    const placket = inked(new THREE.BoxGeometry(0.06, 0.95, 0.03), toon(TOP_DARK), 1.2)
    // How far the shirt's front sits forward at a given height.
    const shirtFront = (y: number) => {
      const i = shirtProfile.findIndex((p) => p.y >= y)
      const [a, b] = [shirtProfile[i - 1], shirtProfile[i]]
      return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y)) * shirt.scale.z
    }
    placket.position.set(0.02, 1.88, shirtFront(1.88) + 0.008)
    placket.rotation.x = 0.09
    this.torso.add(placket)
    const button = new THREE.SphereGeometry(0.03, 8, 6)
    for (const y of [2.25, 2.05, 1.85, 1.65, 1.47]) {
      const b = new THREE.Mesh(button, toon('#e8edf3'))
      b.position.set(0.06, y, shirtFront(y) + 0.02)
      this.torso.add(b)
    }
    // Pointed collar, sitting in front of the neck.
    for (const side of [-1, 1]) {
      const s = new THREE.Shape()
      s.moveTo(0, 0)
      s.lineTo(side * 0.22, 0.04)
      s.lineTo(side * 0.06, -0.2)
      s.lineTo(0, 0)
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false })
      const collar = inked(g, toon(TOP), 1.8)
      collar.position.set(0, 2.47, 0.2)
      collar.rotation.x = -0.35
      this.torso.add(collar)
    }
    const neck = inked(new THREE.CylinderGeometry(0.12, 0.13, 0.32, 10), skin, 2)
    neck.position.set(0, 2.55, 0.02)
    this.torso.add(neck)

    // --- arms: shoulder → upper sleeve → elbow → forearm, cuff and hand
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group()
      shoulder.position.set(side * 0.47, 2.36, 0)
      this.torso.add(shoulder)
      const upper = inked(new THREE.CapsuleGeometry(0.11, 0.44, 3, 10), toon(TOP), 2.5)
      upper.position.y = -0.3
      shoulder.add(upper)
      const elbow = new THREE.Group()
      elbow.position.y = -0.58
      shoulder.add(elbow)
      const fore = inked(new THREE.CapsuleGeometry(0.1, 0.42, 3, 10), toon(TOP), 2.5)
      fore.position.y = -0.26
      elbow.add(fore)
      const cuff = inked(new THREE.CylinderGeometry(0.115, 0.115, 0.08, 10), toon(TOP_DARK), 1.5)
      cuff.position.y = -0.5
      elbow.add(cuff)
      const hand = inked(new THREE.SphereGeometry(0.14, 12, 10), skin, 2.5)
      hand.scale.set(0.9, 1.1, 0.75)
      hand.position.y = -0.66
      elbow.add(hand)
      const thumb = inked(new THREE.CapsuleGeometry(0.045, 0.08, 2, 6), skin, 1.5)
      thumb.position.set(-side * 0.11, -0.6, 0.05)
      thumb.rotation.z = -side * 0.6
      elbow.add(thumb)
      this.shoulders.push(shoulder)
      this.elbows.push(elbow)
    }

    // --- head
    const h = buildHead(skin)
    ;({ head: this.head, hair: this.hair, brows: this.brows, eyes: this.eyes, pupils: this.pupils } = h)
    this.head.position.y = 2.72
    this.torso.add(this.head)

    // Mouths: a grin, an open laugh and a surprised "oh"; one shows at a time.
    // The grin is a shallow curve that hugs the face, thinning to its corners
    // and a touch higher on one side.
    const smilePoints = []
    for (let i = 0; i <= 8; i++) {
      const s = i / 4 - 1
      const x = s * 0.13
      const y = 0.3 + 0.024 * s * s + 0.01 * s ** 4 + 0.006 * s
      smilePoints.push(new THREE.Vector3(x, y, h.faceZ(x, y) + 0.01))
    }
    const smileCurve = new THREE.CatmullRomCurve3(smilePoints)
    const segments = 24
    const smile = new THREE.TubeGeometry(smileCurve, segments, 0.017, 6, false)
    const pos = smile.attributes.position
    const centre = new THREE.Vector3()
    const p = new THREE.Vector3()
    for (let v = 0; v < pos.count; v++) {
      const u = Math.floor(v / 7) / segments
      smileCurve.getPointAt(u, centre)
      const taper = 0.25 + 0.75 * Math.sin(u * Math.PI) ** 0.7
      p.fromBufferAttribute(pos, v).sub(centre).multiplyScalar(taper).add(centre)
      pos.setXYZ(v, p.x, p.y, p.z)
    }
    smile.computeVertexNormals()
    const grin = inked(smile, new THREE.MeshBasicMaterial({ color: MOUTH }), 1)
    const laughShape = new THREE.Shape()
    laughShape.absarc(0, 0, 0.13, Math.PI, Math.PI * 2, false)
    laughShape.lineTo(-0.13, 0)
    const laugh = inked(new THREE.ExtrudeGeometry(laughShape, { depth: 0.03, bevelEnabled: false }), toon(MOUTH), 1.8)
    laugh.position.set(0, 0.33, 0.53)
    const oh = inked(new THREE.SphereGeometry(0.06, 10, 8), toon(MOUTH), 1.8)
    oh.scale.set(1, 1.2, 0.4)
    oh.position.set(0, 0.29, 0.55)
    this.mouths = { grin, laugh, oh }
    this.head.add(grin, laugh, oh)

    // A red umbrella in his right hand, for the rain; hidden until then.
    this.umbrella = new THREE.Group()
    const shaft = inked(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6), toon('#2a2320'), 1.5)
    shaft.position.y = 1.15
    const canopy = inked(new THREE.SphereGeometry(1.15, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon('#d64541', { side: THREE.DoubleSide }), 2.5)
    canopy.scale.y = 0.55
    canopy.position.y = 2.2
    const knob = inked(new THREE.SphereGeometry(0.07, 8, 6), toon('#2a2320'), 1.5)
    knob.position.y = 2.85
    this.umbrella.add(shaft, canopy, knob)
    this.umbrella.position.y = -0.66
    this.umbrella.visible = false
    this.elbows[1].add(this.umbrella)
  }

  // Do something about what just happened, for `seconds`. `dir` is which way
  // to point, as seen on screen (x right, y up).
  react(kind: Reaction, seconds: number, dir?: { x: number; y: number }) {
    const r = this.reaction
    const d = new THREE.Vector2(dir?.x ?? 1, dir?.y ?? 0).normalize()
    // Already doing it: just keep it up for longer.
    if (r.kind === kind && this.t - r.at > 0.25 && this.t - r.at < r.dur - 0.35) {
      r.dur = this.t - r.at + seconds
      r.dir.copy(d)
    } else this.reaction = { kind, at: this.t, dur: seconds, dir: d }
  }

  // Box round his body on screen, for clicks.
  hitTarget() {
    return this.body
  }

  jump() {
    if (this.t - this.jumpAt > DURATION.jump) this.jumpAt = this.t
  }

  update(t: number, gaze: Gaze, lean: number, still: boolean) {
    const dt = Math.max(0, Math.min(0.05, t - this.t))
    this.t = t
    // --- What he's reacting to, if anything: in quickly, out a little slower.
    const r = this.reaction
    const age = t - r.at
    const w = age < 0 || age > r.dur ? 0 : still ? 1 : smooth(clamp(Math.min(age / 0.25, (r.dur - age) / 0.35), 0, 1))
    const as = (kind: Reaction) => (r.kind === kind ? w : 0)
    const cheer = as('cheer')
    const point = as('point')
    const duck = as('duck')
    const shelter = as('shelter')
    // Running, he doesn't stop for idle actions.
    const run = still ? 0 : this.stride
    this.phase += dt * 11 * run
    const busy = Math.max(w, run)

    // --- Idle actions, one every few seconds, plus click-to-jump.
    const since = t - 1.5
    const slot = Math.floor(since / ACTION_GAP)
    const action = ACTIONS[((slot % ACTIONS.length) + ACTIONS.length) % ACTIONS.length]
    const ax = since >= 0 ? (since - slot * ACTION_GAP) / DURATION[action] : -1
    const e = still ? 0 : envelope(ax) * (1 - busy)
    const on = (name: Action) => (action === name ? e : 0)
    const jx = (t - this.jumpAt) / DURATION.jump
    const jumping = !still && jx >= 0 && jx < 1

    const wave = on('wave')
    const shrug = Math.max(on('shrug'), as('shrug'))
    const laugh = on('laugh')
    const lookAround = on('look')

    // Look-around overrides the cursor: glance left, then right. Pointing,
    // he looks where he's pointing; cheering, up at the sky.
    const glance = Math.sin(clamp(ax, 0, 1) * Math.PI * 2)
    const free = (1 - lookAround) * (1 - point) * (1 - cheer * 0.6)
    const lx = gaze.x * free + glance * lookAround + r.dir.x * 0.9 * point
    const ly = gaze.y * free - 0.2 * lookAround - r.dir.y * 0.7 * point - 0.5 * cheer - 0.3 * shelter

    // Jump: crouch, launch, land with a squash.
    let jumpY = 0
    let squash = 0
    if (jumping) {
      if (jx < 0.15) squash = Math.sin((jx / 0.15) * Math.PI) * 0.08
      else if (jx < 0.8) jumpY = 0.45 * Math.sin(((jx - 0.15) / 0.65) * Math.PI)
      else squash = Math.sin(((jx - 0.8) / 0.2) * Math.PI) * 0.1
    }
    const stretch = jumping && jx >= 0.15 && jx < 0.45 ? 0.05 : 0
    const airborne = jumping ? envelope(jx) : 0
    // Cheering, little hops; ducking, a crouch.
    const hop = still ? 0 : Math.abs(Math.sin(age * 9)) * 0.16 * cheer
    squash = Math.max(squash, duck * 0.16)

    // --- Body: breathing bob, gentle sway, scroll lean, jump, running bounce.
    const bob = still ? 0 : Math.sin(t * 1.7) * 0.012 + Math.sin(t * 14) * 0.008 * laugh
    const sway = still ? 0 : Math.sin(t * 0.55) * 1.2 * (1 - run)
    const bounce = Math.abs(Math.sin(this.phase)) * 0.09 * run
    const intro = still ? 1 : clamp(t / 0.9, 0, 1)
    const introY = -(1 - smooth(intro)) * 0.3 + Math.sin(intro * Math.PI) * 0.05
    this.body.position.y = bob + jumpY + introY + hop + bounce
    this.body.rotation.z = -rad(sway + lean)
    this.body.rotation.x = rad(8 * run + 10 * duck)
    this.body.scale.set(1 + squash * 0.8 - stretch * 0.6, 1 - squash + stretch, 1 + squash * 0.8 - stretch * 0.6)
    this.torso.scale.y = 1 + (still ? 0 : Math.sin(t * 1.7) * 0.006)

    // --- Legs swing as he runs.
    const swing = Math.sin(this.phase) * 0.75 * run
    this.hips[0].rotation.x = swing
    this.hips[1].rotation.x = -swing

    // --- Arms (angles as in the drawn version; screen-clockwise is -z here).
    const lift = (shrug * 10 + airborne * 4) * 0.0045
    const waveSwing = Math.sin(t * 10) * 22
    const pump = Math.sin(age * 12) * 14
    const [shL, shR] = this.shoulders
    const [elL, elR] = this.elbows
    shL.position.y = 2.36 + lift
    shR.position.y = 2.36 + lift
    // Pointing: the arm on that side, straight out along the direction.
    const aim = Math.atan2(r.dir.x, -r.dir.y)
    const pointL = r.dir.x < 0 ? point : 0
    const pointR = r.dir.x < 0 ? 0 : point
    const restL = -rad(8 + shrug * 16 + airborne * 60)
    const restR = rad(8 + wave * 142 + shrug * 16 + airborne * 60)
    const blend = (rest: number, poses: [number, number][]) => poses.reduce((v, [k, angle]) => v + (angle - v) * k, rest)
    shL.rotation.z = blend(restL, [
      [pointL, aim],
      [cheer, -rad(150 + pump)],
      [duck, -rad(160)],
    ])
    shR.rotation.z = blend(restR, [
      [pointR, aim],
      [cheer, rad(150 - pump)],
      [duck, rad(160)],
      [shelter, rad(20)],
    ])
    // Waving, the forearm comes forward a little, towards whoever he's waving
    // at; running, the arms swing against the legs.
    shR.rotation.x = -wave * 0.25 - duck * 0.35 + swing * 0.8
    shL.rotation.x = -duck * 0.35 - swing * 0.8
    elL.rotation.z = blend(-rad(shrug * 75 + airborne * 20 + laugh * 10), [
      [pointL, 0],
      [cheer, -rad(15)],
      [duck, -rad(100)],
    ])
    elR.rotation.z = blend(-rad(wave * (-35 + waveSwing) - shrug * 75 - airborne * 20 - laugh * 10), [
      [pointR, 0],
      [cheer, rad(15)],
      [duck, rad(100)],
      [shelter, rad(120)],
    ])
    // Shrugging, the forearms turn out, palms up.
    elL.rotation.x = -shrug * 0.6 - run * 0.9
    elR.rotation.x = -shrug * 0.6 - run * 0.9
    // The umbrella stays upright, leaning over his head, and pops open.
    this.umbrella.visible = shelter > 0.02
    this.umbrella.scale.set(shelter, 1, shelter)
    this.umbrella.rotation.z = rad(20) - shR.rotation.z - elR.rotation.z

    // --- Head, hair, face.
    const tilt = lx * 4 + shrug * 7 - laugh * 4 + Math.sin(t * 0.8) * (still ? 0 : 1)
    this.head.rotation.set(rad(ly * 14 - laugh * 8), rad(lx * 28), -rad(tilt))
    const hairLag = still ? 0 : Math.sin(t * 1.7 - 0.9) * 0.008 - (jumping ? Math.cos(((jx - 0.15) / 0.65) * Math.PI) * 0.03 * airborne : 0)
    this.hair.position.y = hairLag

    this.brows.position.y = (3 * gaze.near + 5 * wave + 8 * shrug + 4 * lookAround + 9 * (jumping && jx < 0.5 ? airborne : 0) + 8 * Math.max(cheer, point, duck)) * 0.006

    const shut = Math.max(blinkAt(t), laugh * 0.6, cheer * 0.5, duck * 0.9)
    for (const eye of this.eyes) eye.scale.y = 1 - shut * 0.88
    for (const pupil of this.pupils) pupil.position.set(lx * 0.025, -ly * 0.025, 0)

    const mouth = jumping ? (jx < 0.4 ? 'oh' : 'laugh') : cheer > 0.1 || laugh > 0.1 || run > 0.1 ? 'laugh' : point > 0.1 || duck > 0.1 ? 'oh' : 'grin'
    for (const [name, m] of Object.entries(this.mouths)) m.visible = name === mouth
  }

  // Where to aim the gaze from: the middle of his face.
  faceAt(target: THREE.Vector3) {
    return this.head.localToWorld(target.set(0, 0.5, 0.4))
  }

  // The top of his hair.
  topAt(target: THREE.Vector3) {
    return this.head.localToWorld(target.set(0, 1.25, 0))
  }
}
