// A visa page: one quarter of the year, one slot per training in date order.

import { PAGES } from '../../lib/book'
import { firstName, monthName, shortDate } from '../../lib/format'
import type { Model, Rep, Training } from '../../lib/model'
import { slotState, type Context, type RepStats } from '../../lib/rules'
import { Page } from './Page'
import { VisaSlot } from './VisaSlot'
import './VisaPage.css'

interface Props {
  page: number
  model: Model
  rep: Rep
  ctx: Context
  stats: RepStats
  landing: boolean
  onLanded: () => void
  onOpen: (training: Training) => void
  still: boolean
}

export function VisaPage({ page, model, rep, ctx, stats, landing, onLanded, onOpen, still }: Props) {
  const info = PAGES[page - 1]
  const [first, , last] = info.months!
  const trainings = model.trainings.filter((t) => {
    const month = Number(t.date.slice(5, 7))
    return month >= first && month <= last
  })
  const states = trainings.map((t) => slotState(model, rep, t, ctx))
  const invitedHere = states.some((s) => s !== 'not-invited')

  return (
    <Page kind="visa" label={info.name} folio={page} runningHead="Visas">
      <h2 className="visa__title">
        {monthName(first)} to {monthName(last)}
      </h2>
      {trainings.length === 0 ? (
        <p className="visa__note">No trainings are on the calendar for these months yet.</p>
      ) : (
        <ul className="visa__grid">
          {trainings.map((training, i) => (
            <li key={training.id}>
              <VisaSlot
                training={training}
                state={states[i]}
                repEmail={rep.email}
                landing={landing && training.date === ctx.today && !still}
                onLanded={onLanded}
                onOpen={onOpen}
                focusable={!still}
              />
            </li>
          ))}
        </ul>
      )}
      {/* A rep with nothing to stamp on this page (a new hire, say) gets told
          when their first stamp can land instead of a page of blanks. */}
      {trainings.length > 0 && !invitedHere && (
        <p className="visa__note">
          {stats.next
            ? `${firstName(rep.name)} wasn't on the list for these. The next chance at a stamp is ${stats.next.supplier} on ${shortDate(stats.next.date)}.`
            : `${firstName(rep.name)} wasn't on the list for these.`}
        </p>
      )}
    </Page>
  )
}
