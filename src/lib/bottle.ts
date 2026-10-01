// The message in a bottle on the sea floor. Clicking it smashes the glass:
// shards scatter, the cork pops off and the rolled-up note floats out, then
// the note unrolls in a dialog (its words are in data/content.ts). Closing
// the note washes a fresh bottle back in.
import { bottleNote } from '../data/content'
import { prefersReducedMotion } from './sections'
import { glassBreak } from './sound'

const INK = '#120d0a'
let reading = false

export function breakBottle(bottle: SVGSVGElement) {
  if (reading) return
  reading = true
  glassBreak()
  const still = prefersReducedMotion()
  const r = bottle.getBoundingClientRect()
  bottle.style.transition = 'none'
  bottle.style.opacity = '0'
  if (!still) shatter(r)
  window.setTimeout(() => showNote(bottle), still ? 0 : 650)
}

// Pieces flying out of the bottle, drawn in a short-lived layer over the page.
function shatter(r: DOMRect) {
  const size = r.width
  const layer = document.createElement('div')
  layer.className = 'shatter'
  layer.setAttribute('aria-hidden', 'true')
  layer.style.left = `${r.left + r.width / 2}px`
  layer.style.top = `${r.top + r.height / 2}px`
  document.body.append(layer)

  const piece = (svg: string, width: number, frames: Keyframe[], duration: number) => {
    const el = document.createElement('div')
    el.className = 'shatter-piece'
    el.style.width = `${width}px`
    el.innerHTML = svg
    layer.append(el)
    el.animate(frames, { duration, easing: 'cubic-bezier(.2, .7, .4, 1)', fill: 'forwards' })
  }
  const at = (x: number, y: number, extra = '') => `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) ${extra}`

  // Glass shards burst outwards, then sink as they fade.
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2
    const reach = size * (0.4 + Math.random() * 0.7)
    const points = Array.from({ length: 3 }, () => `${Math.round(Math.random() * 20)},${Math.round(Math.random() * 20)}`).join(' ')
    const dx = Math.cos(angle) * reach
    const dy = Math.sin(angle) * reach * 0.6
    piece(
      `<svg viewBox="-2 -2 24 24"><polygon points="${points}" fill="#bfe3ef" fill-opacity="0.8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></svg>`,
      10 + Math.random() * 12,
      [
        { transform: at(0, 0, 'rotate(0deg)'), opacity: 1 },
        { transform: at(dx, dy - size * 0.15, `rotate(${(Math.random() - 0.5) * 540}deg)`), opacity: 1, offset: 0.6 },
        { transform: at(dx * 1.1, dy + size * 0.25, `rotate(${(Math.random() - 0.5) * 720}deg)`), opacity: 0 },
      ],
      900 + Math.random() * 400,
    )
  }
  // The cork pops off the neck (the right-hand end) and tumbles away.
  const neck = size * 0.47
  piece(
    `<svg viewBox="0 0 12 20"><rect x="1" y="1" width="10" height="18" rx="3" fill="#a0703f" stroke="${INK}" stroke-width="2"/></svg>`,
    Math.max(8, size * 0.07),
    [
      { transform: at(neck, 0, 'rotate(90deg)'), opacity: 1 },
      { transform: at(neck + size * 0.35, -size * 0.7, 'rotate(420deg)'), opacity: 1, offset: 0.55 },
      { transform: at(neck + size * 0.55, -size * 0.2, 'rotate(720deg)'), opacity: 0 },
    ],
    1100,
  )
  // The rolled-up note floats up out of the wreckage, growing as it comes.
  piece(
    `<svg viewBox="0 0 64 22"><rect x="1" y="1" width="62" height="20" rx="10" fill="#f6ecd2" stroke="${INK}" stroke-width="2.5"/><path d="M12 8 H44 M12 14 H36" stroke="#8a7a5c" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    size * 0.45,
    [
      { transform: at(0, 0, 'scale(1)'), opacity: 1 },
      { transform: at(0, -size * 0.8, 'scale(1.7) rotate(-8deg)'), opacity: 1, offset: 0.85 },
      { transform: at(0, -size * 0.9, 'scale(1.9)'), opacity: 0 },
    ],
    800,
  )
  window.setTimeout(() => layer.remove(), 1600)
}

function showNote(bottle: SVGSVGElement) {
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = '') => {
    const node = document.createElement(tag)
    node.className = className
    node.textContent = text
    return node
  }
  const dialog = el('dialog', 'note')
  dialog.setAttribute('aria-labelledby', 'note-title')
  const paper = el('div', 'note-paper')
  const close = el('button', 'note-close', '×')
  close.setAttribute('aria-label', 'Close the note')
  const title = el('h2', 'note-title font-display', bottleNote.title)
  title.id = 'note-title'
  const toss = el('button', 'note-toss font-display', 'toss it back')
  paper.append(close, title, ...bottleNote.body.map((text) => el('p', 'note-line', text)), el('p', 'note-signoff font-display', bottleNote.signoff), toss)
  dialog.append(paper)

  close.addEventListener('click', () => dialog.close())
  toss.addEventListener('click', () => dialog.close())
  // A click on the dimmed backdrop (outside the paper) lands on the dialog itself.
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close())
  dialog.addEventListener('close', () => {
    dialog.remove()
    bottle.style.transition = 'opacity 1.2s ease'
    bottle.style.opacity = '1'
    reading = false
  })
  document.body.append(dialog)
  dialog.showModal()
  toss.focus()
}
