// Checks the generated sample file actually has the cases the demo leans on.
// If someone tweaks the data script and breaks the story, this goes red.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEMO_SEED, DEMO_TODAY, DEMO_TODAY_SHARE, LINE, SUPPLIERS, TEAMS } from '../config'
import type { AttendanceRow } from '../data/types'
import { pickDefaultRep, pickTodayAttendees } from './demo'
import { buildModel, withAttendance } from './model'
import { standings } from './ranking'
import { repStats, type Context } from './rules'

const rows: AttendanceRow[] = JSON.parse(readFileSync(join(process.cwd(), 'public/data/attendance.json'), 'utf8'))
const model = buildModel(rows)
const ctx: Context = { today: DEMO_TODAY, todayRecorded: false, line: LINE }
const board = standings(model, ctx)

describe('sample data', () => {
  it('has 30 reps on four teams and 24 trainings', () => {
    expect(model.reps).toHaveLength(30)
    expect(new Set(model.reps.map((r) => r.team))).toEqual(new Set(TEAMS))
    expect(model.trainings).toHaveLength(24)
    expect(rows).toHaveLength(30 * 24)
  })

  it('only uses example.com emails and the listed suppliers', () => {
    expect(rows.every((r) => r.rep_email.endsWith('@example.com'))).toBe(true)
    expect(rows.every((r) => (SUPPLIERS as readonly string[]).includes(r.supplier))).toBe(true)
  })

  it('has nobody attending anything from today on', () => {
    expect(rows.filter((r) => r.date >= DEMO_TODAY).every((r) => !r.attended)).toBe(true)
  })

  it('has one perfect record', () => {
    expect(board.filter((r) => r.stats.recorded > 0 && r.stats.attended === r.stats.recorded)).toHaveLength(1)
  })

  it('has one rep exactly on the line', () => {
    expect(board.filter((r) => r.stats.rate === LINE)).toHaveLength(1)
  })

  it('has a tie', () => {
    const ranks = board.map((r) => r.rank).filter((r) => r !== null)
    expect(new Set(ranks).size).toBeLessThan(ranks.length)
  })

  it('has a new hire with no stamps who is not ranked yet', () => {
    const newHire = board.find((r) => r.rep.name === 'Clara Dubois')!
    expect(newHire.rank).toBeNull()
    expect(newHire.stats.attended).toBe(0)
    expect(rows.filter((r) => r.rep_name === 'Clara Dubois' && r.date < '2027-06-01').every((r) => !r.invited)).toBe(true)
  })

  it('has roughly half the reps above the line', () => {
    const share = board.filter((r) => r.above).length / board.filter((r) => r.rank !== null).length
    expect(share).toBeGreaterThan(0.4)
    expect(share).toBeLessThan(0.6)
  })

  it('opens the demo as a rep who crosses the line once today is recorded', () => {
    const rep = pickDefaultRep(model, ctx)!
    expect(repStats(model, rep, ctx).toLine.kind).toBe('needs')
    const today = model.trainings.find((t) => t.date === DEMO_TODAY)!
    const after = withAttendance(model, today.id, pickTodayAttendees(model, today, rep, DEMO_TODAY_SHARE, DEMO_SEED))
    expect(repStats(after, rep, { ...ctx, todayRecorded: true }).toLine.kind).toBe('above')
  })
})
