// One sheet of the passport: paper, a running head and a page number at the
// foot, like the real thing. Every inside page wraps its content in this.

import type { ReactNode } from 'react'
import './Page.css'

interface Props {
  kind: string
  label: string
  folio: number
  runningHead?: string
  children: ReactNode
}

export function Page({ kind, label, folio, runningHead, children }: Props) {
  return (
    <section className={`page page--${kind}`} aria-label={label}>
      {runningHead && (
        <p className="page__head" aria-hidden="true">
          {runningHead}
        </p>
      )}
      <div className="page__body">{children}</div>
      <p className="page__folio" aria-hidden="true">
        {folio}
      </p>
    </section>
  )
}
