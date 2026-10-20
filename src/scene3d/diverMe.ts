// Shreyas as a diver, for the SeaLens page: his own head (character.ts) in a
// mask with a regulator in, a wetsuit, a tank on his back and fins, holding
// an underwater camera in a yellow housing with two strobes out on arms. He
// hovers leaning into the shot, kicking slowly, filming whatever is in front
// of the lens. Built standing at the origin, facing +z, like the character.
import * as THREE from 'three'
import { buildHead } from './character'
import { inked, toon } from './toon'

const SKIN = '#c98652'
const SUIT = '#1f232b'
const PANEL = '#2f62a3'
const FIN = '#f2c230'
const TANK = '#d8dde3'
const HOUSING = '#f2c230'
const DARK = '#2a2e36'

// The torso's outline, as on the island: squared shoulders tapering to the waist.
const TORSO = [
  [0, 1.45],
  [0.35, 1.45],
  [0.36, 1.55],
  [0.43, 1.9],
  [0.47, 2.3],
  [0.43, 2.41],
  [0.3, 2.48],
  [0, 2.5],
].map(([r, y]) => new THREE.Vector2(r, y))

const UPPER = 0.58
const FORE = 0.66
const DOWN = new THREE.Vector3(0, -1, 0)

// A tube along points, for hoses and straps.
const tube = (points: [number, number, number][], radius: number) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), points.length * 8, radius, 6, false)

export class DiverMe {
  readonly root = new THREE.Group()
  // Where the bubbles come out, and the camera's lens, for what it can see.
  readonly regulator = new THREE.Object3D()
  readonly lens = new THREE.Object3D()
  private body = new THREE.Group()
  private torso = new THREE.Group()
  private head: THREE.Group
  private eyes: THREE.Group[]
  private pupils: THREE.Group[]
  private legs: THREE.Group[] = []
  private arms: { shoulder: THREE.Group; elbow: THREE.Group; grip: THREE.Vector3 }[] = []
  private rig = new THREE.Group()
  private rec: THREE.Mesh

  constructor() {
    this.root.add(this.body)
    this.body.add(this.torso)
    const skin = toon(SKIN)
    const suit = toon(SUIT)

    // --- wetsuit: torso, hips, a blue panel across the chest
    const hips = inked(new THREE.CapsuleGeometry(0.33, 0.25, 3, 12), suit, 2.5)
    hips.scale.set(1, 1, 0.7)
    hips.position.y = 1.3
    const chest = inked(new THREE.LatheGeometry(TORSO, 18), suit, 2.5)
    chest.scale.z = 0.68
    const panel = inked(new THREE.LatheGeometry(TORSO.slice(2, 6).map((p) => new THREE.Vector2(p.x + 0.012, p.y)), 18, -Math.PI * 0.42, Math.PI * 0.84), toon(PANEL), 1.2)
    panel.scale.z = 0.69
    const neck = inked(new THREE.CylinderGeometry(0.13, 0.14, 0.32, 10), suit, 2)
    neck.position.set(0, 2.55, 0.02)
    this.torso.add(hips, chest, panel, neck)

    // --- tank on his back, with its valve
    const tank = inked(new THREE.CapsuleGeometry(0.21, 0.95, 4, 14), toon(TANK), 2.5)
    tank.position.set(0, 1.95, -0.5)
    const valve = inked(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 10), toon(DARK), 1.5)
    valve.position.set(0, 2.68, -0.5)
    const band = inked(new THREE.CylinderGeometry(0.225, 0.225, 0.08, 14), toon(DARK), 1.2)
    band.position.set(0, 1.75, -0.5)
    this.torso.add(tank, valve, band)

    // --- legs, kicking from the hip, with fins
    for (const side of [-1, 1]) {
      const hip = new THREE.Group()
      hip.position.set(side * 0.19, 1.32, 0)
      const leg = inked(new THREE.CapsuleGeometry(0.15, 0.8, 3, 10), suit, 2.5)
      leg.position.y = -0.55
      const boot = inked(new THREE.CapsuleGeometry(0.14, 0.16, 3, 10), toon(DARK), 2)
      boot.position.set(0, -1.12, 0.02)
      const fin = inked(new THREE.BoxGeometry(0.42, 0.85, 0.04).translate(0, -0.42, 0), toon(FIN), 2)
      fin.position.set(0, -1.18, 0)
      fin.rotation.x = 0.35
      hip.add(leg, boot, fin)
      this.body.add(hip)
      this.legs.push(hip)
    }

