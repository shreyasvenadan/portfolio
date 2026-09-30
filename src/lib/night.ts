// Night mode: the same world after dark. Stored on <html data-night="true"> so
// CSS can restyle the scene, remembered between visits, and shared with React
// through a tiny subscribe/get store (it can be toggled from several places).
const KEY = 'night'
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
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // Storage can be unavailable (private mode); night mode just won't persist.
  }
  listeners.forEach((listener) => listener())
}

export const toggleNight = () => setNight(!isNight())

export function restoreNight() {
  try {
    if (localStorage.getItem(KEY) === '1') document.documentElement.dataset.night = 'true'
  } catch {
    // Ignore unavailable storage.
  }
}
