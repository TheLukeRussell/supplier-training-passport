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

// "All teams", "POSB and Federal", or "POSB, NetSec and Federal".
function invitedTeams(model: Model, training: Training): string {
  const teams = TEAMS.filter((team) => model.reps.some((rep) => rep.team === team && entryFor(model, rep, training.id).invited))
  if (teams.length === TEAMS.length) return 'All teams'
  if (teams.length === 0) return 'Nobody yet'
  if (teams.length === 1) return teams[0]
  return `${teams.slice(0, -1).join(', ')} and ${teams.at(-1)}`
}

export function SlotDetail({ training, model, rep, ctx, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (training && !dialog.open) {
      dialog.showModal()
      // Start on the heading, not Close. On a short screen (200% zoom, a
      // phone on its side) focusing Close scrolled the slip past its title.
      dialog.querySelector<HTMLElement>('#slip-title')?.focus()
      dialog.scrollTop = 0
    }
    if (!training && dialog.open) dialog.close()
  }, [training])

  const name = firstName(rep.name)
  let status = ''
  let turnout = ''
  if (training) {
    const state = slotState(model, rep, training, ctx)
    const days = daysBetween(ctx.today, training.date)
    // Their team got the invite but they didn't, like a new hire before their start date.
    const teamInvited = model.reps.some((r) => r.team === rep.team && entryFor(model, r, training.id).invited)
    status = {
      stamped: `${name} attended. The stamp is on the page.`,
      missed: `${name} was invited and missed it. It counts against the rate.`,
      today: `It’s today. Attendance isn’t recorded yet, so it doesn’t count either way.`,
      upcoming: `${plural(days, 'day')} away. Attending counts toward the line.`,
      'not-invited': teamInvited
        ? `${name} wasn’t on the list for this one yet, so it doesn’t count either way.`
        : `${name} wasn’t invited, so it doesn’t count either way.`,
    }[state]
    const invited = model.reps.filter((r) => entryFor(model, r, training.id).invited)
    const came = invited.filter((r) => entryFor(model, r, training.id).attended)
    turnout = isRecorded(training, ctx) ? `${came.length} of ${invited.length} invited reps attended` : `${invited.length} reps invited, ${training.date === ctx.today ? 'happening today' : 'not held yet'}`
  }

  return (
    <dialog
      ref={ref}
      className="slip"
      aria-labelledby="slip-title"
      onClose={onClose}
      // A click that lands on the dialog itself (not its contents) is a click
      // on the backdrop, so close. Not the second click of a double-click,
      // though: that's the same click that opened it, landing on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget && event.detail < 2) event.currentTarget.close()
      }}
    >
      {training && (
        <div className="slip__inner">
          <h2 id="slip-title" className="slip__title" tabIndex={-1}>
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
            <button type="submit" className="btn">
              Close
            </button>
          </form>
        </div>
      )}
    </dialog>
  )
}
