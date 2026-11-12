// The back cover, so the book closes instead of just stopping on page 6.
// Mostly plain, like a real one: the program year, a light plate carrying
// the logo, and a way back to the front.

import { EXPIRY_DATE, ISSUE_DATE, PROGRAM_YEAR } from '../../config'
import { stampDate } from '../../lib/format'
import type { Rep } from '../../lib/model'
import './Page.css'
import './Cover.css'

interface Props {
  rep: Rep
  onFront: () => void
  still: boolean
}

const LOGO = `${import.meta.env.BASE_URL}brand/scansource-logo.svg`

export function BackCover({ rep, onFront, still }: Props) {
  return (
    <section className="page cover cover--back" aria-label={`Back cover of ${rep.name}'s passport`}>
      <p className="cover__back-note">
        Valid for the {PROGRAM_YEAR} program year, {stampDate(ISSUE_DATE)} to {stampDate(EXPIRY_DATE)}.
      </p>
      {/* The colour logo only goes on a light surface, so it gets its own
          plate instead of sitting on the navy. The file is used as is. */}
      <div className="cover__plate">
        <img src={LOGO} alt="ScanSource" width={142} height={28} className="cover__logo" />
      </div>
      <button type="button" className="cover__open" onClick={onFront} tabIndex={still ? -1 : 0}>
        Back to the front
      </button>
    </section>
  )
}
