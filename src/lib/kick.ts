// Going to the football page: Shreyas kicks the ball at the screen, and it
// comes until it covers the whole screen (a white panel of it, scene3d/world.ts),
// and the page opens. The football page starts covered by the same white
// (its <html> gets data-ball before first paint, see football/index.html),
// which shrinks back into the ball, flying off into the distance.
import { prefersReducedMotion } from './sections'

// Also read by the inline script in football/index.html.
const KEY = 'kick-off'
const WHITE = '#fffdf6'

export const FOOTBALL_PAGE = `${import.meta.env.BASE_URL}football/`

// The ball covers the screen: hold its white, and go.
export function ballOver() {
  if (prefersReducedMotion()) {
    window.location.href = FOOTBALL_PAGE
    return
  }
  const cover = document.createElement('div')
  cover.className = 'ball-cover'
  cover.setAttribute('aria-hidden', 'true')
  document.body.append(cover)
  cover.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90, fill: 'forwards' }).onfinish = () => {
    try {
      sessionStorage.setItem(KEY, String(Date.now()))
    } catch {
      // Without storage the next page just opens without the ball.
    }
    window.location.href = FOOTBALL_PAGE
  }
  // Coming back to this page from the history cache, it'd still be covered.
  window.addEventListener('pageshow', (e) => e.persisted && cover.remove(), { once: true })
}

// A football, face on: a white panel in the middle, black pentagons round it.
function ballSvg() {
  const pentagon = (a: number, d: number, size: number) => {
    const cx = Math.cos(a) * d
    const cy = Math.sin(a) * d
    return Array.from({ length: 5 }, (_, i) => {
      const b = a + (i / 5) * Math.PI * 2
      return `${(cx + Math.cos(b) * size).toFixed(3)},${(cy + Math.sin(b) * size).toFixed(3)}`
    }).join(' ')
  }
  const patches = [0, 1, 2].flatMap((k) => {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / 3
    return [pentagon(a, 0.55, 0.21), pentagon(a + Math.PI / 3, 0.98, 0.24)]
  })
  return `<svg viewBox="-1.05 -1.05 2.1 2.1">
    <defs><clipPath id="ball-edge"><circle r="1" /></clipPath></defs>
    <circle r="1" fill="${WHITE}" />
    <g clip-path="url(#ball-edge)" fill="#1d1d22">${patches.map((p) => `<polygon points="${p}" />`).join('')}</g>
    <circle r="1" fill="none" stroke="#120d0a" stroke-width="0.03" />
  </svg>`
}

// On arrival: if the kick brought us here, the white the ball left shrinks
// back into it, and it flies off into the distance.
export function ballOff() {
  const root = document.documentElement
  if (!('ball' in root.dataset)) return
  const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.4
  const ball = document.createElement('div')
  ball.className = 'ball-away'
  ball.setAttribute('aria-hidden', 'true')
  Object.assign(ball.style, { width: `${size}px`, height: `${size}px` })
  ball.innerHTML = ballSvg()
  document.body.append(ball)
  delete root.dataset.ball
  if (prefersReducedMotion()) {
    ball.remove()
    return
  }
  requestAnimationFrame(() => {
    ball.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
        { transform: 'translate(-50%, -50%) scale(0.012) rotate(220deg)', opacity: 1, offset: 0.9 },
        { transform: 'translate(-50%, -50%) scale(0.006) rotate(240deg)', opacity: 0, offset: 1 },
      ],
      { duration: 900, delay: 120, easing: 'cubic-bezier(0.5, 0, 0.75, 0.4)', fill: 'forwards' },
    ).onfinish = () => ball.remove()
  })
}
