// The passport cover, laid out like a real one: the issuer across the top,
// the year where the crest would be, PASSPORT under it, then whose it is.
// Gold foil on navy leather. The whole cover is the button that opens it.

import type { Rep } from '../../lib/model'
import { PROGRAM_YEAR } from '../../config'
import { ChipMark } from './ChipMark'
import './Page.css'
import './Cover.css'

interface Props {
  rep: Rep
  onOpen: () => void
  still: boolean
}

export function Cover({ rep, onOpen, still }: Props) {
  return (
    <section className="page cover" aria-label={`Cover of ${rep.name}’s passport`}>
      <p className="cover__program foil">Supplier Training</p>
      <p className="cover__year foil">{PROGRAM_YEAR}</p>
      <p className="cover__title foil">Passport</p>
      <div className="cover__holder">
        <p className="cover__name">{rep.name}</p>
        <p className="cover__team">{rep.team} team</p>
      </div>
      <div className="cover__foot">
        <button type="button" className="cover__open" onClick={onOpen} tabIndex={still ? -1 : 0}>
          Open passport
        </button>
        <ChipMark />
      </div>
    </section>
  )
}
