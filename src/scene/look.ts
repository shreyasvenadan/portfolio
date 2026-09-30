import type { RootState } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'

const ray = new Vector3()
const toTarget = new Vector3()

export type Look = { yaw: number; pitch: number }

// Turns the head toward the cursor: casts the pointer into the scene just in front
// of the avatar and eases yaw/pitch toward that point.
export function updateLook(state: RootState, head: Vector3, look: Look, dt: number) {
  const { camera, pointer } = state
  ray.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize()
  const t = (head.z + 1 - camera.position.z) / ray.z
  toTarget.copy(camera.position).addScaledVector(ray, t).sub(head)

  const yaw = MathUtils.clamp(Math.atan2(toTarget.x, toTarget.z), -0.7, 0.7)
  const pitch = MathUtils.clamp(-Math.atan2(toTarget.y, Math.hypot(toTarget.x, toTarget.z)), -0.45, 0.45)
  const k = 1 - Math.exp(-dt * 5)
  look.yaw += (yaw - look.yaw) * k
  look.pitch += (pitch - look.pitch) * k
}

// Blink every few seconds: returns 0 (open) to 1 (closed).
export function blinkAmount(time: number) {
  const phase = time % 4.3
  return phase < 0.14 ? Math.sin((phase / 0.14) * Math.PI) : 0
}
