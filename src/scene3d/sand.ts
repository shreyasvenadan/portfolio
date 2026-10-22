// Marks in the sand: lines dragged across the beach, and the craters cannon
// balls leave. They're drawn into a canvas laid over the island from above
// (models.ts darkens the sand where it's marked), and the sea slowly washes
// them away: fast at the water's edge, slowly up the beach.
import * as THREE from 'three'
import { ISLAND } from './models'

const SIZE = 1024
// The patch of world the canvas covers, matching the island's mesh.
const AREA = {
  x: -ISLAND.rx * 1.2,
  z: ISLAND.cz - ISLAND.back * 1.2,
  w: ISLAND.rx * 2.4,
  d: (ISLAND.back + ISLAND.front) * 1.2,
}
const PX = SIZE / AREA.w

export class SandMarks {
  readonly texture: THREE.CanvasTexture
  // Where the canvas sits in the world, for the island's shader.
  readonly area = new THREE.Vector4(AREA.x, AREA.z, AREA.w, AREA.d)
  private c: CanvasRenderingContext2D
  private wash: CanvasGradient
  // How long until it's all washed away (in wash steps); none drawn, none to wash.
  private left = 0
  private steps = 0

  constructor() {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = Math.round(AREA.d * PX)
    this.c = canvas.getContext('2d')!
    this.c.lineCap = 'round'
    this.c.lineJoin = 'round'
    this.texture = new THREE.CanvasTexture(canvas)
    this.texture.colorSpace = THREE.NoColorSpace
    // Rows run with z, as the canvas is drawn.
    this.texture.flipY = false
    // Washing is a little erased everywhere each step, more towards the
    // shore. The island's outline is an ellipse longer to the front.
    const [cx, cz] = this.toCanvas(0, ISLAND.cz + (ISLAND.front - ISLAND.back) / 2)
    const r = ((ISLAND.back + ISLAND.front) / 2) * PX
    this.wash = this.c.createRadialGradient(cx, cz, 0, cx, cz, r)
    this.wash.addColorStop(0, 'rgba(0,0,0,0.006)')
    this.wash.addColorStop(0.6, 'rgba(0,0,0,0.012)')
    this.wash.addColorStop(0.85, 'rgba(0,0,0,0.08)')
    this.wash.addColorStop(1, 'rgba(0,0,0,0.3)')
  }

  private toCanvas(x: number, z: number) {
    return [(x - AREA.x) * PX, (z - AREA.z) * PX] as const
  }

  // A groove from a to b: dark in the trench, with its far lip catching the
  // light (white is lighter sand in the shader, black darker).
  line(a: THREE.Vector3, b: THREE.Vector3) {
    const [ax, az] = this.toCanvas(a.x, a.z)
    const [bx, bz] = this.toCanvas(b.x, b.z)
    const c = this.c
    c.globalCompositeOperation = 'source-over'
    for (const [color, width, dz] of [
      ['#fff', 0.16, -0.05],
      ['#000', 0.11, 0],
    ] as const) {
      c.strokeStyle = color
      c.lineWidth = width * PX
      c.beginPath()
      c.moveTo(ax, az + dz * PX)
      c.lineTo(bx, bz + dz * PX)
      c.stroke()
    }
    this.marked()
  }

  // A scorched crater with a ring of thrown-up sand round it.
  crater(at: THREE.Vector3, radius: number) {
    const [x, z] = this.toCanvas(at.x, at.z)
    const c = this.c
    c.globalCompositeOperation = 'source-over'
    c.fillStyle = '#fff'
    c.beginPath()
    c.ellipse(x, z, radius * 1.45 * PX, radius * 1.3 * PX, 0, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#000'
    c.beginPath()
    c.ellipse(x, z + radius * 0.08 * PX, radius * PX, radius * 0.9 * PX, 0, 0, Math.PI * 2)
    c.fill()
    this.marked()
  }

  private marked() {
    this.texture.needsUpdate = true
    this.left = 900
  }

  // Once a frame: every few frames, the sea takes a little more.
  step() {
    if (this.left <= 0 || ++this.steps % 6) return
    this.left--
    const c = this.c
    c.globalCompositeOperation = 'destination-out'
    c.fillStyle = this.wash
    if (this.left === 0) c.clearRect(0, 0, c.canvas.width, c.canvas.height)
    else c.fillRect(0, 0, c.canvas.width, c.canvas.height)
    this.texture.needsUpdate = true
  }
}
