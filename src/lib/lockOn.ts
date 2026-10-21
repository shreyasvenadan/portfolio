// Going to a project's page, SeaLens locks on to its card, as it would to a
// fish: yellow brackets snap round it with a label (what it is, how sure,
// its track), blink, then open out to the corners of the screen as it fills
// with deep water, and the page opens. The next page starts in that same
// viewfinder (its <html> gets the `lock-in` class before first paint, see
// sealens/index.html), and once it's ready the water clears and the brackets
// let go.
import { prefersReducedMotion } from './sections'

// Also read by the inline script in sealens/index.html.
const KEY = 'lock-on'
// How far in from the window's edges the brackets sit as a viewfinder.
const INSET = 16

type Box = { x: number; y: number; w: number; h: number }
const place = ({ x, y, w, h }: Box) => ({ left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` })
const grow = ({ x, y, w, h }: Box, by: number): Box => ({ x: x - by, y: y - by, w: w + by * 2, h: h + by * 2 })
const viewfinder = (): Box => ({ x: INSET, y: INSET, w: window.innerWidth - INSET * 2, h: window.innerHeight - INSET * 2 })

function overlay(name: string, at: Box) {
  const wrap = document.createElement('div')
  wrap.className = 'lock'
  wrap.setAttribute('aria-hidden', 'true')
  wrap.innerHTML = `
    <div class="lock-fill"></div>
    <div class="lock-box">
      <i class="lock-c lock-tl"></i><i class="lock-c lock-tr"></i><i class="lock-c lock-bl"></i><i class="lock-c lock-br"></i>
      <span class="lock-label"></span>
    </div>`
  document.body.append(wrap)
  const fill = wrap.querySelector<HTMLElement>('.lock-fill')!
  const box = wrap.querySelector<HTMLElement>('.lock-box')!
  const label = wrap.querySelector<HTMLElement>('.lock-label')!
  Object.assign(box.style, place(at))
  const say = (sure: number) => (label.textContent = `${name} ${sure.toFixed(2)}  #01`)
  say(0.99)
  return { wrap, fill, box, label, say }
}

// Lock on to `card`, then go to `url`.
export function lockOn(url: string, card: Element, name: string) {
  if (prefersReducedMotion()) {
    window.location.href = url
    return
  }
  // Round what's written on the card, not its padding, so the text sits in
  // the middle of the brackets.
  const r = card.getBoundingClientRect()
  const parts = [...card.children].map((c) => c.getBoundingClientRect())
  const top = Math.min(...parts.map((p) => p.top))
  const bottom = Math.max(...parts.map((p) => p.bottom))
  const target = grow({ x: r.left, y: top, w: r.width, h: bottom - top }, 16)
  const { wrap, fill, box, label, say } = overlay(name, target)

  // Snap in from a little wide, overshooting, as the confidence climbs.
  box.animate([{ ...place(grow(target, 48)), opacity: 0 }, { ...place(target), opacity: 1 }], {
    duration: 240,
    easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.25)',
  })
  const start = performance.now()
  const climb = (now: number) => {
    const k = Math.min(1, (now - start) / 420)
    say(0.58 + (0.99 - 0.58) * (1 - (1 - k) ** 3))
    if (k < 1) requestAnimationFrame(climb)
  }
  requestAnimationFrame(climb)
  // Locked: the brackets blink twice.
  for (const c of box.querySelectorAll('.lock-c')) c.animate([{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], { duration: 300, delay: 260 })

  // Then open out to the corners of the screen as the water fills it.
  const open = { duration: 460, delay: 600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' as const }
  box.animate([place(target), place(viewfinder())], open)
  label.animate([{ transform: 'translate(0, 0)' }, { transform: 'translate(10px, 34px)' }], open)
  fill.animate([{ opacity: 0 }, { opacity: 1 }], open).onfinish = () => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), name }))
    } catch {
      // Without storage the next page just opens without the viewfinder.
    }
    window.location.href = url
  }
  // Coming back to this page from the history cache, it'd still be covered.
  window.addEventListener('pageshow', (e) => e.persisted && wrap.remove(), { once: true })
}

// The arriving page says when it's ready to be seen (its scene has drawn).
// Until then the viewfinder holds, rather than clearing while the page is too
// busy setting up to animate smoothly.
let ready = () => {}
const shown = new Promise<void>((resolve) => (ready = resolve))
export const pageReady = () => ready()

// On arrival: if SeaLens brought us here, the water clears and the brackets
// let go once the page is ready (or after a couple of seconds, whatever
// happens). A page the browser built ahead of time (see index.html) waits
// until it's actually shown.
export function lockOff() {
  if ((document as Document & { prerendering?: boolean }).prerendering) {
    document.addEventListener('prerenderingchange', lockOff, { once: true })
    return
  }
  const root = document.documentElement
  const name = root.dataset.lock
  if (!name) return
  const at = viewfinder()
  const { wrap, fill, box, label } = overlay(name, at)
  label.style.transform = 'translate(10px, 34px)'
  fill.style.opacity = '1'
  delete root.dataset.lock
  if (prefersReducedMotion()) {
    wrap.remove()
    return
  }
  const go = () => {
    const ease = { duration: 520, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' as const }
    box.animate([{ ...place(at), opacity: 1 }, { ...place(grow(at, 70)), opacity: 0 }], ease)
    fill.animate([{ opacity: 1 }, { opacity: 0 }], ease).onfinish = () => wrap.remove()
  }
  Promise.race([shown, new Promise((resolve) => window.setTimeout(resolve, 2500))]).then(() => requestAnimationFrame(go))
}
