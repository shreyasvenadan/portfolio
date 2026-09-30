// The page is a dive: each section sits a little deeper than the last.
export const sections = [
  { id: 'top', label: 'Surface', depth: 0 },
  { id: 'about', label: 'About', depth: 15 },
  { id: 'work', label: 'Work', depth: 40 },
  { id: 'experience', label: 'Experience', depth: 90 },
  { id: 'contact', label: 'Contact', depth: 200 },
] as const

let tops: number[] = []

function measure() {
  tops = sections.map(({ id }) => {
    const el = document.getElementById(id)
    return el ? el.getBoundingClientRect().top + window.scrollY : 0
  })
}

// Re-measure section positions whenever the layout changes.
export function watchSections() {
  measure()
  const observer = new ResizeObserver(measure)
  observer.observe(document.body)
  return () => observer.disconnect()
}

// Continuous scroll position in "section units": 0 = hero, 1 = about, … 4 = contact.
export function sectionProgress() {
  if (tops.length === 0) measure()
  const last = tops.length - 1
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) return last
  const y = window.scrollY + window.innerHeight * 0.4
  for (let i = last; i >= 0; i--) {
    // The hero starts "at" the anchor line, so an unscrolled page reads 0.
    const start = i === 0 ? window.innerHeight * 0.4 : tops[i]
    if (y >= start) {
      if (i === last) return last
      return i + Math.min(1, (y - start) / (tops[i + 1] - start))
    }
  }
  return 0
}

export function depthAt(progress: number) {
  const i = Math.min(Math.floor(progress), sections.length - 2)
  const f = progress - i
  return sections[i].depth + (sections[i + 1].depth - sections[i].depth) * f
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