    // --- the camera: a yellow housing, a dark port, handles and two strobes
    // Held level against his forward lean, and turned a touch to his right.
    this.rig.position.set(0, 2.02, 1.02)
    this.rig.rotation.set(-0.3, 0.15, 0)
    this.rig.updateMatrix()
    this.torso.add(this.rig)
    const housing = inked(new THREE.BoxGeometry(0.62, 0.44, 0.38), toon(HOUSING), 2.5)
    const port = inked(new THREE.CylinderGeometry(0.17, 0.19, 0.16, 18).rotateX(Math.PI / 2), toon('#253447'), 2)
    port.position.z = 0.26
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.15, 18), new THREE.MeshBasicMaterial({ color: '#5f8fb0' }))
    glass.position.z = 0.345
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), new THREE.MeshBasicMaterial({ color: '#ffffff' }))
    glint.position.set(0.05, 0.05, 0.35)
    this.lens.position.z = 0.36
    this.rig.add(housing, port, glass, glint, this.lens)
    for (const side of [-1, 1]) {
      const handle = inked(new THREE.CapsuleGeometry(0.05, 0.26, 2, 8), toon(DARK), 1.5)
      handle.position.set(side * 0.43, -0.02, 0)
      const bar = inked(new THREE.BoxGeometry(0.14, 0.05, 0.08), toon(DARK), 1.2)
      bar.position.set(side * 0.37, -0.17, 0)
      const arm = inked(tube([[side * 0.43, 0.17, 0], [side * 0.62, 0.42, 0.04], [side * 0.6, 0.62, 0.12]], 0.03), toon(DARK), 1.2)
      const strobe = inked(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12).rotateX(Math.PI / 2), toon(DARK), 1.5)
      strobe.position.set(side * 0.6, 0.64, 0.22)
      const flash = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), new THREE.MeshBasicMaterial({ color: '#eaf6ff' }))
      flash.position.set(side * 0.6, 0.64, 0.305)
      this.rig.add(handle, bar, arm, strobe, flash)
      this.arms.push({ shoulder: new THREE.Group(), elbow: new THREE.Group(), grip: handle.position.clone().applyMatrix4(this.rig.matrix) })
    }
    // A red light on top that blinks while he's recording.
    this.rec = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#e5483b' }))
    this.rec.position.set(-0.2, 0.23, -0.1)
    this.rig.add(this.rec)

    // --- arms, reaching forward to the handles
    for (const [i, side] of [-1, 1].entries()) {
      const { shoulder, elbow } = this.arms[i]
      shoulder.position.set(side * 0.47, 2.36, 0)
      this.torso.add(shoulder)
      const upper = inked(new THREE.CapsuleGeometry(0.11, 0.44, 3, 10), suit, 2.5)
      upper.position.y = -0.3
      shoulder.add(upper)
      elbow.position.y = -UPPER
      shoulder.add(elbow)
      const fore = inked(new THREE.CapsuleGeometry(0.1, 0.42, 3, 10), suit, 2.5)
      fore.position.y = -0.26
      const glove = inked(new THREE.SphereGeometry(0.13, 12, 10), toon(DARK), 2.5)
      glove.scale.set(0.9, 1.1, 0.8)
      glove.position.y = -FORE
      elbow.add(fore, glove)
      reach(shoulder, elbow, this.arms[i].grip, side)
    }

    // --- head, in a mask, with a regulator in his mouth
    const h = buildHead(skin)
    this.head = h.head
    this.eyes = h.eyes
    this.pupils = h.pupils
    this.head.position.y = 2.72
    this.torso.add(this.head)
    // The mask: a frame round the eyes and a pane of glass, both bent to
    // follow the face, and a strap round the back through his hair.
    const bend = (g: THREE.BufferGeometry, z: number) => {
      const p = g.attributes.position
      for (let v = 0; v < p.count; v++) p.setZ(v, p.getZ(v) + z - 0.85 * p.getX(v) ** 2)
      g.computeVertexNormals()
      return g
    }
    const frame = inked(bend(new THREE.TorusGeometry(0.16, 0.035, 8, 32).scale(2.05, 0.9, 1), 0.56), toon(DARK), 1.8)
    frame.position.y = 0.585
    const pane = new THREE.Mesh(
      bend(new THREE.CircleGeometry(0.16, 32).scale(2.05, 0.9, 1), 0.545),
      new THREE.MeshBasicMaterial({ color: '#bfe9f2', transparent: true, opacity: 0.28, depthWrite: false }),
    )
    pane.position.y = 0.585
    const around: [number, number, number][] = []
    for (let a = 140; a <= 400; a += 20) around.push([Math.cos((a * Math.PI) / 180) * 0.555, 0, Math.sin((a * Math.PI) / 180) * 0.555])
    const strap = inked(tube(around, 0.03), toon(DARK), 1.2)
    strap.position.y = 0.6
    this.head.add(frame, pane, strap)
    const mouthZ = h.faceZ(0, 0.3)
    const bite = inked(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10).rotateX(Math.PI / 2), toon(DARK), 1.5)
    bite.position.set(0, 0.3, mouthZ + 0.03)
    const stage = inked(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 14).rotateX(Math.PI / 2), toon('#3a3d45'), 1.8)
    stage.position.set(0, 0.28, mouthZ + 0.11)
    const purge = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), toon(FIN))
    purge.position.set(0, 0.28, mouthZ + 0.161)
    this.regulator.position.set(0.1, 0.2, mouthZ + 0.1)
    this.head.add(bite, stage, purge, this.regulator)
    // The hose from the regulator, over his shoulder, to the tank.
    this.torso.add(
      inked(
        tube(
          [
            [0.12, 2.98, 0.68],
            [0.4, 2.86, 0.5],
            [0.52, 2.72, 0.05],
            [0.3, 2.66, -0.45],
            [0.05, 2.74, -0.5],
          ],
          0.04,
        ),
        toon(DARK),
        1.2,
      ),
    )

    // Leaning into the shot, as if swimming forward.
    this.body.rotation.x = 0.3
  }

  update(t: number, still: boolean) {
    const s = still ? 0 : t
    // A slow flutter kick, a gentle bob, and the camera held steady.
    const kick = Math.sin(s * 2.1)
    this.legs[0].rotation.x = 0.3 + kick * 0.22
    this.legs[1].rotation.x = 0.3 - kick * 0.22
    this.body.position.y = Math.sin(s * 0.9) * 0.08
    this.body.rotation.z = Math.sin(s * 0.6) * 0.03
    this.head.rotation.set(0.12 + Math.sin(s * 0.7) * 0.03, Math.sin(s * 0.45) * 0.06, 0)
    // Blinking behind the mask, eyes on the shot.
    const blink = (s % 4.6) < 0.14 ? Math.sin(((s % 4.6) / 0.14) * Math.PI) : 0
    for (const eye of this.eyes) eye.scale.y = 1 - blink * 0.88
    for (const pupil of this.pupils) pupil.position.set(0.02, -0.01, 0)
    this.rec.visible = still || s % 1.2 < 0.7
  }

  // The lens's position and the way it points, in the world.
  aim(at: THREE.Vector3, dir: THREE.Vector3) {
    this.lens.getWorldPosition(at)
    return dir.set(0, 0, 1).transformDirection(this.lens.matrixWorld)
  }
}

