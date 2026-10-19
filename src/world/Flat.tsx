import { useEffect, useRef, useState } from 'react'
import { breakBottle } from '../lib/bottle'
import { shipHorn } from '../lib/sound'
import { wspan, wy } from '../lib/world'
import { stingerOf, zap } from '../lib/zap'
import Sealife, { divers, fishing } from './Sealife'
import Surface from './Surface'
import Underwater from './Underwater'

// The drawn world, for browsers without WebGL: the island (holding still) and
// the ocean below it, laid out on the page and scrolling with it, each section
// in its own depth zone (src/lib/world.ts).
const WATER = `linear-gradient(to bottom,
  transparent 0, transparent ${wy(100)},
  #2b93a6 ${wy(100)}, #1f7497 ${wy(170)}, #16507c ${wy(250)},
  #0d2d52 ${wy(340)}, #07162c ${wy(420)}, #040a16 ${wy(500)})`

export default function Flat() {
  const world = useRef<HTMLDivElement>(null)
  const [behind, setBehind] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    // --s: screen pixels per unit of the 1600×900 surface drawing, so the
    // island's underwater base can match its width at any screen size.
    const size = () => world.current?.style.setProperty('--s', String(Math.max(window.innerWidth / 1600, window.innerHeight / 900)))
    size()
    window.addEventListener('resize', size)

    // The sea creatures sit behind the page content, so clicks are hit-tested
    // by position. Touching a jellyfish (tentacles too) stings...
    const overJelly = (x: number, y: number) => {
      for (const jelly of world.current?.querySelectorAll('[data-jelly]') ?? []) {
        const r = jelly.getBoundingClientRect()
        if (x > r.left - 4 && x < r.right + 4 && y > r.top - 4 && y < r.bottom + 4) return jelly
      }
    }
    // ...as are the shipwreck...
    const overShip = (x: number, y: number) => {
      const ship = world.current?.querySelector('[data-ship]')
      const r = ship?.getBoundingClientRect()
      return r && x > r.left && x < r.right && y > r.top + r.height * 0.15 && y < r.bottom ? ship : undefined
    }
    // ...the message in a bottle on the sea floor (not while it's broken)...
    const overBottle = (x: number, y: number) => {
      const bottle = world.current?.querySelector<SVGSVGElement>('[data-bottle]')
      const r = bottle?.getBoundingClientRect()
      return r && bottle?.style.opacity !== '0' && x > r.left - 6 && x < r.right + 6 && y > r.top - 6 && y < r.bottom + 6 ? bottle : undefined
    }
    const click = (e: MouseEvent) => {
      if ((e.target as Element).closest('a, button, dialog')) return
      const [x, y] = [e.clientX, e.clientY]
      // Poking a diver (unless there's a fish on the hook to let go) beats
      // hooking a fish swimming past them; otherwise the hook takes the click.
      if (!fishing.holding() && divers.click(x, y)) return
      if (fishing.click(x, y)) {
        document.body.style.cursor = ''
        return
      }
      const jelly = overJelly(x, y)
      const ship = overShip(x, y)
      const bottle = overBottle(x, y)
      if (bottle) breakBottle(bottle)
      else if (jelly) zap(x, y, jelly.getAttribute('data-jelly')!, stingerOf(jelly, x, y))
      else if (ship) {
        shipHorn()
        ship.classList.remove('honk')
        void ship.getBoundingClientRect()
        ship.classList.add('honk')
      }
    }
    const hover = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button, dialog')) return
      const [x, y] = [e.clientX, e.clientY]
      document.body.style.cursor = fishing.over(x, y) || divers.over(x, y) || overJelly(x, y) || overShip(x, y) || overBottle(x, y) ? 'var(--cursor-pointer)' : ''
    }
    window.addEventListener('click', click)
    window.addEventListener('pointermove', hover)
    return () => {
      window.removeEventListener('resize', size)
      window.removeEventListener('click', click)
      window.removeEventListener('pointermove', hover)
    }
  }, [])

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" style={{ height: wy(500) }}>
        <div ref={world} className="absolute inset-0" style={{ background: WATER }}>
          <Surface animate={false} />
          <Underwater />
          {/* Sea creatures that swim behind the page text (the rest are in front). */}
          <div ref={setBehind} className="absolute inset-x-0 top-0" />
          {/* At night the shallow water darkens too; the deep is dark already. */}
          <div
            className="night-tint absolute inset-x-0"
            style={{ top: wy(100), height: wspan(100, 350), background: 'linear-gradient(to bottom, #27346e, transparent)' }}
          />
        </div>
      </div>
      {/* The creatures that swim above the page text, scrolling with the world. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[15] overflow-hidden" style={{ height: wy(500) }}>
        <div className="swimmers absolute inset-0">
          <Sealife back={behind} />
        </div>
      </div>
    </>
  )
}
