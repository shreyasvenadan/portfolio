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
import { blinkAmount, updateLook, type Look } from './look'
import { findBone, relaxPose, rotateInModelSpace } from './rig'

const AVATAR_URL = `${import.meta.env.BASE_URL}models/avatar.glb`
const AVATAR_HEIGHT = 1.75

// Shows public/models/avatar.glb when it exists, otherwise a stylised stand-in.
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
  return <Drift>{status === 'found' ? <GltfAvatar url={AVATAR_URL} /> : <StandIn />}</Drift>
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

// ---------------------------------------------------------------------------
// Stand-in figure, used until public/models/avatar.glb exists.

const SKIN = '#b7866a'
const HAIR = '#171210'
const HOODIE = '#233447'
const TROUSERS = '#131c28'

function StandIn() {
  const head = useRef<Group>(null)
  const eyes = useRef<Group>(null)
  const look = useRef<Look>({ yaw: 0, pitch: 0 })
  const headPos = useMemo(() => new Vector3(), [])

  useFrame((state, dt) => {
    if (!head.current || !eyes.current) return
    head.current.getWorldPosition(headPos)
    updateLook(state, headPos, look.current, dt)
    head.current.rotation.set(look.current.pitch, look.current.yaw, 0, 'YXZ')
    eyes.current.scale.y = 1 - blinkAmount(state.clock.elapsedTime) * 0.9
  })

  return (
    <group>
      {/* legs */}
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]}>
          <capsuleGeometry args={[0.075, 0.75, 8, 16]} />
          <meshStandardMaterial color={TROUSERS} roughness={0.85} />
        </mesh>
      ))}
      {/* torso */}
      <mesh position={[0, 1.13, 0]}>
        <capsuleGeometry args={[0.22, 0.42, 12, 24]} />
        <meshStandardMaterial color={HOODIE} roughness={0.9} />
      </mesh>
      {/* arms */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.3, 1.08, 0]} rotation={[0, 0, side * 0.12]}>
          <capsuleGeometry args={[0.065, 0.55, 8, 16]} />
          <meshStandardMaterial color={HOODIE} roughness={0.9} />
        </mesh>
      ))}
      {/* neck */}
      <mesh position={[0, 1.44, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.12, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* head, pivoting at the neck */}
      <group ref={head} position={[0, 1.5, 0]}>
        <mesh position={[0, 0.12, 0]} scale={[0.92, 1.05, 0.95]}>
          <sphereGeometry args={[0.14, 32, 32]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.16, -0.012]} scale={[0.97, 0.95, 1]}>
          <sphereGeometry args={[0.142, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={HAIR} roughness={0.95} />
        </mesh>
        <group ref={eyes} position={[0, 0.13, 0.122]}>
          {[-0.045, 0.045].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <sphereGeometry args={[0.014, 16, 16]} />
              <meshStandardMaterial color="#0b0d10" roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}
