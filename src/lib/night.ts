// Night mode: the same world after dark. Stored on <html data-night="true"> so
// CSS can restyle the scene, and remembered between visits.
const KEY = 'night'

export const isNight = () => document.documentElement.dataset.night === 'true'

export function setNight(on: boolean) {
  document.documentElement.dataset.night = String(on)
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // Storage can be unavailable (private mode); night mode just won't persist.
  }
}

export function restoreNight() {
  try {
    if (localStorage.getItem(KEY) === '1') document.documentElement.dataset.night = 'true'
  } catch {
    // Ignore unavailable storage.
  }
}
