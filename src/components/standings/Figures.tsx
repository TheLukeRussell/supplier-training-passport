// The three figures at the top of Standings. All computed from the rows on
// screen, nothing typed in by hand.

import type { Figures as FigureValues } from '../../lib/ranking'
import { percentOf } from '../../lib/rules'
import './Figures.css'

interface Props {
  figures: FigureValues
  scope: string
}

export function Figures({ figures, scope }: Props) {
  return (
    <dl className="figures">
      <div className="figures__item">
        <dt>Above the line</dt>
        <dd>
          <span className="figures__value">{figures.above}</span>
          <span className="figures__unit">
            {' '}
            of {figures.ranked} ranked {scope}
          </span>
        </dd>
      </div>
      <div className="figures__item">
        <dt>Average rate</dt>
        <dd>
          <span className="figures__value">{figures.averageRate === null ? 'None' : `${percentOf(figures.averageRate)}%`}</span>
          <span className="figures__unit"> across ranked {scope}</span>
        </dd>
      </div>
      <div className="figures__item">
        <dt>Trainings held</dt>
        <dd>
          <span className="figures__value">{figures.held}</span>
          <span className="figures__unit"> of {figures.total} this year</span>
        </dd>
      </div>
    </dl>
  )
}
