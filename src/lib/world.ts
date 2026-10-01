// The world behind the page is laid out in depth units from 0 to 500, one
// 100-unit zone per section: surface, reef (about), open blue (work),
// twilight (experience) and abyss (contact). Each zone is stretched to its
// section's height on the page, so the world scrolls along with the text. The
// surface and the abyss are always exactly one screen tall.
//
// Zone edges in page pixels are published as CSS variables --w0 … --w5 on
// <html>. wy() turns a depth into a CSS length using them (falling back to
// one screen per zone before they're measured); depthPx() is the same in JS.

let bounds: number[] | null = null

function measure() {
  const vh = window.innerHeight
  const top = (id: string) => (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY
  const end = (document.querySelector('footer')?.getBoundingClientRect().bottom ?? 5 * vh) + window.scrollY
  const edges = [0, vh, top('work'), top('experience'), end - vh, end]
  // Keep every zone at least half a screen tall, whatever the layout does.
  for (let i = 1; i < edges.length; i++) edges[i] = Math.max(edges[i], edges[i - 1] + vh / 2)
  bounds = edges
  const root = document.documentElement.style
  edges.forEach((px, i) => root.setProperty(`--w${i}`, `${px.toFixed(1)}px`))
}

// Zone edges in page px (measured on first use).
export function worldBounds() {
  if (!bounds) measure()
  return bounds!
}

// Re-measure whenever the page's layout changes (fonts loading, resizing).
export function watchWorld() {
  measure()
  const observer = new ResizeObserver(measure)
  observer.observe(document.body)
  window.addEventListener('resize', measure)
  return () => {
    observer.disconnect()
    window.removeEventListener('resize', measure)
  }
}

const zoneOf = (depth: number) => Math.min(4, Math.max(0, Math.floor(depth / 100)))

// A depth as a CSS length from the top of the world.
export function wy(depth: number) {
  const i = zoneOf(depth)
  const f = (depth - i * 100) / 100
  const a = `var(--w${i}, ${i * 100}vh)`
  const b = `var(--w${i + 1}, ${(i + 1) * 100}vh)`
  return f === 0 ? a : `calc(${a} + (${b} - ${a}) * ${f.toFixed(4)})`
}

// The CSS length between two depths.
export const wspan = (from: number, to: number) => `calc(${wy(to)} - ${wy(from)})`

// A depth in page pixels.
export function depthPx(depth: number, edges = worldBounds()) {
  const i = zoneOf(depth)
  return edges[i] + ((edges[i + 1] - edges[i]) * (depth - i * 100)) / 100
}

// Page pixels back to a depth.
export function pxDepth(px: number, edges = worldBounds()) {
  let i = 0
  while (i < 4 && px > edges[i + 1]) i++
  return i * 100 + (100 * (px - edges[i])) / (edges[i + 1] - edges[i])
}
