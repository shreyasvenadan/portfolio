// The football page, opened by Shreyas kicking the ball off the island at
// the screen (src/lib/kick.ts). Pitch green.

// Back to the island. Come from there, it's a step back in history, so the
// browser puts them back where they were.
function backToIsland(e: React.MouseEvent) {
  const home = new URL(import.meta.env.BASE_URL, window.location.href)
  const from = document.referrer && new URL(document.referrer)
  if (from && from.origin === home.origin && from.pathname === home.pathname && history.length > 1) {
    e.preventDefault()
    history.back()
  }
}

export default function Football() {
  return (
    <div className="min-h-svh bg-[#36883a] px-5 py-10 text-[#f4f8ef] md:px-10">
      <a href={import.meta.env.BASE_URL} onClick={backToIsland} className="font-display text-lg opacity-90 transition hover:opacity-100">
        ← back to the island
      </a>
      <main className="mx-auto mt-24 max-w-[42rem] text-center">
        <h1 className="display text-6xl font-extrabold md:text-8xl">football</h1>
        <p className="mt-10 text-xl leading-[1.7]">I've played competitive football for 14+ years, and I coach youth football.</p>
      </main>
    </div>
  )
}
