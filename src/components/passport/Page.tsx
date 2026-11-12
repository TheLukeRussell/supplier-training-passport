// One sheet of the passport: paper, and a running foot with the page number,
// like the real thing. Every inside page wraps its content in this.

import type { ReactNode } from 'react'
import './Page.css'

interface Props {
  kind: string
  label: string
  folio: number
  runningHead?: string
  className?: string
  children: ReactNode
}

export function Page({ kind, label, folio, runningHead, className, children }: Props) {
  return (
    <section className={`page page--${kind}${className ? ` ${className}` : ''}`} aria-label={label}>
      <div className="page__body">{children}</div>
      {/* The section name rides in the foot beside the number, so nothing
          small sits on top of the page's heading. */}
      <p className="page__folio" aria-hidden="true">
        <span className="page__number">{folio}</span>
        {runningHead && <span className="page__running">{runningHead}</span>}
      </p>
    </section>
  )
}
