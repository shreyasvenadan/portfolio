// Momentum scrolling: wheel and trackpad scrolls ease to a stop instead of
// stepping, and section links (#work and friends) glide to their target.
// Lenis drives the page's own scroll position, so everything that reads
// window.scrollY keeps working. Touch scrolling is left native.
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { prefersReducedMotion } from './sections'

export function startSmoothScroll() {
  if (prefersReducedMotion()) return
  new Lenis({ autoRaf: true, anchors: true, lerp: 0.09 })
}
