// The laminate on the inside cover and the data page: a clear film printed
// with fine gold waves that only catch the light while the book tilts or a
// page turns. Wrap the part of a page the film should cover in this.

import type { ReactNode } from 'react'
import './Laminate.css'

export function Laminate({ children }: { children: ReactNode }) {
  return (
    <div className="laminated">
      {children}
      {/* The film: the gold and its band of light, under a sheet with the
          waves cut out (Laminate.css). Paint only. */}
      <span className="laminate" aria-hidden="true">
        <span className="laminate__gold">
          <span className="laminate__light" />
        </span>
      </span>
    </div>
  )
}
