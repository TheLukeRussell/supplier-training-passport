// The words for where a rep stands. The data page gets a head and a line
// under it, the cover gets a two-part score, and today's visa page gets an
// endorsement once attendance is recorded. Kept here so the wording follows
// the rules exactly and the tests can check it.

import { stampDate } from './format'
import type { Training } from './model'
import { attendNext, bestRateOf, cushionOf, percentOf, type Context, type RepStats, type SlotState } from './rules'

const NBSP = '\u00a0'

// "One from the line", "Above the line" and so on. No full stop, callers add it.
export function standing(stats: RepStats): string {
  switch (stats.toLine.kind) {
    case 'needs':
      return `${stats.toLine.n === 1 ? 'One' : stats.toLine.n} from the line`
    case 'out-of-reach':
      return 'The line is out of reach this year'
    case 'above':
      return stats.toLine.onLine ? 'Right on the line' : 'Above the line'
  }
}

// The sub line has to add something the head and the cells above it don't
// already say. For a rep who still needs stamps that's the cost of missing
// the next one, which is the thing nobody works out in their head.
export function lineMessage(stats: RepStats, ctx: Context): { head: string; sub: string } {
  const { toLine, attended, recorded, left } = stats
  if (toLine.kind === 'needs') {
    const head = `Attend the next ${toLine.n === 1 ? 'one' : toLine.n} to reach the line`
    const missed = attendNext(attended, recorded + 1, left - 1, ctx.line)
    const sub =
      missed.kind === 'needs'
        ? `Miss ${toLine.n === 1 ? 'it' : 'one'} and it takes ${missed.n} in a row.`
        : `Miss ${toLine.n === 1 ? 'it' : 'one'} and the line is out of reach this year.`
    return { head, sub }
  }
  if (toLine.kind === 'out-of-reach') {
    const best = bestRateOf(attended, recorded, left)
    return {
      head: 'Out of reach this year',
      sub: left > 0 && best !== null ? `Even all ${left} trainings left only gets you to ${percentOf(best)}%.` : 'There are no trainings left this year.',
    }
  }
  const cushion = cushionOf(attended, recorded, left, ctx.line)
  return {
    head: toLine.onLine ? 'Right on the line' : 'Above the line',
    sub: cushion === 0 ? 'Miss the next one and you drop below it.' : `You could miss the next ${cushion === 1 ? 'one' : cushion} and still be above it.`,
  }
}

// The cover's score, in two parts so each gets its own line.
export function coverLine(stats: RepStats): { count: string; standing: string } {
  const count = stats.attended === 0 ? 'No stamps yet.' : `${stats.attended} ${stats.attended === 1 ? 'stamp' : 'stamps'}.`
  return { count, standing: `${standing(stats)}.` }
}

// Written on today's visa page once today's attendance is recorded, like an
// officer's note: what happened, the new count, and where that leaves you.
export function endorsement(stats: RepStats, state: SlotState, training: Training): string | null {
  if (state !== 'stamped' && state !== 'missed') return null
  const what = state === 'stamped' ? 'Stamped' : 'Missed'
  // Non-breaking spaces inside the date and the count, so a wrap never
  // splits "17 JUN 2027" or "9 of 12" across two lines.
  const nb = (text: string) => text.replace(/ /g, NBSP)
  const rate = stats.rate === null ? '' : `, ${percentOf(stats.rate)}%`
  return `${what} ${nb(stampDate(training.date))}. ${nb(`${stats.attended} of ${stats.recorded}`)}${rate}. ${standing(stats)}.`
}
