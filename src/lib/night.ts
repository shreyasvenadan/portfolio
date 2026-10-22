// Night mode: the same world after dark. Stored on <html data-night="true"> so
// CSS can restyle the scene, and shared with React through a tiny
// subscribe/get store (it can be toggled from several places). It follows the
// visitor's clock, unless they've switched it themselves in the last while.
const KEY = 'night'
// How long a choice made by hand wins over the clock.
const REMEMBER = 12 * 60 * 60 * 1000
const listeners = new Set<() => void>()

export const isNight = () => document.documentElement.dataset.night === 'true'

export function subscribeNight(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setNight(on: boolean) {
  document.documentElement.dataset.night = String(on)
  try {
    localStorage.setItem(KEY, `${on ? 1 : 0}:${Date.now()}`)
  } catch {
    // Storage can be unavailable (private mode); night mode just won't persist.
  }
  listeners.forEach((listener) => listener())
}

export const toggleNight = () => setNight(!isNight())

// After dark where the visitor is: 7pm to 6am.
const darkOut = () => {
  const hour = new Date().getHours()
  return hour >= 19 || hour < 6
}

export function restoreNight() {
  let on = darkOut()
  try {
    const [choice, at] = (localStorage.getItem(KEY) ?? '').split(':').map(Number)
    if (Date.now() - at < REMEMBER) on = choice === 1
  } catch {
    // Ignore unavailable storage.
  }
  document.documentElement.dataset.night = String(on)
}
