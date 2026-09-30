import { useState } from 'react'

// Salt-and-pepper grain over the whole page, text included, so the copy sits
// "inside" the same gritty image as the 3D scene.
function makeNoise(seed: number) {
  const size = 180
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    seed = (seed * 16807) % 2147483647
    const r = seed / 2147483647
    const o = i * 4
    if (r < 0.03) {
      image.data.set([8, 12, 10, 120], o)
    } else if (r > 0.985) {
      image.data.set([235, 240, 225, 70], o)
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL()
}

export default function Grain() {
  const [noise] = useState(() => makeNoise(42))
  return <div aria-hidden className="grain" style={{ backgroundImage: `url(${noise})` }} />
}
