import {
  BackSide,
  CanvasTexture,
  DataTexture,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  Object3D,
  RedFormat,
  SkinnedMesh,
  SRGBColorSpace,
  Texture,
} from 'three'
import { findBone } from './rig'

// Three flat bands of light (shadow, mid, lit) for cel shading.
const tones = new DataTexture(new Uint8Array([120, 195, 255]), 3, 1, RedFormat)
tones.minFilter = tones.magFilter = NearestFilter
tones.needsUpdate = true

// Kuwahara filter: each pixel takes the mean of whichever neighbouring quadrant
// is flattest. Edges stay sharp while skin and fabric detail collapse into
// smooth patches of colour, like a hand-painted game texture.
function kuwahara(src: Uint8ClampedArray, size: number, radius: number) {
  const out = new Uint8ClampedArray(src.length)
  const quads = [
    [-radius, 0, -radius, 0],
    [0, radius, -radius, 0],
    [-radius, 0, 0, radius],
    [0, radius, 0, radius],
  ]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let best = Infinity
      let r = 0
      let g = 0
      let b = 0
      for (const [x0, x1, y0, y1] of quads) {
        let sr = 0, sg = 0, sb = 0, sl = 0, sl2 = 0, n = 0
        for (let dy = y0; dy <= y1; dy++) {
          const yy = Math.min(size - 1, Math.max(0, y + dy))
          for (let dx = x0; dx <= x1; dx++) {
            const xx = Math.min(size - 1, Math.max(0, x + dx))
            const i = (yy * size + xx) * 4
            const l = src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11
            sr += src[i]
            sg += src[i + 1]
            sb += src[i + 2]
            sl += l
            sl2 += l * l
            n++
          }
        }
        const variance = sl2 / n - (sl / n) ** 2
        if (variance < best) {
          best = variance
          r = sr / n
          g = sg / n
          b = sb / n
        }
      }
      const o = (y * size + x) * 4
      out[o] = r
      out[o + 1] = g
      out[o + 2] = b
      out[o + 3] = src[o + 3]
    }
  }
  return out
}

// Repaint a photo texture so it reads as flat, painted colour.
function paint(texture: Texture) {
  const image = texture.image as CanvasImageSource & { width: number; height: number }
  const size = Math.min(512, image.width)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.filter = 'saturate(1.15) contrast(1.08) brightness(1.08)'
  ctx.drawImage(image, 0, 0, size, size)
  const pixels = ctx.getImageData(0, 0, size, size)
  pixels.data.set(kuwahara(pixels.data, size, 4))
  ctx.putImageData(pixels, 0, 0)

  const painted = new CanvasTexture(canvas)
  painted.flipY = texture.flipY
  painted.wrapS = texture.wrapS
  painted.wrapT = texture.wrapT
  painted.channel = texture.channel
  painted.colorSpace = SRGBColorSpace
  return painted
}

function toToon(material: Material) {
  const source = material as MeshStandardMaterial
  return new MeshToonMaterial({
    color: source.color,
    map: source.map ? paint(source.map) : null,
    gradientMap: tones,
    side: source.side,
    transparent: source.transparent,
    alphaTest: source.alphaTest,
  })
}

// Ink outline: a copy of each mesh drawn inside-out and pushed out along its
// (skinned) normals, so it follows the pose and animation.
function outlineMaterial(thickness: number) {
  const material = new MeshBasicMaterial({ color: '#0a1311', side: BackSide })
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <skinning_vertex>',
      `#include <skinning_vertex>
      transformed += normalize(objectNormal) * ${thickness.toFixed(4)};`,
    )
  }
  return material
}

export function cartoonify(model: Object3D) {
  const skinned: SkinnedMesh[] = []
  model.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh) return
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(toToon) : toToon(mesh.material)
    if ((mesh as SkinnedMesh).isSkinnedMesh) skinned.push(mesh as SkinnedMesh)
  })

  const ink = outlineMaterial(0.008)
  for (const mesh of skinned) {
    const outline = new SkinnedMesh(mesh.geometry, ink)
    outline.bind(mesh.skeleton, mesh.bindMatrix)
    outline.position.copy(mesh.position)
    outline.quaternion.copy(mesh.quaternion)
    outline.scale.copy(mesh.scale)
    outline.frustumCulled = false
    mesh.parent!.add(outline)
  }

  // Cartoon proportions: a bigger head and slightly chunkier hands.
  findBone(model, 'head')?.scale.setScalar(1.35)
  findBone(model, 'lefthand')?.scale.setScalar(1.15)
  findBone(model, 'righthand')?.scale.setScalar(1.15)
  model.updateMatrixWorld(true)
}
