// The look of the 3D island: flat colour with one hard shadow tone (cel
// shading) and a bold ink outline round each shape, like the drawn version.
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const INK = '#120d0a'

// Two tones: shadow, then lit.
export const ramp = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 255, 255, 255, 255]), 2, 1)
ramp.minFilter = THREE.NearestFilter
ramp.magFilter = THREE.NearestFilter
ramp.needsUpdate = true

const toons = new Map<string, THREE.MeshToonMaterial>()

// One shared material per colour.
export function toon(color: string, extra: THREE.MeshToonMaterialParameters = {}) {
  const key = color + JSON.stringify(extra)
  let m = toons.get(key)
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra })
    toons.set(key, m)
  }
  return m
}

// Outlines are the back faces of the shape pushed out along its (smoothed)
// normals by a fixed number of screen pixels, so near and far shapes get the
// same weight of line.
export const outlineUniforms = { resolution: { value: new THREE.Vector2(1600, 900) } }

const outlines = new Map<number, THREE.ShaderMaterial>()
function outlineMaterial(px: number) {
  let m = outlines.get(px)
  if (!m) {
    m = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...outlineUniforms, thickness: { value: px } },
      vertexShader: /* glsl */ `
        uniform vec2 resolution;
        uniform float thickness;
        #include <fog_pars_vertex>
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vec4 clip = projectionMatrix * mvPosition;
          vec2 dir = (projectionMatrix * vec4(normalize(normalMatrix * normal), 0.0)).xy;
          if (length(dir) > 0.0001) clip.xy += normalize(dir) * thickness * clip.w * 2.0 / resolution;
          gl_Position = clip;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        #include <fog_pars_fragment>
        void main() {
          gl_FragColor = vec4(${new THREE.Color(INK)
            .toArray()
            .map((v) => v.toFixed(3))
            .join(', ')}, 1.0);
          #include <fog_fragment>
        }`,
      side: THREE.BackSide,
      fog: true,
    })
    outlines.set(px, m)
  }
  return m
}

const smoothed = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()
function smooth(geometry: THREE.BufferGeometry) {
  let g = smoothed.get(geometry)
  if (!g) {
    g = geometry.clone()
    // Only the shape matters, so corners shared by differently coloured
    // parts are welded too.
    for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name)
    g = mergeVertices(g)
    g.computeVertexNormals()
    smoothed.set(geometry, g)
  }
  return g
}

// A mesh with its ink outline as a child.
export function inked(geometry: THREE.BufferGeometry, material: THREE.Material, px = 2.5) {
  const mesh = new THREE.Mesh(geometry, material)
  const line = new THREE.Mesh(smooth(geometry), outlineMaterial(px))
  line.raycast = () => {}
  line.userData.outline = true
  mesh.add(line)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// A mesh without an outline (distant or soft things).
export function plain(geometry: THREE.BufferGeometry, material: THREE.Material) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  return mesh
}

// Nudges each vertex of a geometry a little, for a hand-made, low-poly feel.
export function jitter(geometry: THREE.BufferGeometry, amount: number, seed = 1) {
  const rand = seeded(seed)
  const pos = geometry.attributes.position
  const moved = new Map<string, [number, number, number]>()
  for (let i = 0; i < pos.count; i++) {
    // Shared corners move together so the surface doesn't tear.
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`
    let d = moved.get(key)
    if (!d) moved.set(key, (d = [(rand() - 0.5) * amount, (rand() - 0.5) * amount, (rand() - 0.5) * amount]))
    pos.setXYZ(i, pos.getX(i) + d[0], pos.getY(i) + d[1], pos.getZ(i) + d[2])
  }
  geometry.computeVertexNormals()
  return geometry
}

// Deterministic pseudo-random numbers, so the island looks the same every load.
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
