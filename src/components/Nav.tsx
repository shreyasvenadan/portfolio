import { profile } from '../data/content'

const items = [
  { href: '#about', label: 'About' },
  { href: '#projects', label: 'Projects' },
  { href: '#experience', label: 'Experience' },
  { href: '#contact', label: 'Contact' },
]

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/80">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <a href="#top" className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {profile.name.split(' ')[0].toLowerCase()}
          <span className="text-accent">.</span>
        </a>
        <ul className="flex gap-5 text-sm text-zinc-600 dark:text-zinc-400">
          {items.map((item) => (
            <li key={item.href} className={item.href === '#experience' ? 'hidden sm:block' : ''}>
              <a href={item.href} className="transition-colors hover:text-accent">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
