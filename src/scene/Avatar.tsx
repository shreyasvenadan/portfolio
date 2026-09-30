import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AnimationMixer,
  Box3,
  Euler,
  Group,
  Mesh,
  Quaternion,
  Vector3,
} from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { prefersReducedMotion } from '../lib/sections'
import { cartoonify } from './cartoon'
import CartoonMe from './CartoonMe'
import { blinkAmount, updateLook, type Look } from './look'
import { findBone, relaxPose, rotateInModelSpace } from './rig'

const AVATAR_URL = `${import.meta.env.BASE_URL}models/avatar.glb`
const AVATAR_HEIGHT = 1.75

// Shows public/models/avatar.glb when it exists, otherwise the built-in cartoon character.
export default function Avatar() {
  const [status, setStatus] = useState<'checking' | 'found' | 'missing'>('checking')

  useEffect(() => {
    let alive = true
    fetch(AVATAR_URL, { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? ''
        if (alive) setStatus(res.ok && !type.includes('text/html') ? 'found' : 'missing')
      })
      .catch(() => alive && setStatus('missing'))
    return () => {
      alive = false
    }
  }, [])

  if (status === 'checking') return null
  return <Drift>{status === 'found' ? <GltfAvatar url={AVATAR_URL} /> : <CartoonMe />}</Drift>
}

// Gentle up-and-down bob, like floating in water.
function Drift({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  const still = useMemo(() => prefersReducedMotion(), [])

  useFrame(({ clock }) => {
    if (!ref.current || still) return
    const t = clock.elapsedTime
    ref.current.position.y = Math.sin(t * 0.7) * 0.05
    ref.current.rotation.z = Math.sin(t * 0.45) * 0.012
    ref.current.rotation.x = Math.sin(t * 0.5 + 1) * 0.01
  })

  return <group ref={ref}>{children}</group>
}

// ---------------------------------------------------------------------------
// Avaturn (or any humanoid) GLB

const euler = new Euler(0, 0, 0, 'YXZ')

type Blink = { mesh: Mesh; index: number }

function GltfAvatar({ url }: { url: string }) {
  const { scene, animations } = useGLTF(url)

  const rig = useMemo(() => {
    const model = clone(scene)
    const blinks: Blink[] = []
    model.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      mesh.frustumCulled = false
      for (const [name, index] of Object.entries(mesh.morphTargetDictionary ?? {})) {
        if (/eye_?blink/i.test(name)) blinks.push({ mesh, index })
      }
    })

    const clip = animations.find((a) => /idle/i.test(a.name)) ?? animations[0]
    if (!clip) relaxPose(model)
    cartoonify(model)

    // Normalise size and stand the feet on y = 0.
    const box = new Box3().setFromObject(model)
    model.scale.setScalar(AVATAR_HEIGHT / (box.max.y - box.min.y))
    box.setFromObject(model)
    const center = box.getCenter(new Vector3())
    model.position.set(-center.x, -box.min.y, -center.z)
    model.updateMatrixWorld(true)

    const mixer = clip ? new AnimationMixer(model) : null
    if (mixer) mixer.clipAction(clip).play()

    const head = findBone(model, 'head')
    const neck = findBone(model, 'neck')
    const chest = findBone(model, 'spine2', 'upperchest', 'chest', 'spine1')
    const rest = new Map([head, neck, chest].filter(Boolean).map((b) => [b!, b!.quaternion.clone()]))
    return { model, mixer, head, neck, chest, rest, blinks }
  }, [scene, animations])

  const look = useRef<Look>({ yaw: 0, pitch: 0 })
  const headPos = useMemo(() => new Vector3(), [])
  const turn = useMemo(() => new Quaternion(), [])

  useFrame((state, dt) => {
    const { mixer, head, neck, chest, rest, blinks } = rig
    const t = state.clock.elapsedTime
    if (mixer) mixer.update(dt)
    else rest.forEach((q, bone) => bone.quaternion.copy(q))

    if (chest) rotateInModelSpace(chest, turn.setFromEuler(euler.set(Math.sin(t * 1.4) * 0.015, 0, 0)))

    if (head) {
      head.getWorldPosition(headPos)
      updateLook(state, headPos, look.current, dt)
      const { yaw, pitch } = look.current
      if (neck) rotateInModelSpace(neck, turn.setFromEuler(euler.set(pitch * 0.4, yaw * 0.4, 0)))
      rotateInModelSpace(head, turn.setFromEuler(euler.set(pitch * 0.6, yaw * 0.6, 0)))
    }

    const blink = blinkAmount(t)
    for (const { mesh, index } of blinks) mesh.morphTargetInfluences![index] = blink
  })

  return <primitive object={rig.model} />
}
