// Clicking the plane shoots it down: it bursts, nose-dives trailing smoke and
// splashes into the sea behind the island. The real plane is hidden and comes
// back on its next pass; the wreck is a copy that removes itself.
import { burst, smoke, splashRings } from './effects'
import { planeCrash, splash } from './sound'

const NS = 'http://www.w3.org/2000/svg'
// Where the wreck hits the water, in the scene's units: just below the horizon.
const SEA_Y = 600
// Long enough for the hidden plane to have finished crossing the sky.
const RETURN = 15000
const GRAVITY = 0.12

export function crashPlane(plane: SVGGElement) {
  const svg = plane.ownerSVGElement
  const layer = svg?.querySelector('.crash-layer')
  const toRoot = svg?.getScreenCTM()?.inverse().multiply(plane.getScreenCTM()!)
  const flight = plane.closest<SVGGElement>('#plane')
  if (!svg || !layer || !toRoot || !flight || flight.dataset.crashed) return
  flight.dataset.crashed = 'true'
  flight.style.opacity = '0'
  window.setTimeout(() => {
    flight.style.opacity = ''
    delete flight.dataset.crashed
  }, RETURN)

  // The wreck: a still copy of the plane (its propeller keeps spinning).
  const wreck = document.createElementNS(NS, 'g')
  const body = plane.cloneNode(true) as SVGGElement
  body.removeAttribute('data-plane-body')
  body.querySelector(':scope > animateTransform')?.remove()
  wreck.append(body)
  // Smoke and spray go behind the wreck; the burst goes in front of it.
  const behind = document.createElementNS(NS, 'g')
  const front = document.createElementNS(NS, 'g')
  layer.append(behind, wreck, front)
  // Left in place until the last effect inside it has finished.
  window.setTimeout(() => {
    behind.remove()
    front.remove()
  }, 8000)

  let { x, y } = new DOMPoint(0, 0).matrixTransform(toRoot)
  let vx = 3
  let vy = -1.5
  let frame = 0
  planeCrash(Math.sqrt((2 * (SEA_Y - y)) / GRAVITY) / 60)
  burst(front, x, y)

  const step = () => {
    frame++
    vy += GRAVITY
    vx *= 0.995
    x += vx
    y += vy
    // Nose follows the dive, with a wobble as it tumbles.
    const angle = (Math.atan2(vy, vx) * 180) / Math.PI + Math.sin(frame / 4) * 8
    wreck.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`)

    // A puff of smoke from the tail every few frames.
    if (frame % 3 === 0) {
      const rad = (angle * Math.PI) / 180
      smoke(behind, x - Math.cos(rad) * 50, y - Math.sin(rad) * 50)
    }

    if (y >= SEA_Y) {
      wreck.remove()
      splash()
      splashRings(behind, x, SEA_Y)
    } else requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
