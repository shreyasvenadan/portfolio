import { useFrame, type ThreeElements } from '@react-three/fiber'
import { useMemo, useRef, type ReactElement } from 'react'
import { Group, Vector3 } from 'three'
import { prefersReducedMotion } from '../lib/sections'
import { blinkAmount, updateLook, type Look } from './look'
import { inkMaterial, toonMaterial } from './toon'

// A chibi, cel-shaded version of Shreyas built from simple shapes:
// cream beanie, grey hoodie, dark jacket, moustache and short beard.
const SKIN = '#b57c55'
const SKIN_SHADE = '#9a6445'
const HAIR = '#261a14'
const BEARD = '#6e5040'
const BEANIE = '#ece5d3'
const HOODIE = '#a9a397'
const JACKET = '#334058'
const TROUSERS = '#2a2e38'
const SHOES = '#9ca2a4'
const SOLE = '#f1eee4'
const EYE = '#16110e'

type PartProps = ThreeElements['group'] & {
  color: string
  ink?: number
  children: ReactElement
}

// One shape, cel-shaded, with an optional ink outline around it.
function Part({ color, ink = 0.012, children, ...props }: PartProps) {
  return (
    <group {...props}>
      <mesh material={toonMaterial(color)}>{children}</mesh>
      {ink > 0 && <mesh material={inkMaterial(ink)}>{children}</mesh>}
    </group>
  )
}

// Head centre, relative to the neck pivot.
const C = 0.28

function Face({ eyes }: { eyes: React.RefObject<Group | null> }) {
  return (
    <>
      <group ref={eyes}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.1, C + 0.02, 0.272]}>
            <mesh material={toonMaterial(EYE)} scale={[0.85, 1.3, 0.6]}>
              <sphereGeometry args={[0.042, 20, 20]} />
            </mesh>
            <mesh material={toonMaterial('#ffffff')} position={[0.012, 0.024, 0.022]}>
              <sphereGeometry args={[0.012, 10, 10]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* eyebrows */}
      {[-1, 1].map((s) => (
        <Part key={s} color={HAIR} ink={0} position={[s * 0.105, C + 0.115, 0.262]} rotation={[0, 0, Math.PI / 2 + s * 0.18]}>
          <capsuleGeometry args={[0.019, 0.07, 6, 12]} />
        </Part>
      ))}
      {/* nose */}
      <Part color={SKIN_SHADE} ink={0} position={[0, C - 0.045, 0.3]}>
        <sphereGeometry args={[0.042, 16, 16]} />
      </Part>
      {/* short beard along the jaw */}
      <mesh material={toonMaterial(BEARD)} position={[0, C, 0]}>
        <sphereGeometry args={[0.304, 40, 24, 0, Math.PI, Math.PI * 0.62, Math.PI * 0.33]} />
      </mesh>
      {/* moustache */}
      <Part color={HAIR} ink={0} position={[0, C - 0.105, 0.285]}>
        <torusGeometry args={[0.062, 0.02, 8, 20, Math.PI]} />
      </Part>
      {/* smile */}
      <Part color={'#2a1712'} ink={0} position={[0, C - 0.135, 0.283]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.032, 0.009, 6, 16, Math.PI]} />
      </Part>
    </>
  )
}

function Head({ head, eyes }: { head: React.RefObject<Group | null>; eyes: React.RefObject<Group | null> }) {
  return (
    <group ref={head} position={[0, 1.12, 0]}>
      <Part color={SKIN} position={[0, C, 0]} ink={0.014}>
        <sphereGeometry args={[0.3, 48, 32]} />
      </Part>
      {[-1, 1].map((s) => (
        <Part key={s} color={SKIN} position={[s * 0.29, C - 0.01, 0]} scale={[0.55, 1, 0.8]}>
          <sphereGeometry args={[0.07, 16, 16]} />
        </Part>
      ))}
      <Face eyes={eyes} />
      {/* beanie: dome plus a folded band, pushed back to show the forehead */}
      <group position={[0, C + 0.06, -0.03]} rotation={[-0.38, 0, 0]}>
        <Part color={BEANIE} ink={0.014}>
          <sphereGeometry args={[0.322, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.47]} />
        </Part>
        <Part color={BEANIE} ink={0.012} position={[0, 0.045, 0]}>
          <cylinderGeometry args={[0.33, 0.335, 0.11, 40, 1, true]} />
        </Part>
      </group>
    </group>
  )
}

