import { useEffect, useRef, useState } from 'react'
import { depthAt, sectionProgress, sections } from '../lib/sections'

// Fixed depth gauge on the left edge; doubles as section navigation.
export default function DepthGauge() {
  const marker = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    let frame = 0
    const tick = () => {
      const p = sectionProgress()
      const fraction = p / (sections.length - 1)
      if (marker.current) marker.current.style.top = `${fraction * 100}%`
      if (readout.current) readout.current.textContent = `${Math.round(depthAt(p))} m`
      setActive(Math.round(p))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <nav aria-label="Sections" className="fixed top-1/2 left-20 z-20 hidden h-[56vh] -translate-y-1/2 lg:block">
      <div className="absolute inset-y-0 left-0 w-px bg-foam/20" />
      <div ref={marker} className="absolute left-0 -translate-x-1/2 -translate-y-1/2">
        <div className="h-2.5 w-2.5 rounded-full bg-glow shadow-[0_0_12px_var(--color-glow)]" />
        <span
          ref={readout}
          className="absolute top-1/2 right-5 -translate-y-1/2 font-display text-sm whitespace-nowrap text-glow tabular-nums"
        >
          0 m
        </span>
      </div>
      <ol className="relative h-full">
        {sections.map((s, i) => (
          <li key={s.id} className="absolute left-0 -translate-y-1/2" style={{ top: `${(i / (sections.length - 1)) * 100}%` }}>
            <a
              href={`#${s.id}`}
              aria-current={active === i ? 'true' : undefined}
              className={`block pl-5 text-sm transition-colors hover:text-foam ${active === i ? 'text-foam' : 'text-silt/70'}`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
