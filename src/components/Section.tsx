import type { ReactNode } from 'react'

type Props = {
  id: string
  title: string
  children: ReactNode
}

export default function Section({ id, title, children }: Props) {
  return (
    <section id={id} className="py-28 md:py-40">
      <h2 className="display mb-12 text-5xl font-extrabold md:text-7xl">{title}</h2>
      {children}
    </section>
  )
}