// Bends an arm so its hand lands on `target` (in the torso's space), the
// elbow dropping down and out.
function reach(shoulder: THREE.Group, elbow: THREE.Group, target: THREE.Vector3, side: number) {
  const d = target.clone().sub(shoulder.position)
  const L = Math.min(d.length(), (UPPER + FORE) * 0.999)
  d.normalize()
  const a = Math.acos(THREE.MathUtils.clamp((UPPER ** 2 + L ** 2 - FORE ** 2) / (2 * UPPER * L), -1, 1))
  const pole = new THREE.Vector3(side * 0.6, -1, 0).normalize()
  const n = new THREE.Vector3().crossVectors(d, pole).normalize()
  // Of the two ways to swing the upper arm off the line to the hand, take
  // the one that drops the elbow towards the pole.
  const up1 = d.clone().applyAxisAngle(n, a)
  const up2 = d.clone().applyAxisAngle(n, -a)
  const upper = up1.dot(pole) > up2.dot(pole) ? up1 : up2
  shoulder.quaternion.setFromUnitVectors(DOWN, upper)
  const elbowAt = shoulder.position.clone().addScaledVector(upper, UPPER)
  const fore = target.clone().sub(elbowAt).normalize().applyQuaternion(shoulder.quaternion.clone().invert())
  elbow.quaternion.setFromUnitVectors(DOWN, fore)
}