function Arm({ side, arm }: { side: 1 | -1; arm?: React.RefObject<Group | null> }) {
  return (
    <group ref={arm} position={[side * 0.25, 1.0, 0]} rotation={[0, 0, side * 0.14]}>
      <Part color={JACKET} position={[0, -0.18, 0]}>
        <capsuleGeometry args={[0.072, 0.28, 8, 16]} />
      </Part>
      <Part color={SKIN} position={[0, -0.4, 0.01]}>
        <sphereGeometry args={[0.078, 16, 16]} />
      </Part>
    </group>
  )
}

function Body({ torso, waveArm }: { torso: React.RefObject<Group | null>; waveArm: React.RefObject<Group | null> }) {
  return (
    <>
      {/* legs and sneakers */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.11, 0, 0]}>
          <Part color={TROUSERS} position={[0, 0.34, 0]}>
            <capsuleGeometry args={[0.085, 0.3, 8, 16]} />
          </Part>
          <Part color={SHOES} position={[0, 0.08, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.075, 0.1, 8, 16]} />
          </Part>
          <Part color={SOLE} ink={0} position={[0, 0.035, 0.04]} scale={[1, 0.35, 1]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.11, 8, 16]} />
          </Part>
        </group>
      ))}
      <group ref={torso}>
        {/* hoodie */}
        <Part color={HOODIE} position={[0, 0.8, 0]} scale={[1, 1, 0.85]}>
          <capsuleGeometry args={[0.235, 0.26, 12, 24]} />
        </Part>
        {/* hood bunched behind the neck */}
        <Part color={HOODIE} position={[0, 1.06, -0.05]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
          <torusGeometry args={[0.15, 0.065, 12, 24]} />
        </Part>
        {/* drawstrings */}
        {[-1, 1].map((s) => (
          <mesh key={s} material={toonMaterial(SOLE)} position={[s * 0.05, 0.92, 0.205]} rotation={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.17, 6]} />
          </mesh>
        ))}
        {/* open jacket: a shell with a gap at the front */}
        <Part color={JACKET} position={[0, 0.8, 0]} scale={[1, 1, 0.88]}>
          <cylinderGeometry args={[0.245, 0.27, 0.46, 40, 1, true, 0.42, Math.PI * 2 - 0.84]} />
        </Part>
        {[-1, 1].map((s) => (
          <Part key={s} color={JACKET} position={[s * 0.2, 1.01, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
          </Part>
        ))}
        <Arm side={1} />
        <Arm side={-1} arm={waveArm} />
      </group>
    </>
  )
}

export default function CartoonMe() {
  const head = useRef<Group>(null)
  const eyes = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const waveArm = useRef<Group>(null)
  const look = useRef<Look>({ yaw: 0, pitch: 0 })
  const headPos = useMemo(() => new Vector3(), [])
  const still = useMemo(() => prefersReducedMotion(), [])

  useFrame((state, dt) => {
    const t = still ? 0 : state.clock.elapsedTime
    if (head.current) {
      head.current.getWorldPosition(headPos)
      headPos.y += C
      updateLook(state, headPos, look.current, dt)
      head.current.rotation.set(look.current.pitch, look.current.yaw, Math.sin(t * 0.8) * 0.03, 'YXZ')
    }
    if (eyes.current) eyes.current.scale.y = 1 - blinkAmount(t) * 0.92
    if (torso.current) torso.current.scale.set(1, 1 + Math.sin(t * 1.6) * 0.012, 1)
    if (waveArm.current) {
      // Every 9 seconds, raise the right arm and wave for a moment.
      const phase = t % 9
      const up = phase < 2.2 ? Math.sin((phase / 2.2) * Math.PI) : 0
      waveArm.current.rotation.z = -0.14 - up * 2.5 + up * Math.sin(t * 12) * 0.25
    }
  })

  return (
    <group>
      <Body torso={torso} waveArm={waveArm} />
      <Head head={head} eyes={eyes} />
    </group>
  )
}
