// The passport cover: program name, the year in foil yellow, whose passport
// it is, and the one count that matters, so the closed book already answers
// "where do I stand". The whole cover is the button that opens it.

import type { Rep } from '../../lib/model'
import { coverLine } from '../../lib/messages'
import type { RepStats } from '../../lib/rules'
import { PROGRAM_YEAR } from '../../config'
import './Page.css'
import './Cover.css'

interface Props {
  rep: Rep
  stats: RepStats
  onOpen: () => void
  still: boolean
}

export function Cover({ rep, stats, onOpen, still }: Props) {
  const score = coverLine(stats)
  return (
    <section className="page cover" aria-label={`Cover of ${rep.name}'s passport`}>
      <p className="cover__title">
        Supplier
        <br />
        Training
        <br />
        Passport
      </p>
      <p className="cover__year">{PROGRAM_YEAR}</p>
      <div className="cover__holder">
        <p className="cover__name">{rep.name}</p>
        <p className="cover__team">{rep.team} team</p>
        <p className="cover__score">
          <span>{score.count}</span> <span>{score.standing}</span>
        </p>
      </div>
      <button type="button" className="cover__open" onClick={onOpen} tabIndex={still ? -1 : 0}>
        Open passport
      </button>
    </section>
  )
}
