// Touching a jellyfish: lightning crackles out from the sting with an
// electric zap, the screen flashes and the page shakes. One of a few recorded
// zaps plays, and the longer the clip, the stronger the sting: short ones
// crackle close to the jellyfish, long ones fill the screen, invert it and
// shake it harder, lasting as long as the sound. Built straight in the DOM
// since it's a one-off overlay that removes itself.
import { prefersReducedMotion } from './sections'
import { zapSound } from './sound'

// Used if the sound can't play.
const FALLBACK_SECONDS = 0.7
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

function crackle(x: number, y: number, power: number) {
  const reach = Math.hypot(window.innerWidth, window.innerHeight) * (0.3 + 0.7 * power)
  const paths: string[] = []
  const count = Math.round(3 + 5 * power)
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
  // Where the jellyfish was when touched, so the bolts can stay on it.
  const box = jelly?.getBoundingClientRect()
  zapSound()
    .catch(() => FALLBACK_SECONDS)
    .then((seconds) => sting(x, y, color, seconds, jelly, box))
}

function sting(x: number, y: number, color: string, seconds: number, jelly?: Element, box?: DOMRect) {
  const still = prefersReducedMotion()
  // 0.3 for the shortest clips up to 1 for anything five seconds or longer.
  const power = 0.3 + 0.7 * Math.min(1, Math.max(0, (seconds - 0.3) / 4.7))

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

  // The bolts come from the touched spot on the jellyfish, wherever it has
  // moved to since (scrolling, bobbing).
  const origin = () => {
    const r = jelly?.getBoundingClientRect()
    return r && box ? [x + r.left - box.left, y + r.top - box.top] : [x, y]
  }
  let drawnAt = [x, y]
  const draw = () => {
    drawnAt = origin()
    const d = crackle(drawnAt[0], drawnAt[1], power)
    glow.setAttribute('d', d)
    core.setAttribute('d', d)
    svg.style.transform = ''
  }
  draw()
  // Redraw the bolts a few times so they crackle.
  const timer = still ? 0 : window.setInterval(draw, 80)
  // Between redraws, carry the bolts along with the jellyfish.
  let frame = 0
  const follow = () => {
    const [ox, oy] = origin()
    svg.style.transform = `translate(${ox - drawnAt[0]}px, ${oy - drawnAt[1]}px)`
    frame = requestAnimationFrame(follow)
  }
  frame = requestAnimationFrame(follow)

  // The CSS reads these to size the flash, shake and fade.
  const root = document.documentElement
  root.style.setProperty('--zap-power', power.toFixed(2))
  root.style.setProperty('--zap-time', `${seconds}s`)
  if (!still) root.classList.add('zapped')
  // Only the stronger stings invert the screen.
  if (!still && power > 0.6) root.classList.add('zapped-hard')
  jelly?.classList.add('zapping')

  window.setTimeout(() => {
    window.clearInterval(timer)
    cancelAnimationFrame(frame)
    overlay.remove()
    root.classList.remove('zapped', 'zapped-hard')
    root.style.removeProperty('--zap-power')
    root.style.removeProperty('--zap-time')
    jelly?.classList.remove('zapping')
    busy = false
  }, seconds * 1000)
}
