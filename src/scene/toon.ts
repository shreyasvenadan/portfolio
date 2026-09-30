import { BackSide, DataTexture, DoubleSide, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat } from 'three'

// Three flat bands of light (shadow, mid, lit) for cel shading.
export const tones = new DataTexture(new Uint8Array([120, 195, 255]), 3, 1, RedFormat)
tones.minFilter = tones.magFilter = NearestFilter
tones.needsUpdate = true

const toonCache = new Map<string, MeshToonMaterial>()

export function toonMaterial(color: string) {
  let material = toonCache.get(color)
  if (!material) {
    material = new MeshToonMaterial({ color, gradientMap: tones, side: DoubleSide })
    toonCache.set(color, material)
  }
  return material
}

const inkCache = new Map<number, MeshBasicMaterial>()

// Ink outline for rigid meshes: the same shape drawn inside-out and pushed out
// along its normals, so only a rim shows around the silhouette.
export function inkMaterial(thickness: number) {
  let material = inkCache.get(thickness)
  if (!material) {
    material = new MeshBasicMaterial({ color: '#141911', side: BackSide })
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed += normalize(normal) * ${thickness.toFixed(4)};`,
      )
    }
    inkCache.set(thickness, material)
  }
  return material
}
