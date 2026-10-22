// The island's secrets, counted as they're found ("discoveries 3/16", in
// Discoveries.tsx), and remembered between visits. A tiny subscribe/get
// store, like night.ts; the 3D scene calls discover() as things happen.
export const DISCOVERIES = [
  { id: 'jump', name: 'Hop', hint: 'Say hi to Shreyas.' },
  { id: 'night', name: 'Lights out', hint: 'The sun looks clickable.' },
  { id: 'rain', name: 'Rain dance', hint: 'Clouds can be poked.' },
  { id: 'lightning', name: 'Thunderstruck', hint: 'Poke a raincloud again.' },
  { id: 'rainbow', name: 'Over the rainbow', hint: 'Let the rain stop, by day.' },
  { id: 'coconut', name: 'Coconut drop', hint: 'Look up in the palms.' },
  { id: 'football', name: 'Long ball', hint: "There's a ball on the beach." },
  { id: 'gull', name: 'Thief!', hint: 'The gulls are hungry.' },
  { id: 'plane', name: 'Mayday', hint: 'Something flies past now and then.' },
  { id: 'ship', name: 'Down she goes', hint: 'Pirates sail by now and then.' },
  { id: 'treasure', name: 'Finders keepers', hint: 'Sunken ships leave things behind.' },
  { id: 'crab', name: 'Flipped', hint: 'Something scuttles on the sand.' },
  { id: 'pinch', name: 'Snip snip', hint: 'Corner the crab.' },
  { id: 'sand', name: 'Sand scribbles', hint: 'Drag across the beach.' },
  { id: 'wish', name: 'Make a wish', hint: 'Catch a shooting star.' },
  { id: 'turtles', name: 'Hatchlings', hint: 'Stay on the beach after dark.' },
] as const

export type DiscoveryId = (typeof DISCOVERIES)[number]['id']

const KEY = 'discoveries'
const listeners = new Set<() => void>()

let found: ReadonlySet<DiscoveryId> = (() => {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
    return new Set(DISCOVERIES.map((d) => d.id).filter((id) => ids.includes(id)))
  } catch {
    return new Set<DiscoveryId>()
  }
})()
// The one just found, for the "found:" toast.
let latest: { id: DiscoveryId; at: number } | null = null

export const foundDiscoveries = () => found
export const latestDiscovery = () => latest

export function subscribeDiscoveries(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function discover(id: DiscoveryId) {
  if (found.has(id)) return
  found = new Set([...found, id])
  latest = { id, at: Date.now() }
  try {
    localStorage.setItem(KEY, JSON.stringify([...found]))
  } catch {
    // Storage can be unavailable (private mode); they just won't be remembered.
  }
  listeners.forEach((listener) => listener())
}
