import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  type IUniform,
} from 'three'
import { prefersReducedMotion } from '../lib/sections'

// Deterministic pseudo-random numbers so the scene looks the same every load.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const useStill = () => useMemo(() => prefersReducedMotion(), [])

// ---------------------------------------------------------------------------
// Kelp: tall tapered blades that sway in the current. Some stand right in front
// of the camera so the depth of field smears them into dark shapes.

const KELP_HEIGHT = 6
const KELP = [
  // [x, z, scale, lean]
  [-4.2, -4.5, 1.0, 0.1],
  [-3.1, -5.5, 0.8, -0.05],
  [-1.6, -4.0, 0.9, 0.06],
  [0.9, -5.0, 1.1, -0.08],
  [2.2, -3.6, 0.85, 0.04],
  [3.6, -4.8, 1.05, -0.1],
  [4.8, -3.2, 0.9, 0.08],
  [1.35, 1.1, 0.8, -0.12],
  [-3.2, 0.6, 0.95, 0.15],
  [2.9, -1.2, 0.7, 0.05],
] as const

function Kelp() {
  const ref = useRef<InstancedMesh>(null)
  const time = useRef<IUniform<number>>({ value: 0 })
  const still = useStill()

  const geometry = useMemo(() => {
    const g = new PlaneGeometry(0.22, KELP_HEIGHT, 1, 40)
    g.translate(0, KELP_HEIGHT / 2, 0)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getY(i) / KELP_HEIGHT
      // Taper toward the tip and ripple the edges.
      pos.setX(i, pos.getX(i) * (1.1 - h * 0.8) * (1 + Math.sin(h * 40) * 0.25))
    }
    g.computeVertexNormals()
    return g
  }, [])

  const material = useMemo(() => {
    const m = new MeshStandardMaterial({ color: '#8a7a5c', roughness: 1, side: DoubleSide })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.time = time.current
      shader.vertexShader = `uniform float time;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float h = clamp(position.y / ${KELP_HEIGHT.toFixed(1)}, 0.0, 1.0);
        float ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 0.9;
        transformed.x += sin(h * 3.2 + time * 0.7 + ph) * h * h * 0.55;
        transformed.z += cos(h * 2.1 + time * 0.45 + ph) * h * 0.2;`,
      )
    }
    return m
  }, [])

  useLayoutEffect(() => {
    const m = new Matrix4()
    KELP.forEach(([x, z, s, lean], i) => {
      m.makeRotationZ(lean).scale({ x: s, y: s, z: s } as never).setPosition(x, -1.6, z)
      ref.current!.setMatrixAt(i, m)
    })
    ref.current!.instanceMatrix.needsUpdate = true
  }, [])

  useFrame(({ clock }) => {
    if (!still) time.current.value = clock.elapsedTime
  })

  return <instancedMesh ref={ref} args={[geometry, material, KELP.length]} frustumCulled={false} />
}

// ---------------------------------------------------------------------------
// Drifters: wobbling, glowing jelly-like blobs that float across the scene.

const drifterVertex = /* glsl */ `
  uniform float time;
  uniform float seed;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 p = position;
    float wobble = sin(p.y * 7.0 + time * 1.6 + seed) * 0.07 + sin(p.x * 5.0 - time * 1.2 + seed * 2.0) * 0.06;
    p += normal * wobble;
    p.xz *= 1.0 + 0.14 * sin(time * 1.8 + seed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const drifterFragment = /* glsl */ `
  uniform vec3 color;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.2);
    gl_FragColor = vec4(color * (0.35 + rim * 1.8), 0.1 + rim * 0.75);
  }
