import type { ReactNode } from 'react'

type Props = {
  id: string
  title: string
  children: ReactNode
}

export default function Section({ id, title, children }: Props) {
  return (
    <section id={id} className="py-20">
      <h2 className="mb-10 flex items-center gap-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </h2>
      {children}
    </section>
  )
}
