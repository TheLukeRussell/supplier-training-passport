// The passport rules: what counts as recorded, a rep's rate, how many more
// trainings they need, and their streak. Pure functions, no React in here.

import { entryFor, type Model, type Rep, type Training } from './model'

export interface Context {
  today: string // YYYY-MM-DD
  todayRecorded: boolean // has today's training been recorded yet?
  line: number // e.g. 0.75
}

export type SlotState = 'stamped' | 'missed' | 'today' | 'upcoming' | 'not-invited'

export type ToLine =
  | { kind: 'above'; onLine: boolean }
  | { kind: 'needs'; n: number }
  | { kind: 'out-of-reach'; left: number }

export interface RepStats {
  attended: number
  recorded: number // invited trainings that are already recorded
  rate: number | null // null until something is recorded
  left: number // invited trainings still to come this year
  toLine: ToLine
  streak: number
  next: Training | null
}

// Only count trainings that already happened. Upcoming ones shouldn't hurt
// anybody's rate. Today's training counts once the demo records it.
export function isRecorded(training: Training, ctx: Context): boolean {
  if (training.date < ctx.today) return true
  return training.date === ctx.today && ctx.todayRecorded
}

export function slotState(model: Model, rep: Rep, training: Training, ctx: Context): SlotState {
  const entry = entryFor(model, rep, training.id)
  if (!entry.invited) return 'not-invited'
  if (isRecorded(training, ctx)) return entry.attended ? 'stamped' : 'missed'
  return training.date === ctx.today ? 'today' : 'upcoming'
}

export function rateOf(attended: number, recorded: number): number | null {
  return recorded === 0 ? null : attended / recorded
}

// At or over the line counts as making it. 0.75 exactly is in.
export function meetsLine(rate: number | null, line: number): boolean {
  return rate !== null && rate >= line
}

// Attend the next N: the smallest N where (attended + N) / (recorded + N)
// reaches the line, assuming they attend every one of those N. If N is bigger
// than the trainings left this year, the line is out of reach for now.
export function attendNext(attended: number, recorded: number, left: number, line: number): ToLine {
  const rate = rateOf(attended, recorded)
  if (meetsLine(rate, line)) return { kind: 'above', onLine: rate === line }
  for (let n = 1; n <= left; n++) {
    if ((attended + n) / (recorded + n) >= line) return { kind: 'needs', n }
  }
  return { kind: 'out-of-reach', left }
}

// Streak is the run of attended trainings counting back from the most recent
// recorded one. Trainings a rep wasn't invited to don't break it.
export function streakOf(model: Model, rep: Rep, ctx: Context): number {
  let streak = 0
  for (let i = model.trainings.length - 1; i >= 0; i--) {
    const training = model.trainings[i]
    if (!isRecorded(training, ctx)) continue
    const entry = entryFor(model, rep, training.id)
    if (!entry.invited) continue
    if (!entry.attended) break
    streak++
  }
  return streak
}

// Attended and recorded counts, over whichever trainings `counts` says to use.
// Ranking calls this twice: once for now, once for "before the last training".
export function tally(model: Model, rep: Rep, counts: (t: Training) => boolean) {
  let attended = 0
  let recorded = 0
  for (const training of model.trainings) {
    if (!counts(training)) continue
    const entry = entryFor(model, rep, training.id)
    if (!entry.invited) continue
    recorded++
    if (entry.attended) attended++
  }
  return { attended, recorded }
}

export function repStats(model: Model, rep: Rep, ctx: Context): RepStats {
  const { attended, recorded } = tally(model, rep, (t) => isRecorded(t, ctx))
  let left = 0
  let next: Training | null = null
  for (const training of model.trainings) {
    if (isRecorded(training, ctx)) continue
    if (!entryFor(model, rep, training.id).invited) continue
    left++
    next ??= training
  }
  return {
    attended,
    recorded,
    rate: rateOf(attended, recorded),
    left,
    toLine: attendNext(attended, recorded, left, ctx.line),
    streak: streakOf(model, rep, ctx),
    next,
  }
}

// Show the rate as a whole percent, rounded down, so nobody looks like they
// made the line when they're a hair short (74.9% shows as 74%, not 75%).
export function percentOf(rate: number): number {
  return Math.floor(rate * 100 + 1e-9)
}

export function recordedTrainings(model: Model, ctx: Context): Training[] {
  return model.trainings.filter((t) => isRecorded(t, ctx))
}

export function todaysTrainings(model: Model, ctx: Context): Training[] {
  return model.trainings.filter((t) => t.date === ctx.today)
}
