// Details for one training, opened by tapping its slot. A native <dialog>,
// so focus, Escape and the backdrop come for free, and you never leave the page.

import { useEffect, useRef } from 'react'
import { TEAMS } from '../../config'
import { daysBetween, firstName, longDate, plural } from '../../lib/format'
import { entryFor, type Model, type Rep, type Training } from '../../lib/model'
import { isRecorded, slotState, type Context } from '../../lib/rules'
import './SlotDetail.css'

interface Props {
  training: Training | null
  model: Model
  rep: Rep
  ctx: Context
  onClose: () => void
}

function invitedTeams(model: Model, training: Training): string {
  const teams = TEAMS.filter((team) => model.reps.some((rep) => rep.team === team && entryFor(model, rep, training.id).invited))
  if (teams.length === TEAMS.length) return 'All four teams'
  if (teams.length === 0) return 'Nobody yet'
  return teams.join(' and ')
}

export function SlotDetail({ training, model, rep, ctx, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (training && !dialog.open) dialog.showModal()
    if (!training && dialog.open) dialog.close()
  }, [training])

  const name = firstName(rep.name)
  let status = ''
  let turnout = ''
  if (training) {
    const state = slotState(model, rep, training, ctx)
    const days = daysBetween(ctx.today, training.date)
    status = {
      stamped: `${name} attended. The stamp is on the page.`,
      missed: `${name} was invited and missed it. It counts against the rate.`,
      today: `It's today. Attendance isn't recorded yet, so it doesn't count either way.`,
      upcoming: `${plural(days, 'day')} away. Attending counts toward the line.`,
      'not-invited': `${name} wasn't invited, so it doesn't count either way.`,
    }[state]
    const invited = model.reps.filter((r) => entryFor(model, r, training.id).invited)
    const came = invited.filter((r) => entryFor(model, r, training.id).attended)
    turnout = isRecorded(training, ctx) ? `${came.length} of ${invited.length} invited reps attended` : `${invited.length} reps invited, not held yet`
  }

  return (
    <dialog
      ref={ref}
      className="slip"
      aria-labelledby="slip-title"
      onClose={onClose}
      // A click that lands on the dialog itself (not its contents) is a click
      // on the backdrop, so close.
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      {training && (
        <div className="slip__inner">
          <h2 id="slip-title" className="slip__title">
            {training.supplier}
          </h2>
          <p className="slip__lead">{training.title}</p>
          <dl className="slip__facts">
            <div>
              <dt>Date</dt>
              <dd>{longDate(training.date)}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{training.format === 'virtual' ? 'Virtual' : 'In person'}</dd>
            </div>
            <div>
              <dt>Invited</dt>
              <dd>{invitedTeams(model, training)}</dd>
            </div>
            <div>
              <dt>Turnout</dt>
              <dd>{turnout}</dd>
            </div>
          </dl>
          <p className="slip__status">{status}</p>
          <form method="dialog" className="slip__actions">
            <button type="submit" className="btn" autoFocus>
              Close
            </button>
          </form>
        </div>
      )}
    </dialog>
  )
}
