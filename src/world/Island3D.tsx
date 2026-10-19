import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Island } from '../scene3d/world'
import Surface from './Surface'

// The surface in 3D (src/scene3d/world.ts), one screen tall at the top of the
// world. Its bottom edge is the sea and the island's sand, which the
// underwater world below carries on from; the band along the bottom blends
// the two, as the drawn version did. three.js loads separately, after the
// page; without WebGL, the drawn island (Surface.tsx) stands in, still.

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

const Island3D = forwardRef<Pick<Island, 'click' | 'over' | 'setActive'>, { still: boolean }>(function Island3D({ still }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const island = useRef<Island | null>(null)
  const [failed] = useState(() => !hasWebGL())

  useImperativeHandle(ref, () => ({
    click: (x, y) => island.current?.click(x, y) ?? false,
    over: (x, y) => island.current?.over(x, y) ?? false,
    setActive: (on) => island.current?.setActive(on),
  }))

  useEffect(() => {
    if (!canvas.current) return
    let gone = false
    import('../scene3d/world').then(({ createIsland }) => {
      if (gone || !canvas.current) return
      island.current = createIsland(canvas.current, {
        still,
        // Lightning lights up the whole scene for a moment.
        flash: (strength) => flash.current?.animate([{ opacity: strength }, { opacity: 0 }], { duration: 170, easing: 'ease-out' }),
        // Where his head is, for the speech balloon in the hero (Hero.tsx).
        onHead: (x, y, top) => {
          const root = document.documentElement.style
          const set = (name: string, v: number) => {
            const px = `${Math.round(v)}px`
            if (root.getPropertyValue(name) !== px) root.setProperty(name, px)
          }
          set('--head-x', x)
          set('--head-y', y)
          set('--head-top', top)
        },
      })
    })
    return () => {
      gone = true
      island.current?.dispose()
      island.current = null
    }
  }, [still])

  if (failed) return <Surface animate={false} />

  return (
    <div className="absolute inset-x-0 top-0 h-screen w-full">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <div ref={flash} className="absolute inset-0 bg-[#fffbe6] opacity-0" />
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="seam-sea" gradientUnits="userSpaceOnUse" x1="0" y1="800" x2="0" y2="900">
            <stop offset="0" stopColor="#2b93a6" stopOpacity={0} />
            <stop offset="1" stopColor="#2b93a6" />
          </linearGradient>
          <linearGradient id="seam-rock" gradientUnits="userSpaceOnUse" x1="0" y1="792" x2="0" y2="900">
            <stop offset="0" stopColor="#5f7e74" stopOpacity={0} />
            <stop offset="1" stopColor="#5f7e74" />
          </linearGradient>
        </defs>
        <rect y={800} width={1600} height={100} fill="url(#seam-sea)" />
        <path d="M290 900 L330 800 L1270 800 L1310 900 Z" fill="url(#seam-rock)" />
      </svg>
    </div>
  )
})

export default Island3D
