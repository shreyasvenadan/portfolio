// Short-lived effects for the 3D island: splashes, smoke, bursts, splinters,
// bubbles, feathers and sparkles. Each is updated once a frame with its age in
// frames until it says it's done, then removed.
import * as THREE from 'three'
import { inked, toon } from './toon'

type Live = { obj: THREE.Object3D; update: (obj: THREE.Object3D, age: number) => boolean; age: number }

const ball = new THREE.IcosahedronGeometry(1, 1)
const plank = new THREE.BoxGeometry(0.06, 0.06, 0.32)
const ring = new THREE.RingGeometry(0.8, 1, 28).rotateX(-Math.PI / 2)
const star = (() => {
  const s = new THREE.Shape()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 0.28 : 1
    const a = (i / 8) * Math.PI * 2
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return new THREE.ShapeGeometry(s)
})()

const fading = (color: string, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })

export class Fx {
  private live: Live[] = []
  private scene: THREE.Scene
  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  add<T extends THREE.Object3D>(obj: T, update: (obj: T, age: number) => boolean, parent: THREE.Object3D = this.scene) {
    parent.add(obj)
    this.live.push({ obj, update: update as Live['update'], age: 0 })
    return obj
  }

  step() {
    this.live = this.live.filter((l) => {
      if (l.update(l.obj, l.age++)) return true
      l.obj.removeFromParent()
      return false
    })
  }

  // Rings spreading out on the water, and a spray of droplets.
  splash(x: number, z: number, size = 1) {
    for (let i = 0; i < 2; i++) {
      this.add(new THREE.Mesh(ring, fading('#f5fbf4', 0.9)), (m, age) => {
        const a = age - i * 10
        m.visible = a >= 0
        m.scale.setScalar(size * (0.3 + Math.max(0, a) * 0.05))
        ;(m.material as THREE.MeshBasicMaterial).opacity = 0.9 * Math.max(0, 1 - a / 45)
        return a < 45
      }).position.set(x, 0.06, z)
    }
    for (let i = 0; i < 12 * size; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 0.12, 0.12 + Math.random() * 0.14, (Math.random() - 0.5) * 0.12).multiplyScalar(size)
      const drop = new THREE.Mesh(ball, fading('#e6f6f8'))
      drop.scale.setScalar(0.07 * size)
      drop.position.set(x, 0.1, z)
      this.add(drop, (d) => {
        v.y -= 0.012
        d.position.add(v)
        return d.position.y > 0
      })
    }
  }

  // A grey puff that grows, rises and fades.
  smoke(at: THREE.Vector3, size = 1, life = 42) {
    const puff = new THREE.Mesh(ball, fading('#6b6b72', 0.75))
    puff.position.copy(at)
    const drift = new THREE.Vector3((Math.random() - 0.5) * 0.02, 0.03, (Math.random() - 0.5) * 0.02)
    this.add(puff, (p, age) => {
      p.position.add(drift)
      p.scale.setScalar(size * (0.2 + age * 0.012))
      ;(p.material as THREE.MeshBasicMaterial).opacity = 0.75 * Math.max(0, 1 - age / life)
      return age < life
    })
  }

  // An orange fireball that swells and fades, with a yellow heart.
  burst(at: THREE.Vector3, size = 1) {
    for (const [color, grow] of [
      ['#ffb238', 1],
      ['#ffe66b', 0.6],
    ] as const) {
      this.add(new THREE.Mesh(ball, fading(color)), (m, age) => {
        m.scale.setScalar(size * grow * (0.3 + age * 0.05))
        m.rotation.y = age * 0.1
        ;(m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - age / 24)
        return age < 24
      }).position.copy(at)
    }
  }

  // Bits of wood flung out, tumbling down to the water.
  splinters(at: THREE.Vector3, count = 8) {
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 0.16, 0.08 + Math.random() * 0.1, Math.random() * 0.12)
      const spin = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.3)
      const s = inked(plank, toon('#d9b07a'), 1.5)
      s.position.copy(at)
      this.add(s, (p) => {
        v.y -= 0.008
        p.position.add(v)
        p.rotation.x += spin.x
        p.rotation.y += spin.y
        return p.position.y > 0
      })
    }
  }

  // A bubble rising a little and popping.
  bubble(x: number, z: number) {
    const b = new THREE.Mesh(ball, fading('#d6f1f5', 0.8))
    b.scale.setScalar(0.08 + Math.random() * 0.1)
    b.position.set(x, 0.05, z)
    this.add(b, (m, age) => {
      m.position.y += 0.012
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - age / 30)
      return age < 30
    })
  }

  // A white feather rocking side to side as it drifts down.
  feather(at: THREE.Vector3) {
    const f = inked(new THREE.SphereGeometry(1, 6, 4), toon('#fbfaf5'), 1.2)
    f.scale.set(0.2, 0.03, 0.07)
    f.position.copy(at)
    const drift = (Math.random() - 0.5) * 0.02
    const x0 = at.x
    this.add(f, (p, age) => {
      const sway = Math.sin(age / 12)
      p.position.set(x0 + drift * age + sway * 0.4, p.position.y - 0.025, p.position.z)
      p.rotation.z = sway * 0.6
      return age < 160 && p.position.y > 0
    })
  }

  // A twinkle thrown out from a point, spinning and fading.
  sparkle(at: THREE.Vector3, dir: THREE.Vector3, camera: THREE.Camera, size = 1) {
    const s = new THREE.Mesh(star, fading('#fff8dc'))
    s.position.copy(at)
    s.scale.setScalar(size)
    this.add(s, (m, age) => {
      m.position.addScaledVector(dir, size * 0.4)
      m.quaternion.copy(camera.quaternion)
      m.rotateZ(age * 0.1)
      ;(m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - age / 40)
      return age < 40
    })
  }
}
