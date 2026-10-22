import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { World } from '../scene3d/world'

// The whole world in 3D (src/scene3d/world.ts): the island at the top and the
// ocean below it, which the camera dives into as the page scrolls. It's drawn
// on two canvases fixed to the screen: one behind the page text with
// everything, and one over it with just the sea creatures swimming in front.
// three.js loads separately, after the page.

export type WorldHandle = Pick<World, 'click' | 'over'>

// `onReady` hears when the scene has drawn its first frame.
const World3D = forwardRef<WorldHandle, { still: boolean; onReady: () => void }>(function World3D({ still, onReady }, ref) {
  const back = useRef<HTMLCanvasElement>(null)
  const front = useRef<HTMLCanvasElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const world = useRef<World | null>(null)

  useImperativeHandle(ref, () => ({
    click: (x, y) => world.current?.click(x, y) ?? false,
    over: (x, y) => world.current?.over(x, y) ?? false,
  }))

  useEffect(() => {
    let gone = false
    import('../scene3d/world').then(({ createWorld }) => {
      if (gone || !back.current || !front.current) return
      world.current = createWorld(back.current, front.current, {
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
        onReady,
      })
    })
    return () => {
      gone = true
      world.current?.dispose()
      world.current = null
    }
  }, [still, onReady])

  // Sized to the largest the viewport gets, so phones' toolbars sliding away
  // don't resize (and rescale) the scene.
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-lvh">
        <canvas ref={back} className="absolute inset-0 h-full w-full" />
        <div ref={flash} className="absolute inset-0 bg-[#fffbe6] opacity-0" />
      </div>
      <canvas ref={front} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[15] h-lvh w-full" />
    </>
  )
})

export default World3D
