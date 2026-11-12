// The passport cover: program name, the year in foil yellow, and whose
// passport it is. The whole cover is the button that opens it.

import type { Rep } from '../../lib/model'
import { PROGRAM_YEAR } from '../../config'
import './Page.css'
import './Cover.css'

interface Props {
  rep: Rep
  onOpen: () => void
  still: boolean
}

export function Cover({ rep, onOpen, still }: Props) {
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
      </div>
      <button type="button" className="cover__open" onClick={onOpen} tabIndex={still ? -1 : 0}>
        Tap to open
      </button>
    </section>
  )
}
