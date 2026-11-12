// A visa page: one quarter of the year, one slot per training in date order.
// The page holding today's training also runs the stamp moment when today's
// attendance gets recorded, and carries the endorsement written after it.

import { useEffect } from 'react'
import { PAGES } from '../../lib/book'
import { firstName, monthName, shortDate } from '../../lib/format'
import { endorsement } from '../../lib/messages'
import type { Model, Rep, Training } from '../../lib/model'
import { stampLook } from '../../lib/stamps'
import { slotState, type Context, type RepStats } from '../../lib/rules'
import { useReducedMotion } from '../../state/useMedia'
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

// How long the whole stamp moment runs: the stamper's trip (--dur-press,
// 1400ms) with the endorsement writing itself in from 80% of the way, 620ms.
const MOMENT_MS = 1900
// When the ink shows: as the stamper lifts, 64% of --dur-press.
const INK_MS = 900

export function VisaPage({ page, model, rep, ctx, stats, landing, onLanded, onOpen, still }: Props) {
  const reduced = useReducedMotion()
  const info = PAGES[page - 1]
  const [first, , last] = info.months!
  const trainings = model.trainings.filter((t) => {
    const month = Number(t.date.slice(5, 7))
    return month >= first && month <= last
  })
  const states = trainings.map((t) => slotState(model, rep, t, ctx))
  const invitedHere = states.some((s) => s !== 'not-invited')

  const todayIndex = trainings.findIndex((t) => t.date === ctx.today)
  const today = todayIndex === -1 ? null : trainings[todayIndex]
  const note = today ? endorsement(stats, states[todayIndex], today) : null
  // Until today is recorded there's no endorsement yet, but the page keeps
  // the room for one (and the slot keeps room for its stamp, see VisaSlot),
  // so recording never makes the book grow mid-turn.
  const reserve = today && states[todayIndex] === 'today' ? endorsement(stats, 'stamped', today) : null
  // The moment only plays on the real page, never on the hidden sizer copy
  // or a page mid-turn, and only if today's slot actually got a stamp.
  const playing = landing && !still && today !== null && states[todayIndex] === 'stamped'
  const ink = today ? stampLook(today.supplier, rep.email, today.id).ink : 1

  // Let the moment run, then tell the app the stamp has landed so it won't
  // replay. Under reduced motion there's nothing to wait for.
  useEffect(() => {
    if (!playing) return
    if (reduced) {
      onLanded()
      return
    }
    const started = performance.now()
    let done = false
    const timer = window.setTimeout(() => {
      done = true
      onLanded()
    }, MOMENT_MS)
    return () => {
      window.clearTimeout(timer)
      // Turning away once the ink is down still counts, so coming back
      // doesn't bring the stamper down a second time.
      if (!done && performance.now() - started >= INK_MS) onLanded()
    }
  }, [playing, reduced, onLanded])

  return (
    <Page kind="visa" label={info.name} folio={page} runningHead="Visas" className={playing ? 'is-thumping' : undefined}>
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
                landing={playing && i === todayIndex}
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
            ? `${firstName(rep.name)} wasn’t on the list for these. The next chance at a stamp is ${stats.next.supplier} on ${shortDate(stats.next.date)}.`
            : `${firstName(rep.name)} wasn’t on the list for these.`}
        </p>
      )}
      {/* The endorsement: written in the stamp’s ink once today is recorded,
          because the new rate lives on the data page, not here. */}
      {note && (
        <p
          className={`visa__endorse visa__endorse--${states[todayIndex] === 'missed' ? 'missed' : `ink-${ink}`}${playing ? ' is-writing' : ''}`}
          role="status"
        >
          {note}
        </p>
      )}
      {reserve && (
        <p className="visa__endorse visa__endorse--reserve" aria-hidden="true">
          {reserve}
        </p>
      )}
    </Page>
  )
}
