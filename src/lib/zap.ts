// Touching a jellyfish: lightning crackles out from the sting across the whole
// screen with an electric buzz, the screen flashes and inverts, and the page
// shakes. Built straight in the DOM since it's a one-off overlay that removes
// itself.
import { prefersReducedMotion } from './sections'
import { zapSound } from './sound'

const DURATION = 700
let busy = false

// A jagged bolt from (x, y) heading off at `angle` for `length` pixels.
function bolt(x: number, y: number, angle: number, length: number) {
  const points = [[x, y]]
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  for (let d = 0; d < length; ) {
    d += 30 + Math.random() * 40
    const jitter = (Math.random() - 0.5) * 50
    points.push([x + dx * d - dy * jitter, y + dy * d + dx * jitter])
  }
  return points
}

function crackle(x: number, y: number) {
  const reach = Math.hypot(window.innerWidth, window.innerHeight)
  const paths: string[] = []
  const count = 7
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.7
    const main = bolt(x, y, angle, reach)
    paths.push(`M${main.map((p) => p.map(Math.round).join(' ')).join(' L')}`)
    // A shorter fork splitting off part way along.
    const [fx, fy] = main[2 + Math.floor(Math.random() * 4)] ?? main[main.length - 1]
    const fork = bolt(fx, fy, angle + (Math.random() < 0.5 ? -0.6 : 0.6), reach * 0.25)
    paths.push(`M${fork.map((p) => p.map(Math.round).join(' ')).join(' L')}`)
  }
  return paths.join(' ')
}

export function zap(x: number, y: number, color: string, jelly?: Element) {
  if (busy) return
  busy = true
  const still = prefersReducedMotion()
  zapSound(DURATION / 1000)

  const overlay = document.createElement('div')
  overlay.className = 'zap'
  overlay.setAttribute('aria-hidden', 'true')
  overlay.style.setProperty('--zap', color)
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  const glow = document.createElementNS(ns, 'path')
  const core = document.createElementNS(ns, 'path')
  glow.setAttribute('class', 'zap-glow')
  core.setAttribute('class', 'zap-core')
  svg.append(glow, core)
  overlay.append(svg)
  document.body.append(overlay)

  const draw = () => {
    const d = crackle(x, y)
    glow.setAttribute('d', d)
    core.setAttribute('d', d)
  }
  draw()
  // Redraw the bolts a few times so they crackle.
  const timer = still ? 0 : window.setInterval(draw, 80)

  const root = document.documentElement
  if (!still) root.classList.add('zapped')
  jelly?.classList.add('zapping')

  window.setTimeout(() => {
    window.clearInterval(timer)
    overlay.remove()
    root.classList.remove('zapped')
    jelly?.classList.remove('zapping')
    busy = false
  }, DURATION)
}
