import { links, profile } from '../data/content'

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
      <a href="#top" className="font-display text-xl font-bold tracking-tight">
        {profile.name}
      </a>
      <a href={`mailto:${links.email}`} className="text-silt transition-colors hover:text-glow">
        Email me
      </a>
    </header>
  )
}
