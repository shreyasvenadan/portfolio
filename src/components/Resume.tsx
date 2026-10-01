import { getDocument, GlobalWorkerOptions, type PDFPageProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useEffect, useMemo, useRef, useState } from 'react'
import { links, profile } from '../data/content'

GlobalWorkerOptions.workerSrc = workerUrl

const pill =
  'grid h-8 place-items-center rounded-full bg-ink/85 px-3 text-xs font-semibold tracking-wide text-bone transition hover:bg-accent'

type Link = { href: string; left: number; top: number; width: number; height: number }

// One PDF page drawn to a canvas, with its links laid over the top as real
// anchors (as percentages, so they follow the canvas when it resizes).
function Page({ page }: { page: PDFPageProxy }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pageLinks, setPageLinks] = useState<Link[]>([])
  const base = useMemo(() => page.getViewport({ scale: 1 }), [page])

  useEffect(() => {
    const canvas = canvasRef.current!
    // Render sharp enough for the widest the page is shown, on retina screens.
    const viewport = page.getViewport({ scale: (900 / base.width) * Math.max(2, devicePixelRatio) })
    canvas.width = viewport.width
    canvas.height = viewport.height
    const task = page.render({ canvas, viewport })
    task.promise.catch(() => {})

    page.getAnnotations().then((annotations) => {
      setPageLinks(
        annotations
          .filter((a) => a.subtype === 'Link' && a.url)
          .map((a) => {
            const [x1, y1] = base.convertToViewportPoint(a.rect[0], a.rect[1])
            const [x2, y2] = base.convertToViewportPoint(a.rect[2], a.rect[3])
            return {
              href: a.url,
              left: (Math.min(x1, x2) / base.width) * 100,
              top: (Math.min(y1, y2) / base.height) * 100,
              width: (Math.abs(x2 - x1) / base.width) * 100,
              height: (Math.abs(y2 - y1) / base.height) * 100,
            }
          }),
      )
    })
    return () => task.cancel()
  }, [page, base])

  return (
    <div className="relative bg-white shadow-lg" style={{ aspectRatio: `${base.width} / ${base.height}` }}>
      <canvas ref={canvasRef} className="block h-full w-full" />
      {pageLinks.map((link) => (
        <a
          key={`${link.href}-${link.top}-${link.left}`}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.href}
          className="absolute"
          style={{ left: `${link.left}%`, top: `${link.top}%`, width: `${link.width}%`, height: `${link.height}%` }}
        />
      ))}
    </div>
  )
}

// The resume PDF shown as plain pages, without the browser's PDF viewer.
export default function Resume() {
  const [pages, setPages] = useState<PDFPageProxy[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const task = getDocument({ url: links.resume })
    task.promise
      .then((pdf) => Promise.all(Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))))
      .then(setPages)
      .catch(() => setFailed(true))
    return () => {
      task.destroy()
    }
  }, [])

  return (
    <>
      <header className="flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
        <a
          href={import.meta.env.BASE_URL}
          className="font-display text-lg font-bold tracking-tight whitespace-nowrap md:text-xl"
        >
          ← {profile.name}
        </a>
        <a href={links.resume} download="Shreyas Venadan - Resume.pdf" className={pill}>
          download pdf
        </a>
      </header>

      <main className="mx-auto max-w-[900px] space-y-6 px-5 pb-16 md:px-10">
        <h1 className="sr-only">{profile.name} resume</h1>
        {failed && (
          <p className="text-center">
            The resume couldn't load.{' '}
            <a href={links.resume} className="font-semibold underline hover:text-accent">
              Open the PDF
            </a>
          </p>
        )}
        {pages.map((page) => (
          <Page key={page.pageNumber} page={page} />
        ))}
      </main>
    </>
  )
}
