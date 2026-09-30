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
  Vector3,
} from 'three'
import { sectionProgress } from '../lib/sections'
import SceneLoader from '../components/SceneLoader'
import Avatar from './Avatar'
import Effects from './Effects'
import Flow from './Flow'
import { focusPoint } from './focus'

// Backdrop colour at each section: pale sage at the top, deepening to olive.
const WATER = ['#a6ae90', '#9ba587', '#8f9a7c', '#848f72', '#7a8569'].map((c) => new Color(c))

type Shot = { pos: Vector3; look: Vector3; focus: Vector3 }
const shot = (pos: Vec3, look: Vec3, focus: Vec3): Shot => ({
  pos: new Vector3(...pos),
  look: new Vector3(...look),
  focus: new Vector3(...focus),
})
type Vec3 = [number, number, number]

// One camera position per section, all centred on the character. The hero and
// contact frame the whole character in focus; in between, the camera drifts in
// close and focuses near the lens so the character becomes a blurred backdrop.
const WIDE_SHOTS = [
  shot([0, 1.2, 3.4], [0, 0.95, 0], [0, 1.2, 0.1]),
  shot([-0.35, 1.55, 1.25], [0, 1.45, 0], [-0.3, 1.55, 1.05]),
  shot([0.45, 1.05, 1.5], [0, 1.15, 0], [0.4, 1.05, 1.3]),
  shot([0, 2.3, 2.0], [0, 1.2, 0], [0, 2.15, 1.75]),
  shot([0, 1.3, 3.6], [0, 0.85, 0], [0, 1.25, 0.1]),
]
const NARROW_SHOTS = [
  shot([0, 1.15, 4.4], [0, 0.95, 0], [0, 1.2, 0.1]),
  shot([-0.2, 1.5, 1.6], [0, 1.4, 0], [-0.18, 1.5, 1.4]),
  shot([0.3, 1.0, 1.9], [0, 1.1, 0], [0.27, 1.0, 1.7]),
  shot([0, 2.4, 2.6], [0, 1.1, 0], [0, 2.25, 2.35]),
  shot([0, 1.2, 4.6], [0, 0.85, 0], [0, 1.25, 0.1]),
]

const ease = (x: number) => x * x * (3 - 2 * x)

function CameraRig() {
  const { camera, size, scene } = useThree()
  const look = useRef(new Vector3(0, 1.2, 0))
  const tmp = useMemo(() => ({ pos: new Vector3(), look: new Vector3(), focus: new Vector3(), color: new Color() }), [])

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
    focusPoint.lerp(tmp.focus.lerpVectors(shots[i].focus, shots[i + 1].focus, f), k)
    camera.lookAt(look.current)

    tmp.color.lerpColors(WATER[i], WATER[i + 1], f)
    ;(scene.background as Color).lerp(tmp.color, k)
    ;(scene.fog as Fog).color.copy(scene.background as Color)
  })

  return null
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
            color="#e3edc6"
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
          dpr={0.5}
          camera={{ fov: 32, near: 0.1, far: 40, position: [0, 1.25, 3.1] }}
          eventSource={document.getElementById('root')!}
          eventPrefix="client"
          gl={{ antialias: false }}
          style={{ imageRendering: 'pixelated' }}
        >
          <color attach="background" args={['#a6ae90']} />
          <fog attach="fog" args={['#a6ae90', 2.5, 10]} />

          <hemisphereLight args={['#f3f0dc', '#3a4331', 1.0]} />
          <directionalLight position={[1.5, 6, 2.5]} intensity={2.4} color="#e2f7f4" />
          <directionalLight position={[-2.5, 1.5, -3]} intensity={1.4} color="#ffdcb8" />
          {/* Soft warm fill from the camera side so the face isn't lost in shadow. */}
          <directionalLight position={[-1, 1.8, 4]} intensity={1.1} color="#ffe2c4" />
          <Environment resolution={64}>
            <Lightformer
              form="rect"
              intensity={2.5}
              position={[0, 5, 0]}
              rotation-x={Math.PI / 2}
              scale={[8, 8, 1]}
              color="#f4f1e0"
            />
            <Lightformer
              form="rect"
              intensity={0.8}
              position={[-4, 1, 2]}
              rotation-y={Math.PI / 2}
              scale={[4, 3, 1]}
              color="#c9d1b0"
            />
            <Lightformer
              form="rect"
              intensity={0.6}
              position={[4, 1, 2]}
              rotation-y={-Math.PI / 2}
              scale={[4, 3, 1]}
              color="#8e9a7c"
            />
          </Environment>

          <CameraRig />
          <LightShafts />
          <Flow />
          <Suspense fallback={null}>
            <Avatar />
          </Suspense>
          <Effects />
        </Canvas>
      </div>
      <SceneLoader />
    </>
  )
}
