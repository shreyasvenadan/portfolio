// Shreyas in 3D: curly black hair, a long-sleeve blue button-up, black jeans
// and black shoes. Stands with his feet at the origin, facing +z (the camera).
// Every few seconds he waves, looks around, shrugs or laughs; his eyes and
// head follow the cursor, and clicking him makes him jump.
import * as THREE from 'three'
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

export class Character {
  readonly root = new THREE.Group()
  // Everything that moves when he jumps, leans and breathes.
  private body = new THREE.Group()
  private torso = new THREE.Group()
  private head = new THREE.Group()
  private hair = new THREE.Group()
  private brows = new THREE.Group()
  private eyes: THREE.Group[] = []
  private pupils: THREE.Group[] = []
  private shoulders: THREE.Group[] = []
  private elbows: THREE.Group[] = []
  private mouths: Record<'grin' | 'laugh' | 'oh', THREE.Object3D>
  private jumpAt = -10
  private t = 0

  constructor() {
    this.root.add(this.body)
    const skin = toon(SKIN)

    // --- legs and shoes
    for (const side of [-1, 1]) {
      const leg = inked(new THREE.CapsuleGeometry(0.17, 0.85, 3, 10), toon(JEANS), 2.5)
      leg.position.set(side * 0.21, 0.72, 0)
      this.body.add(leg)
      const shoe = inked(new THREE.CapsuleGeometry(0.16, 0.26, 3, 10), toon(SHOE), 2.5)
      shoe.rotation.x = Math.PI / 2
      shoe.scale.set(1.1, 1, 0.75)
      shoe.position.set(side * 0.22, 0.14, 0.1)
      this.body.add(shoe)
      const trim = inked(new THREE.BoxGeometry(0.34, 0.05, 0.6), toon(SHOE_TRIM), 1.5)
      trim.position.set(side * 0.22, 0.03, 0.1)
      this.body.add(trim)
    }

    // --- torso: blue button-up, tucked into black jeans
    this.body.add(this.torso)
    const hips = inked(new THREE.CapsuleGeometry(0.33, 0.25, 3, 12), toon(JEANS), 2.5)
    hips.scale.set(1.05, 1, 0.75)
    hips.position.y = 1.3
    this.torso.add(hips)
    const shirt = inked(new THREE.CapsuleGeometry(0.4, 0.62, 4, 14), toon(TOP), 2.5)
    shirt.scale.set(1.05, 1, 0.74)
    shirt.position.y = 1.92
    this.torso.add(shirt)
    const placket = inked(new THREE.BoxGeometry(0.06, 0.95, 0.03), toon(TOP_DARK), 1.2)
    placket.position.set(0.02, 1.88, 0.3)
    this.torso.add(placket)
    const button = new THREE.SphereGeometry(0.03, 8, 6)
    for (const y of [2.25, 2.05, 1.85, 1.65, 1.47]) {
      const b = new THREE.Mesh(button, toon('#e8edf3'))
      b.position.set(0.06, y, 0.31)
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
      const upper = inked(new THREE.CapsuleGeometry(0.13, 0.42, 3, 10), toon(TOP), 2.5)
      upper.position.y = -0.3
      shoulder.add(upper)
      const elbow = new THREE.Group()
      elbow.position.y = -0.58
      shoulder.add(elbow)
      const fore = inked(new THREE.CapsuleGeometry(0.12, 0.4, 3, 10), toon(TOP), 2.5)
      fore.position.y = -0.26
      elbow.add(fore)
      const cuff = inked(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 10), toon(TOP_DARK), 1.5)
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
    this.head.position.y = 2.72
    this.torso.add(this.head)
    const skull = inked(new THREE.SphereGeometry(0.6, 28, 20), skin, 3)
    skull.scale.set(1, 0.96, 0.92)
    skull.position.y = 0.52
    this.head.add(skull)
    for (const side of [-1, 1]) {
      const ear = inked(new THREE.SphereGeometry(0.12, 10, 8), skin, 2)
      ear.scale.set(0.6, 1, 0.8)
      ear.position.set(side * 0.59, 0.48, -0.02)
      this.head.add(ear)
    }
    const nose = inked(new THREE.SphereGeometry(0.07, 10, 8), skin, 1.8)
    nose.scale.set(1, 0.85, 0.9)
    nose.position.set(0, 0.42, 0.56)
    this.head.add(nose)

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
      this.head.add(eye)
      this.eyes.push(eye)
      this.pupils.push(pupil)
    }
    this.head.add(this.brows)
    for (const side of [-1, 1]) {
      const brow = inked(new THREE.CapsuleGeometry(0.035, 0.14, 2, 6), toon(HAIR), 1.2)
      brow.rotation.z = Math.PI / 2 + side * 0.15
      brow.position.set(side * 0.21, 0.73, 0.5)
      brow.rotation.y = side * 0.32
      this.brows.add(brow)
    }
    // Rosy cheeks.
    for (const side of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: '#d9704f', transparent: true, opacity: 0.45 }))
      cheek.position.set(side * 0.33, 0.38, 0.49)
      cheek.rotation.y = side * 0.55
      this.head.add(cheek)
    }

    // Mouths: a grin, an open laugh and a surprised "oh"; one shows at a time.
    const grin = inked(new THREE.TorusGeometry(0.11, 0.022, 6, 14, Math.PI), new THREE.MeshBasicMaterial({ color: MOUTH }), 1)
    grin.rotation.z = Math.PI
    grin.position.set(0, 0.32, 0.555)
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

    // Curly hair: a mop of little balls over the top and back of the head,
    // with a fringe of curls over the forehead.
    this.head.add(this.hair)
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
      ball.position.set(Math.cos(rad(lat)) * Math.cos(rad(lon)) * d * 1.02, 0.56 + Math.sin(rad(lat)) * d * 0.98, Math.cos(rad(lat)) * Math.sin(rad(lon)) * d * 0.94)
      ball.rotation.set(rand() * 3, rand() * 3, 0)
      this.hair.add(ball)
    }
  }

  // Box round his body on screen, for clicks.
  hitTarget() {
    return this.body
  }

  jump() {
    if (this.t - this.jumpAt > DURATION.jump) this.jumpAt = this.t
  }

  update(t: number, gaze: Gaze, lean: number, still: boolean) {
    this.t = t
    // --- Idle actions, one every few seconds, plus click-to-jump.
    const since = t - 1.5
    const slot = Math.floor(since / ACTION_GAP)
    const action = ACTIONS[((slot % ACTIONS.length) + ACTIONS.length) % ACTIONS.length]
    const ax = since >= 0 ? (since - slot * ACTION_GAP) / DURATION[action] : -1
    const e = still ? 0 : envelope(ax)
    const on = (name: Action) => (action === name ? e : 0)
    const jx = (t - this.jumpAt) / DURATION.jump
    const jumping = !still && jx >= 0 && jx < 1

    const wave = on('wave')
    const shrug = on('shrug')
    const laugh = on('laugh')
    const lookAround = on('look')

    // Look-around overrides the cursor: glance left, then right.
    const glance = Math.sin(clamp(ax, 0, 1) * Math.PI * 2)
    const lx = gaze.x * (1 - lookAround) + glance * lookAround
    const ly = gaze.y * (1 - lookAround) - 0.2 * lookAround

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

    // --- Body: breathing bob, gentle sway, scroll lean, jump.
    const bob = still ? 0 : Math.sin(t * 1.7) * 0.012 + Math.sin(t * 14) * 0.008 * laugh
    const sway = still ? 0 : Math.sin(t * 0.55) * 1.2
    const intro = still ? 1 : clamp(t / 0.9, 0, 1)
    const introY = -(1 - smooth(intro)) * 0.3 + Math.sin(intro * Math.PI) * 0.05
    this.body.position.y = bob + jumpY + introY
    this.body.rotation.z = -rad(sway + lean)
    this.body.scale.set(1 + squash * 0.8 - stretch * 0.6, 1 - squash + stretch, 1 + squash * 0.8 - stretch * 0.6)
    this.torso.scale.y = 1 + (still ? 0 : Math.sin(t * 1.7) * 0.006)

    // --- Arms (angles as in the drawn version; screen-clockwise is -z here).
    const lift = (shrug * 10 + airborne * 4) * 0.0045
    const waveSwing = Math.sin(t * 10) * 22
    const [shL, shR] = this.shoulders
    const [elL, elR] = this.elbows
    shL.position.y = 2.36 + lift
    shR.position.y = 2.36 + lift
    shL.rotation.z = -rad(8 + shrug * 16 + airborne * 60)
    shR.rotation.z = rad(8 + wave * 142 + shrug * 16 + airborne * 60)
    // Waving, the forearm comes forward a little, towards whoever he's waving at.
    shR.rotation.x = -wave * 0.25
    elL.rotation.z = -rad(shrug * 75 + airborne * 20 + laugh * 10)
    elR.rotation.z = -rad(wave * (-35 + waveSwing) - shrug * 75 - airborne * 20 - laugh * 10)
    // Shrugging, the forearms turn out, palms up.
    elL.rotation.x = -shrug * 0.6
    elR.rotation.x = -shrug * 0.6

    // --- Head, hair, face.
    const tilt = lx * 4 + shrug * 7 - laugh * 4 + Math.sin(t * 0.8) * (still ? 0 : 1)
    this.head.rotation.set(rad(ly * 14 - laugh * 8), rad(lx * 28), -rad(tilt))
    const hairLag = still ? 0 : Math.sin(t * 1.7 - 0.9) * 0.008 - (jumping ? Math.cos(((jx - 0.15) / 0.65) * Math.PI) * 0.03 * airborne : 0)
    this.hair.position.y = hairLag

    this.brows.position.y = (3 * gaze.near + 5 * wave + 8 * shrug + 4 * lookAround + 9 * (jumping && jx < 0.5 ? airborne : 0)) * 0.006

    const shut = Math.max(blinkAt(t), laugh * 0.6)
    for (const eye of this.eyes) eye.scale.y = 1 - shut * 0.88
    for (const pupil of this.pupils) pupil.position.set(lx * 0.025, -ly * 0.025, 0)

    const mouth = jumping ? (jx < 0.4 ? 'oh' : 'laugh') : laugh > 0.1 ? 'laugh' : 'grin'
    for (const [name, m] of Object.entries(this.mouths)) m.visible = name === mouth
  }

  // Where to aim the gaze from: the middle of his face.
  faceAt(target: THREE.Vector3) {
    return this.head.localToWorld(target.set(0, 0.5, 0.4))
  }
}
