import { Object3D, Quaternion, Vector3, type Bone } from 'three'

const boneKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/^mixamorig[:_]?/, '')
    .replace(/[^a-z0-9]/g, '')

export function findBone(root: Object3D, ...names: string[]) {
  let found: Bone | undefined
  root.traverse((o) => {
    if (!found && (o as Bone).isBone && names.includes(boneKey(o.name))) found = o as Bone
  })
  return found
}

const parentQuat = new Quaternion()
const delta = new Quaternion()

// Rotate a bone by a rotation expressed in model space, whatever its local axes are.
export function rotateInModelSpace(bone: Object3D, rotation: Quaternion) {
  bone.parent!.getWorldQuaternion(parentQuat)
  delta.copy(parentQuat).invert().multiply(rotation).multiply(parentQuat)
  bone.quaternion.premultiply(delta)
}

const a = new Vector3()
const b = new Vector3()
const turn = new Quaternion()

const pointing = (from: Object3D, to: Object3D) =>
  to.getWorldPosition(new Vector3()).sub(from.getWorldPosition(new Vector3())).normalize()

// Swing `bone` so the direction to `child` moves toward that direction plus `nudge`.
function nudgeToward(model: Object3D, bone?: Object3D, child?: Object3D, nudge?: Vector3, absolute = false) {
  if (!bone || !child || !nudge) return
  a.copy(pointing(bone, child))
  b.copy(absolute ? nudge : a.clone().add(nudge)).normalize()
  rotateInModelSpace(bone, turn.setFromUnitVectors(a, b))
  model.updateMatrixWorld(true)
}

const FINGERS = ['index', 'middle', 'ring', 'pinky', 'thumb'] as const

// Curl a hand's fingers toward the palm. The palm side is worked out from the
// knuckles and thumb, so this doesn't depend on how the rig's bone axes point.
function curlFingers(model: Object3D, side: 'left' | 'right', amount: number) {
  const hand = findBone(model, `${side}hand`)
  const index = findBone(model, `${side}handindex1`)
  const pinky = findBone(model, `${side}handpinky1`)
  const middle = findBone(model, `${side}handmiddle1`)
  const thumb = findBone(model, `${side}handthumb2`)
  if (!hand || !index || !pinky || !middle || !thumb) return

  const across = pointing(pinky, index)
  const along = pointing(hand, middle)
  const palm = new Vector3().crossVectors(along, across).normalize()
  if (palm.dot(pointing(hand, thumb)) < 0) palm.negate()
  const axis = new Vector3().crossVectors(along, palm).normalize()

  for (const finger of FINGERS) {
    const scale = finger === 'thumb' ? 0.35 : 1
    ;[0.55, 0.7, 0.45].forEach((angle, j) => {
      const bone = findBone(model, `${side}hand${finger}${j + 1}`)
      if (!bone) return
      rotateInModelSpace(bone, turn.setFromAxisAngle(axis, angle * amount * scale))
      model.updateMatrixWorld(true)
    })
  }
}

// Turn a stiff T-pose into a loose, floating pose: arms down with soft elbows,
// fingers curled, knees slightly bent and toes pointed like someone drifting.
export function relaxPose(model: Object3D) {
  model.updateMatrixWorld(true)
  for (const side of ['left', 'right'] as const) {
    const arm = findBone(model, `${side}arm`, `${side}upperarm`)
    const forearm = findBone(model, `${side}forearm`, `${side}lowerarm`)
    const hand = findBone(model, `${side}hand`)
    const middle = findBone(model, `${side}handmiddle1`)
    if (!arm || !forearm) continue
    const out = Math.sign(pointing(arm, forearm).x) || (side === 'left' ? 1 : -1)

    if (pointing(arm, forearm).y > -0.6) nudgeToward(model, arm, forearm, new Vector3(out * 0.28, -1, 0.08), true)
    nudgeToward(model, forearm, hand, new Vector3(-out * 0.18, 0.12, 0.28))
    nudgeToward(model, hand, middle, new Vector3(-out * 0.15, 0, 0.1))
    curlFingers(model, side, 1)

    const upLeg = findBone(model, `${side}upleg`, `${side}upperleg`)
    const leg = findBone(model, `${side}leg`, `${side}lowerleg`)
    const foot = findBone(model, `${side}foot`)
    const toe = findBone(model, `${side}toebase`, `${side}toes`)
    nudgeToward(model, upLeg, leg, new Vector3(out * 0.03, 0, side === 'left' ? 0.14 : 0.06))
    nudgeToward(model, leg, foot, new Vector3(0, 0, side === 'left' ? -0.3 : -0.18))
    nudgeToward(model, foot, toe, new Vector3(0, -0.45, 0))
  }
}