`

const DRIFTER_COLORS = ['#fff1d6', '#ffcfa3', '#e3ecc8', '#d6c7f0']

type Drifter = { mesh: Mesh | null; base: [number, number, number]; speed: number; size: number; seed: number }

function Drifters({ count = 14 }) {
  const still = useStill()
  const drifters = useMemo<Drifter[]>(() => {
    const rand = seeded(21)
    return Array.from({ length: count }, (_, i) => ({
      mesh: null,
      // A few pass close to the camera so they blur into soft blobs; those stay
      // out at the edges of the frame so they never cover the avatar.
      base: [
        i < 3 ? (i % 2 ? 1.6 + rand() * 1.2 : -2.2 - rand() * 1.2) : (rand() - 0.5) * 8,
        rand() * 5 - 1,
        i < 3 ? 0.6 + rand() * 0.8 : -1 - rand() * 4,
      ],
      speed: 0.05 + rand() * 0.08,
      size: i < 3 ? 0.07 + rand() * 0.06 : 0.06 + rand() * 0.14,
      seed: rand() * 100,
    }))
  }, [count])

  const materials = useMemo(
    () =>
      drifters.map(
        (d, i) =>
          new ShaderMaterial({
            vertexShader: drifterVertex,
            fragmentShader: drifterFragment,
            uniforms: {
              time: { value: 0 },
              seed: { value: d.seed },
              color: { value: new Color(DRIFTER_COLORS[i % DRIFTER_COLORS.length]) },
            },
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
          }),
      ),
    [drifters],
  )

  useFrame(({ clock }) => {
    const t = still ? 0 : clock.elapsedTime
    drifters.forEach((d, i) => {
      if (!d.mesh) return
      const [x, y, z] = d.base
      // Slow rise with a lazy figure-eight, wrapping back to the bottom.
      const rise = ((y + t * d.speed + 1.5) % 6.5) - 1.5
      d.mesh.position.set(x + Math.sin(t * 0.21 + d.seed) * 0.6, rise, z + Math.cos(t * 0.17 + d.seed) * 0.4)
      d.mesh.rotation.set(Math.sin(t * 0.3 + d.seed) * 0.4, t * 0.2, Math.cos(t * 0.25 + d.seed) * 0.3)
      materials[i].uniforms.time.value = t
    })
  })

  return (
    <group>
      {drifters.map((d, i) => (
        <mesh key={d.seed} ref={(m) => void (d.mesh = m)} material={materials[i]} scale={[d.size, d.size * 0.75, d.size]}>
          <icosahedronGeometry args={[1, 4]} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Current: soft specks carried along a swirling flow field.

const pointVertex = /* glsl */ `
  attribute float size;
  uniform float pixelRatio;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * pixelRatio * (70.0 / -mv.z);
    vFade = clamp(1.0 - (-mv.z - 2.0) / 9.0, 0.15, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`
const speckFragment = /* glsl */ `
  uniform vec3 color;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(color, smoothstep(0.5, 0.0, d) * vFade * 0.75);
  }
`

function usePointsMaterial(fragmentShader: string, color: string, additive = false) {
  const pixelRatio = useThree((s) => s.viewport.dpr)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader,
        uniforms: { color: { value: new Color(color) }, pixelRatio: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: additive ? AdditiveBlending : undefined,
      }),
    [fragmentShader, color, additive],
  )
  useLayoutEffect(() => void (material.uniforms.pixelRatio.value = pixelRatio), [material, pixelRatio])
  return material
}

function Current({ count = 550 }) {
  const ref = useRef<Points>(null)
  const still = useStill()
  const material = usePointsMaterial(speckFragment, '#f6f3e4', true)
  const { positions, sizes } = useMemo(() => {
    const rand = seeded(7)
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 10
      positions[i * 3 + 1] = rand() * 6 - 1.5
      positions[i * 3 + 2] = rand() * 8 - 6
      sizes[i] = rand() < 0.03 ? 2 + rand() * 2.5 : 0.5 + rand() * 1.3
    }
    return { positions, sizes }
  }, [count])

  useFrame(({ clock }, dt) => {
    if (!ref.current || still) return
    const attr = ref.current.geometry.attributes.position
    const a = attr.array as Float32Array
    const t = clock.elapsedTime
    const step = Math.min(dt, 0.05)
    for (let i = 0; i < count; i++) {
      const x = a[i * 3]
      const y = a[i * 3 + 1]
      const z = a[i * 3 + 2]
      a[i * 3] += (Math.sin(y * 1.1 + z * 0.5 + t * 0.15) * 0.25 + 0.12) * step
      a[i * 3 + 1] += (Math.cos(x * 0.9 + t * 0.2) * 0.1 + 0.02) * step
      a[i * 3 + 2] += Math.sin(x * 0.7 - y * 0.8 + t * 0.1) * 0.12 * step
      if (a[i * 3] > 5) a[i * 3] = -5
      if (a[i * 3 + 1] > 4.5) a[i * 3 + 1] = -1.5
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref} material={material} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  )
}

export default function Flow() {
  return (
    <>
      <Kelp />
      <Drifters />
      <Current />
    </>
  )
}
