// Momentum scrolling: wheel and trackpad scrolls ease to a stop instead of
// stepping, and section links (#work and friends) glide to their target.
// Lenis drives the page's own scroll position, so everything that reads
// window.scrollY keeps working. Touch scrolling is left native.
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { prefersReducedMotion } from './sections'

// The running instance, so a dialog can hold the page still while it's open.
export let lenis: Lenis | undefined

export function startSmoothScroll() {
  if (prefersReducedMotion()) return
  lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.09 })
}
