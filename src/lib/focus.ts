// Reading focus: as the page scrolls, the text block on the reading line sits
// on a soft card that glides from block to block, and the others fade back
// with distance, so it's easy to keep your place. Blocks opt in with a
// data-focus attribute. The reading line sits a little above the middle of
// the screen, sliding down as the page bottoms out so the last blocks, which
// can't scroll up that far, get their turn too.

// Fully lit within this many screen heights of the line; dimmest beyond it.
const REACH = 0.25
const DIMMEST = 0.45
// How far the card reaches past the block's edges, in px. Enough to hold the
// card's feathered edge (--feather in index.css) clear of the text. Blocks
// marked data-focus="fill" sit between divider lines, so the card fills them
// exactly instead.
const PAD_X = 84
const PAD_Y = 68

export function watchFocus() {
  const main = document.querySelector('main')
  if (!main) return
  const card = document.createElement('div')
  card.className = 'reading-card'
  card.setAttribute('aria-hidden', 'true')
  main.prepend(card)

  let frame = 0
  const update = () => {
    frame = 0
    const vh = window.innerHeight
    const below = document.documentElement.scrollHeight - (window.scrollY + vh)
    const line = vh * 0.45 + vh * 0.25 * Math.max(0, 1 - below / vh)
    let active: DOMRect | null = null
    let fill = false
    let closest = vh * REACH
    for (const el of document.querySelectorAll<HTMLElement>('[data-focus]')) {
      const r = el.getBoundingClientRect()
      const gap = Math.max(0, r.top - line, line - r.bottom)
      el.style.opacity = (DIMMEST + (1 - DIMMEST) * Math.max(0, 1 - gap / (vh * REACH))).toFixed(3)
      if (gap < closest) [active, closest, fill] = [r, gap, el.dataset.focus === 'fill']
    }
    // The card sits behind the nearest block, if any is close to the line.
    if (active) {
      // Appearing: fade in where it is rather than gliding in from elsewhere.
      const appearing = !card.classList.contains('shown')
      card.classList.toggle('appearing', appearing)
      if (appearing) requestAnimationFrame(() => card.classList.remove('appearing'))
      card.classList.toggle('fill', fill)
      const [padX, padY] = fill ? [0, 0] : [PAD_X, PAD_Y]
      const m = main.getBoundingClientRect()
      card.style.transform = `translate(${active.left - m.left - padX}px, ${active.top - m.top - padY}px)`
      card.style.width = `${active.width + padX * 2}px`
      card.style.height = `${active.height + padY * 2}px`
    }
    card.classList.toggle('shown', !!active)
  }
  const schedule = () => (frame ||= requestAnimationFrame(update))
  update()
  // Layout shifts (fonts loading, resizing) move the blocks too.
  const resized = new ResizeObserver(schedule)
  resized.observe(main)
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  return () => {
    cancelAnimationFrame(frame)
    resized.disconnect()
    card.remove()
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  }
}
