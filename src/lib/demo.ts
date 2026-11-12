// Demo-only logic: who shows up when you hit "Record today's attendance",
// and which rep the demo opens as. Pure, so the tests can pin it down.

import { entryFor, type Model, type Rep, type Training } from './model'
import { unitFor } from './random'
import { meetsLine, repStats, type Context } from './rules'

// Everyone invited to today's training gets one seeded coin flip, so the
// same reps show up every time you record. The rep you're viewing as is
// always marked attended, since that's the point of the button.
export function pickTodayAttendees(
  model: Model,
  training: Training,
  viewAs: Rep,
  share: number,
  seed: number,
): string[] {
  const emails = model.reps
    .filter((rep) => entryFor(model, rep, training.id).invited)
    .filter((rep) => rep.email === viewAs.email || unitFor(`${rep.email}|${training.id}`, seed) < share)
    .map((rep) => rep.email)
  return emails.sort()
}

// Open the demo as someone who's just under the line and crosses it once
// today's attendance is recorded. That's the moment worth showing.
export function pickDefaultRep(model: Model, ctx: Context): Rep | undefined {
  const today = model.trainings.find((t) => t.date === ctx.today)
  const candidates = model.reps
    .filter((rep) => !today || entryFor(model, rep, today.id).invited)
    .map((rep) => ({ rep, stats: repStats(model, rep, ctx) }))
    .filter(({ stats }) => stats.recorded > 0 && !meetsLine(stats.rate, ctx.line))
    .filter(({ stats }) => (stats.attended + 1) / (stats.recorded + 1) >= ctx.line)
    .sort((a, b) => (b.stats.rate ?? 0) - (a.stats.rate ?? 0) || a.rep.name.localeCompare(b.rep.name))
  return candidates[0]?.rep ?? model.reps[0]
}
