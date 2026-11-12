// Checks the generated sample file actually has the cases the demo leans on.
// If someone tweaks the data script and breaks the story, this goes red.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEMO_SEED, DEMO_TODAY, DEMO_TODAY_SHARE, LINE, MIN_RECORDED, SUPPLIERS, TEAMS } from '../config'
import type { AttendanceRow } from '../data/types'
import { pickDefaultRep, pickTodayAttendees } from './demo'
import { buildModel, entryFor, findRep, withAttendance, type Rep } from './model'
import { figuresFor, standings } from './ranking'
import { repStats, type Context } from './rules'

const rows: AttendanceRow[] = JSON.parse(readFileSync(join(process.cwd(), 'public/data/attendance.json'), 'utf8'))
const model = buildModel(rows)
const ctx: Context = { today: DEMO_TODAY, todayRecorded: false, line: LINE }
const board = standings(model, ctx)
const today = model.trainings.find((t) => t.date === DEMO_TODAY)!
const rowOf = (list: typeof board, name: string) => list.find((r) => r.rep.name === name)!

// The demo's Record button, pressed on this rep's passport.
function recordAs(rep: Rep) {
  const emails = pickTodayAttendees(model, today, rep, DEMO_TODAY_SHARE, DEMO_SEED)
  const after = withAttendance(model, today.id, emails)
  const afterCtx = { ...ctx, todayRecorded: true }
  return { emails, model: after, ctx: afterCtx, board: standings(after, afterCtx) }
}

describe('sample data', () => {
  it('has 60 reps, 12 on each of the five teams, and 24 trainings', () => {
    expect(model.reps).toHaveLength(60)
    for (const team of TEAMS) expect(model.reps.filter((r) => r.team === team), team).toHaveLength(12)
    expect(model.trainings).toHaveLength(24)
    expect(rows).toHaveLength(60 * 24)
  })

  it('invites everyone to virtual trainings and only some teams in person', () => {
    const teamsAt = (id: string) => new Set(rows.filter((r) => r.training_id === id && r.invited).map((r) => r.team))
    for (const t of model.trainings) {
      if (t.format === 'virtual') expect(teamsAt(t.id).size, t.title).toBe(TEAMS.length)
      else expect(teamsAt(t.id).size, t.title).toBeLessThan(TEAMS.length)
    }
    // Every team gets at least one in-person session this year.
    const inPerson = model.trainings.filter((t) => t.format === 'in person')
    for (const team of TEAMS) expect(inPerson.some((t) => teamsAt(t.id).has(team)), team).toBe(true)
  })

  it('gives each team its own invite count before today', () => {
    const invites = Object.fromEntries(
      TEAMS.map((team) => {
        const rep = model.reps.find((r) => r.team === team && r.name !== 'Clara Dubois')!
        return [team, repStats(model, rep, ctx).recorded]
      }),
    )
    expect(invites).toEqual({ Communications: 7, POSB: 10, NetSec: 8, Cisco: 7, Federal: 8 })
  })

  it('only runs Cisco after today, so the history before it never changed', () => {
    const cisco = model.trainings.filter((t) => t.supplier === 'Cisco')
    expect(cisco.map((t) => t.format)).toEqual(['virtual', 'in person'])
    expect(cisco.every((t) => t.date > DEMO_TODAY)).toBe(true)
  })

  it('only uses example.com emails and the listed suppliers', () => {
    expect(rows.every((r) => r.rep_email.endsWith('@example.com'))).toBe(true)
    expect(rows.every((r) => (SUPPLIERS as readonly string[]).includes(r.supplier))).toBe(true)
  })

  it('has nobody attending anything from today on', () => {
    expect(rows.filter((r) => r.date >= DEMO_TODAY).every((r) => !r.attended)).toBe(true)
  })

  it('has one perfect record, in 1st', () => {
    const perfect = board.filter((r) => r.stats.recorded > 0 && r.stats.attended === r.stats.recorded)
    expect(perfect.map((r) => [r.rep.name, r.rank])).toEqual([['Jordan Hale', 1]])
  })

  it('has one rep exactly on the line', () => {
    expect(board.filter((r) => r.stats.rate === LINE).map((r) => r.rep.name)).toEqual(['Ethan Park'])
  })

  it('has two reps tied for 2nd', () => {
    expect(board.filter((r) => r.rank === 2).map((r) => [r.rep.name, r.tied])).toEqual([
      ['Marcus Bell', true],
      ['Priya Natarajan', true],
    ])
  })

  it('has a new hire with no stamps who is not ranked yet', () => {
    const newHire = rowOf(board, 'Clara Dubois')
    expect(newHire.rank).toBeNull()
    expect(newHire.stats.attended).toBe(0)
    expect(rows.filter((r) => r.rep_name === 'Clara Dubois' && r.date < '2027-06-01').every((r) => !r.invited)).toBe(true)
  })

  it('has everyone but the new hire ranked, before today and before the last training', () => {
    // So the three-training rule only ever changes Clara. The last training
    // before today is what the change column compares against.
    const last = model.trainings.filter((t) => t.date < DEMO_TODAY).at(-1)!
    const beforeLast: Context = { ...ctx, today: last.date }
    for (const rep of model.reps.filter((r) => r.name !== 'Clara Dubois')) {
      expect(repStats(model, rep, ctx).recorded, rep.name).toBeGreaterThanOrEqual(MIN_RECORDED)
      expect(repStats(model, rep, beforeLast).recorded, rep.name).toBeGreaterThanOrEqual(MIN_RECORDED)
    }
  })

  it('has roughly half the reps above the line', () => {
    const share = board.filter((r) => r.above).length / board.filter((r) => r.rank !== null).length
    expect(share).toBeGreaterThan(0.4)
    expect(share).toBeLessThan(0.6)
  })

  it('opens the demo as Hannah, 28th, who crosses the line once today is recorded', () => {
    const rep = pickDefaultRep(model, ctx)!
    expect(rep.name).toBe('Hannah Kowalski')
    expect(rep.team).toBe('Communications')
    expect(rowOf(board, rep.name)).toMatchObject({ rank: 28, tied: true })
    expect(repStats(model, rep, ctx)).toMatchObject({ attended: 5, recorded: 7, toLine: { kind: 'needs', n: 1 } })
    const after = recordAs(rep)
    expect(repStats(after.model, rep, after.ctx)).toMatchObject({ attended: 6, recorded: 8, toLine: { kind: 'above', onLine: true } })
    expect(rowOf(after.board, rep.name)).toMatchObject({ rank: 24, tied: true, above: true })
  })
})

