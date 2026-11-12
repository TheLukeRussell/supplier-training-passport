// Standings math: rank reps by rate, share ranks on ties, work out how far
// each rep moved since the last training, and the figures at the top.

import { MIN_RECORDED } from '../config'
import type { Model, Rep } from './model'
import { isRecorded, meetsLine, recordedTrainings, repStats, tally, type Context, type RepStats } from './rules'

export interface Tally {
  attended: number
  recorded: number
}

// Compare two rates without dividing. 7/9 vs 14/18 come out exactly equal
// this way, where floats could disagree in the last digit.
export function compareRates(a: Tally, b: Tally): number {
  return b.attended * a.recorded - a.attended * b.recorded
}

// Rank everyone with at least `min` trainings recorded. Ties share a rank
// (1, 2, 2, 4) so nobody drops a spot because of the alphabet. Anyone short
// of that gets null and sits at the bottom, unranked.
export function rankTallies(items: { id: string; name: string; tally: Tally }[], min = MIN_RECORDED): Map<string, number | null> {
  const ranked = items
    .filter((item) => item.tally.recorded >= Math.max(min, 1))
    .sort((a, b) => compareRates(a.tally, b.tally) || a.name.localeCompare(b.name))
  const ranks = new Map<string, number | null>()
  ranked.forEach((item, index) => {
    const prev = ranked[index - 1]
    const tied = prev && compareRates(prev.tally, item.tally) === 0
    ranks.set(item.id, tied ? ranks.get(prev.id)! : index + 1)
  })
  for (const item of items) if (!ranks.has(item.id)) ranks.set(item.id, null)
  return ranks
}

export type Change = { kind: 'up' | 'down'; places: number } | { kind: 'same' } | { kind: 'new' } | { kind: 'none' }

export interface StandingRow {
  rep: Rep
  stats: RepStats
  rank: number | null
  tied: boolean // shares its rank with someone, anywhere on the full board
  change: Change
  above: boolean // ranked and at or over the line
}

function ranksFor(model: Model, counts: (trainingId: string) => boolean) {
  return rankTallies(
    model.reps.map((rep) => ({
      id: rep.id,
      name: rep.name,
      tally: tally(model, rep, (t) => counts(t.id)),
    })),
  )
}

// "Change since the last training" means: rank now, versus rank if the most
// recent recorded training hadn't happened yet. Positive places means up.
export function changeFor(now: number | null, before: number | null, hasHistory: boolean): Change {
  if (!hasHistory) return { kind: 'none' }
  if (now === null) return { kind: 'none' }
  if (before === null) return { kind: 'new' }
  if (now === before) return { kind: 'same' }
  return now < before ? { kind: 'up', places: before - now } : { kind: 'down', places: now - before }
}

export function standings(model: Model, ctx: Context): StandingRow[] {
  const recorded = recordedTrainings(model, ctx)
  const latest = recorded.at(-1)
  const nowRanks = ranksFor(model, (id) => recorded.some((t) => t.id === id))
  const beforeRanks = ranksFor(model, (id) => id !== latest?.id && recorded.some((t) => t.id === id))
  const hasHistory = recorded.length > 1

  // How many reps hold each rank, so a tie reads the same on a team filter
  // as it does on the full board.
  const holders = new Map<number, number>()
  for (const rank of nowRanks.values()) if (rank !== null) holders.set(rank, (holders.get(rank) ?? 0) + 1)

  const rows = model.reps.map((rep): StandingRow => {
    const stats = repStats(model, rep, ctx)
    const rank = nowRanks.get(rep.id) ?? null
    return {
      rep,
      stats,
      rank,
      tied: rank !== null && holders.get(rank)! > 1,
      change: changeFor(rank, beforeRanks.get(rep.id) ?? null, hasHistory),
      // Unranked reps don't count toward the line on the board, even at 1 of 1.
      above: rank !== null && meetsLine(stats.rate, ctx.line),
    }
  })

  // Ranked reps first by rank, then alphabetical inside a tie. Unranked last.
  return rows.sort((a, b) => {
    if (a.rank === null && b.rank === null) return a.rep.name.localeCompare(b.rep.name)
    if (a.rank === null) return 1
    if (b.rank === null) return -1
    return a.rank - b.rank || a.rep.name.localeCompare(b.rep.name)
  })
}

export interface Figures {
  above: number
  ranked: number
  averageRate: number | null
  held: number
  total: number
}

// The three numbers at the top of Standings, for whatever rows are showing.
// Only ranked reps count toward the line and the average.
export function figuresFor(rows: StandingRow[], model: Model, ctx: Context): Figures {
  const ranked = rows.filter((row) => row.rank !== null)
  const sum = ranked.reduce((total, row) => total + (row.stats.rate ?? 0), 0)
  return {
    above: rows.filter((row) => row.above).length,
    ranked: ranked.length,
    averageRate: ranked.length ? sum / ranked.length : null,
    held: model.trainings.filter((t) => isRecorded(t, ctx)).length,
    total: model.trainings.length,
  }
}

// Where the President's Club line falls in a sorted board: the index of the
// first row below it. Unranked reps count as below.
export function lineIndex(rows: StandingRow[]): number {
  const index = rows.findIndex((row) => !row.above)
  return index === -1 ? rows.length : index
}
