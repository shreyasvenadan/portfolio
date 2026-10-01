// The shipwreck starts out drifting in the twilight zone. The first time it
// comes into view it begins to sink, slowly, swaying and trailing bubbles, and
// lands on the sea floor with a thud and a cloud of silt. It stays there for
// the rest of the visit. The motion itself is CSS (.wreck in index.css).
import { prefersReducedMotion } from './sections'
import { thud } from './sound'

export function watchWreck(wreck: HTMLElement) {
  if (prefersReducedMotion()) {
    // No sinking to watch: it's simply already on the bottom.
    wreck.classList.add('sinking', 'landed')
    return () => {}
  }
  const landed = (e: TransitionEvent) => {
    if (e.target !== wreck || e.propertyName !== 'transform') return
    wreck.classList.add('landed')
    // Sound needs an earlier click or key press; scrolling alone doesn't count.
    if (navigator.userActivation?.hasBeenActive ?? true) thud()
  }
  wreck.addEventListener('transitionend', landed)
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      wreck.classList.add('sinking')
      observer.disconnect()
    },
    { threshold: 0.6 },
  )
  observer.observe(wreck)
  return () => {
    observer.disconnect()
    wreck.removeEventListener('transitionend', landed)
  }
}
