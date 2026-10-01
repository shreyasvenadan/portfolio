import { links, profile } from '../data/content'

const pill =
  'grid h-8 place-items-center rounded-full bg-ink/85 px-3 text-xs font-semibold tracking-wide text-bone transition hover:bg-accent'

// The resume's own page: the PDF shown inline, with a way back to the ocean.
export default function Resume() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
        <a
          href={import.meta.env.BASE_URL}
          className="font-display text-lg font-bold tracking-tight whitespace-nowrap md:text-xl"
        >
          ← {profile.name}
        </a>
        <a href={links.resume} download="Shreyas Venadan - Resume.pdf" className={pill}>
          download
        </a>
      </header>
      <main className="flex-1 px-5 pb-5 md:px-10 md:pb-10">
        {/* Browsers that can't show PDFs inline (most phones) get a link instead. */}
        <object
          data={links.resume}
          type="application/pdf"
          aria-label={`${profile.name} resume`}
          className="mx-auto block h-full w-full max-w-4xl rounded-lg bg-bone shadow-lg"
        >
          <div className="grid h-full place-items-center p-6 text-center">
            <p>
              Your browser can't show the PDF here.{' '}
              <a href={links.resume} className="font-semibold underline hover:text-accent">
                Open the resume
              </a>
            </p>
          </div>
        </object>
      </main>
    </div>
  )
}
