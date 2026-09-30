import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Fog,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Points,
  Vector3,
} from 'three'
import { prefersReducedMotion, sectionProgress } from '../lib/sections'
import SceneLoader from '../components/SceneLoader'
import Avatar from './Avatar'

// Water colour at each section, from sunlit shallows to the abyss.
const WATER = ['#12505f', '#0e3f55', '#0a2f47', '#061c33', '#030d1c'].map((c) => new Color(c))

type Shot = { pos: Vector3; look: Vector3 }
const shot = (pos: [number, number, number], look: [number, number, number]): Shot => ({
  pos: new Vector3(...pos),
  look: new Vector3(...look),
})

// One camera position per section. On wide screens the look target sits left of
// the avatar, which pushes the avatar to the right and leaves room for the text.
const WIDE_SHOTS = [
  shot([-0.55, 1.5, 2.3], [-0.6, 1.3, 0]),
  shot([-0.9, 1.25, 3.6], [-0.95, 1.0, 0]),
  shot([-1.3, 2.3, 4.2], [-1.1, 0.95, 0]),
  shot([-0.7, 0.55, 3.1], [-0.8, 1.2, 0]),
  shot([-0.45, 1.5, 2.7], [-0.5, 1.35, 0]),
]
const NARROW_SHOTS = [
  shot([0, 1.35, 3.4], [0, 1.15, 0]),
  shot([0.2, 1.3, 4.4], [0, 1.0, 0]),
  shot([0.1, 2.3, 4.8], [0, 0.9, 0]),
  shot([-0.2, 0.6, 4.0], [0, 1.1, 0]),
  shot([0, 1.55, 2.6], [0, 1.4, 0]),
]

const ease = (x: number) => x * x * (3 - 2 * x)

function CameraRig() {
  const { camera, size, scene } = useThree()
  const look = useRef(new Vector3(-0.6, 1.3, 0))
  const tmp = useMemo(() => ({ pos: new Vector3(), look: new Vector3(), color: new Color() }), [])

  useFrame((state, dt) => {
    const shots = size.width < 768 ? NARROW_SHOTS : WIDE_SHOTS
    const p = sectionProgress()
    const i = Math.min(Math.floor(p), shots.length - 2)
    const f = ease(p - i)

    tmp.pos.lerpVectors(shots[i].pos, shots[i + 1].pos, f)
    tmp.look.lerpVectors(shots[i].look, shots[i + 1].look, f)
    tmp.pos.x += state.pointer.x * 0.06
    tmp.pos.y += state.pointer.y * 0.04

    const k = 1 - Math.exp(-dt * 3)
    camera.position.lerp(tmp.pos, k)
    look.current.lerp(tmp.look, k)
    camera.lookAt(look.current)

    tmp.color.lerpColors(WATER[i], WATER[i + 1], f)
    ;(scene.background as Color).lerp(tmp.color, k)
    ;(scene.fog as Fog).color.copy(scene.background as Color)
  })

  return null
}

// Deterministic pseudo-random numbers so the particle field is the same every load.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Drifting specks in the water ("marine snow").
function MarineSnow({ count = 700 }) {
  const ref = useRef<Points>(null)
  const still = useMemo(() => prefersReducedMotion(), [])
  const positions = useMemo(() => {
    const rand = seeded(7)
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      a[i * 3] = (rand() - 0.5) * 9
      a[i * 3 + 1] = rand() * 5.5 - 1
      a[i * 3 + 2] = (rand() - 0.5) * 7 - 1
    }
    return a
  }, [count])

  useFrame(({ clock }, dt) => {
    if (!ref.current || still) return
    const attr = ref.current.geometry.attributes.position
    const a = attr.array as Float32Array
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] += dt * (0.03 + (i % 5) * 0.012)
      a[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.02
      if (a[i * 3 + 1] > 4.5) a[i * 3 + 1] = -1
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#d5f3f1" transparent opacity={0.5} depthWrite={false} sizeAttenuation />
    </points>
  )
}

// Sunlight shafts from the surface; they fade out as the page gets deeper.
const SHAFTS = [
  { x: -2.2, z: -2.5, tilt: 0.28, width: 0.7 },
  { x: -0.6, z: -3, tilt: 0.12, width: 0.4 },
  { x: 0.7, z: -2.2, tilt: -0.08, width: 1.0 },
  { x: 2.3, z: -3.2, tilt: -0.26, width: 0.55 },
]

function LightShafts() {
  const group = useRef<Group>(null)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 4
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 4, 256)
    return new CanvasTexture(canvas)
  }, [])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    const surface = MathUtils.clamp(1 - sectionProgress() / 2.5, 0, 1)
    group.current.children.forEach((child, i) => {
      const mesh = child as Mesh
      mesh.rotation.z = SHAFTS[i].tilt + Math.sin(t * 0.2 + i * 1.7) * 0.03
      ;(mesh.material as MeshBasicMaterial).opacity = 0.16 * surface * (0.75 + 0.25 * Math.sin(t * 0.5 + i))
    })
  })

  return (
    <group ref={group}>
      {SHAFTS.map((s) => (
        <mesh key={s.x} position={[s.x, 2.4, s.z]} rotation={[0, 0, s.tilt]}>
          <planeGeometry args={[s.width, 7]} />
          <meshBasicMaterial
            map={texture}
            color="#a6ece4"
            transparent
            opacity={0.16}
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function Scene() {
  return (
    <>
      <div aria-hidden className="fixed inset-0">
        <Canvas
          dpr={[1, 1.75]}
          camera={{ fov: 32, near: 0.1, far: 40, position: [-0.55, 1.5, 2.3] }}
          eventSource={document.getElementById('root')!}
          eventPrefix="client"
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#12505f']} />
          <fog attach="fog" args={['#12505f', 3, 12]} />

          <hemisphereLight args={['#c4f0ee', '#021426', 0.9]} />
          <directionalLight position={[1.5, 6, 2.5]} intensity={2.4} color="#e2f7f4" />
          <directionalLight position={[-2.5, 1.5, -3]} intensity={1.6} color="#7ee8d8" />
          <Environment resolution={64}>
            <Lightformer
              form="rect"
              intensity={2.5}
              position={[0, 5, 0]}
              rotation-x={Math.PI / 2}
              scale={[8, 8, 1]}
              color="#d8f4f1"
            />
            <Lightformer
              form="rect"
              intensity={0.8}
              position={[-4, 1, 2]}
              rotation-y={Math.PI / 2}
              scale={[4, 3, 1]}
              color="#5fb8c4"
            />
            <Lightformer
              form="rect"
              intensity={0.6}
              position={[4, 1, 2]}
              rotation-y={-Math.PI / 2}
              scale={[4, 3, 1]}
              color="#2a6f86"
            />
          </Environment>

          <CameraRig />
          <LightShafts />
          <MarineSnow />
          <Suspense fallback={null}>
            <Avatar />
          </Suspense>
        </Canvas>
      </div>
      <SceneLoader />
    </>
  )
}
