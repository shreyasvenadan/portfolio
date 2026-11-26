// The photo viewer: one big polaroid on a dimmed page, opened from a wall of
// polaroids (the football page, and the Academy's challenges). Arrows, keys
// and swipes step through; Escape, ✕ or the backdrop close it. Rendered
// into <body>, so a blurred panel round the wall can't trap it.
import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface ViewerPhoto {
  // The big image, and the small one already loaded for the wall, shown
  // through until the big one arrives.
  full: string
  thumb: string
  caption: string
  alt?: string
  // Width / height, so the polaroid is full size before the image loads.
  ratio: number
}

export default function PhotoViewer({ items, index, setIndex, onClose }: {
  items: ViewerPhoto[]
  index: number
  setIndex: (i: number) => void
  onClose: () => void
}) {
  const closeBtn = useRef<HTMLButtonElement>(null)
  const touch = useRef<number | null>(null)
  const p = items[index]
  const go = useCallback((d: number) => setIndex((index + d + items.length) % items.length), [index, items.length, setIndex])

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = overflow
      back?.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // Warm the neighbours so stepping through is instant.
  useEffect(() => {
    for (const d of [1, -1]) new Image().src = items[(index + d + items.length) % items.length].full
  }, [index, items])

  const closeOnBackdrop = (e: React.MouseEvent) => e.target === e.currentTarget && onClose()
  return createPortal(
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={closeOnBackdrop}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <div className="viewer-bar font-display">
        <span>
          {index + 1} / {items.length}
        </span>
        <button ref={closeBtn} type="button" onClick={onClose} className="viewer-btn" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="viewer-stage" onClick={closeOnBackdrop}>
        <button type="button" onClick={() => go(-1)} className="viewer-btn viewer-prev" aria-label="Previous photo">
          ←
        </button>
        {/* Sized from the photo's known shape, not the image itself, so it's
            full size before the big version has loaded; the thumbnail
            (already loaded for the wall) shows through until then. */}
        <figure key={p.full} className="viewer-polaroid" style={{ '--ratio': p.ratio } as React.CSSProperties}>
          <img src={p.full} alt={p.alt ?? p.caption} style={{ backgroundImage: `url(${p.thumb})` }} />
          <figcaption className="font-display">{p.caption}</figcaption>
        </figure>
        <button type="button" onClick={() => go(1)} className="viewer-btn viewer-next" aria-label="Next photo">
          →
        </button>
      </div>
    </div>,
    document.body,
  )
}