describe("after Record on Hannah's passport", () => {
  const hannah = pickDefaultRep(model, ctx)!
  const after = recordAs(hannah)

  it('puts more reps above the line, and nobody who was above falls under it', () => {
    const before = figuresFor(board, model, ctx)
    const now = figuresFor(after.board, after.model, after.ctx)
    expect(now.above).toBeGreaterThan(before.above)
    expect(now.averageRate!).toBeGreaterThanOrEqual(before.averageRate!)
    const fell = board.filter((r) => r.above && !rowOf(after.board, r.rep.name).above).map((r) => r.rep.name)
    expect(fell).toEqual([])
  })

  it('keeps the story: Jordan perfect in 1st, Marcus and Priya tied 2nd', () => {
    expect(rowOf(after.board, 'Jordan Hale')).toMatchObject({ rank: 1, tied: false })
    expect(rowOf(after.board, 'Jordan Hale').stats.rate).toBe(1)
    expect(rowOf(after.board, 'Marcus Bell')).toMatchObject({ rank: 2, tied: true })
    expect(rowOf(after.board, 'Priya Natarajan')).toMatchObject({ rank: 2, tied: true })
  })

  it("ties Federal's top rep with NetSec reps, so the Federal filter still shows a T", () => {
    const federal = after.board.filter((r) => r.rep.team === 'Federal' && r.rank !== null)
    expect(federal[0]).toMatchObject({ rep: { name: 'Liam Tremblay' }, rank: 4, tied: true })
    expect(federal.filter((r) => r.rank === 4)).toHaveLength(1)
    expect(after.board.filter((r) => r.rank === 4).every((r) => r.rep.team === 'Federal' || r.rep.team === 'NetSec')).toBe(true)
  })

  it('marks about two thirds of the reps invited today', () => {
    const invited = model.reps.filter((r) => entryFor(model, r, today.id).invited)
    const share = after.emails.length / invited.length
    expect(share).toBeGreaterThan(0.6)
    expect(share).toBeLessThan(0.72)
  })
})

describe('the new hire after Record', () => {
  const clara = findRep(model, 'clara-dubois')!

  it("stays unranked at 0 of 1 when Record is pressed on Hannah's passport", () => {
    const row = rowOf(recordAs(pickDefaultRep(model, ctx)!).board, clara.name)
    expect([row.stats.attended, row.stats.recorded]).toEqual([0, 1])
    expect(row).toMatchObject({ rank: null, above: false, change: { kind: 'none' } })
  })

  it('stays unranked at 1 of 1 when Record is pressed on her own passport', () => {
    const { board: after } = recordAs(clara)
    const row = rowOf(after, clara.name)
    expect([row.stats.attended, row.stats.recorded]).toEqual([1, 1])
    expect(row).toMatchObject({ rank: null, above: false, change: { kind: 'none' } })
    // Nobody else's rank is touched by her stamp.
    expect(after.filter((r) => r.rank === 1).map((r) => r.rep.name)).toEqual(['Jordan Hale'])
  })
})
