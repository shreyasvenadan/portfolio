// What Shreyas says when something happens on the island ("nice shot!" as
// the pirate ship goes down). It shows in his speech balloon in place of the
// tagline for a few seconds (Hero.tsx). A tiny subscribe/get store, like night.ts.
// `greeting` is his hello as the page opens, which pops in with the balloon
// rather than straight away.
export type Quip = { text: string; id: number; greeting?: boolean }

const listeners = new Set<() => void>()
let current: Quip | null = null
let timer = 0
let count = 0

export const currentQuip = () => current

export function subscribeQuip(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function say(text: string, seconds = 3) {
  current = { text, id: ++count }
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    current = null
    listeners.forEach((listener) => listener())
  }, seconds * 1000)
  listeners.forEach((listener) => listener())
}

// He says hello from the start, so the tagline never shows first.
current = { text: "hi, my name's Shreyas Venadan!", id: ++count, greeting: true }
timer = window.setTimeout(() => {
  current = null
  listeners.forEach((listener) => listener())
}, 5700)
