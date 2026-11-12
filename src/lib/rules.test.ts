// Tests for the rate, attend-next-N, streak and slot rules.

import { describe, expect, it } from 'vitest'
import { buildModel, findRep } from './model'
import { attendNext, isRecorded, meetsLine, percentOf, rateOf, repStats, slotState, streakOf, type Context } from './rules'
import { FOUR, rowsFor } from './test-helpers'

// Today is the fourth training's date, not recorded yet.
const ctx: Context = { today: '2027-04-13', todayRecorded: false, line: 0.75 }

describe('isRecorded', () => {
  const model = buildModel(rowsFor(FOUR, { Ana: 'aaaa' }))
  it('counts trainings before today', () => {
    expect(isRecorded(model.trainings[0], ctx)).toBe(true)
  })
  it("leaves today's training out until it's recorded", () => {
    expect(isRecorded(model.trainings[3], ctx)).toBe(false)
    expect(isRecorded(model.trainings[3], { ...ctx, todayRecorded: true })).toBe(true)
  })
  it('never counts a future training', () => {
    expect(isRecorded(model.trainings[3], { ...ctx, today: '2027-03-01', todayRecorded: true })).toBe(false)
  })
})

describe('rateOf and meetsLine', () => {
  it('is null with nothing recorded', () => {
    expect(rateOf(0, 0)).toBeNull()
    expect(meetsLine(null, 0.75)).toBe(false)
  })
  it('counts exactly on the line as making it', () => {
    expect(meetsLine(rateOf(6, 8), 0.75)).toBe(true)
    expect(meetsLine(rateOf(9, 12), 0.75)).toBe(true)
    expect(meetsLine(rateOf(8, 11), 0.75)).toBe(false)
  })
})

describe('percentOf', () => {
  it('rounds down so a near miss never shows the line number', () => {
    expect(percentOf(8 / 11)).toBe(72)
    expect(percentOf(0.7499)).toBe(74)
    expect(percentOf(0.75)).toBe(75)
  })
  it("doesn't trip on float noise", () => {
    expect(percentOf(0.29)).toBe(29)
    expect(percentOf(1)).toBe(100)
  })
})

describe('attendNext', () => {
  it('says above, and flags exactly on the line', () => {
    expect(attendNext(9, 10, 5, 0.75)).toEqual({ kind: 'above', onLine: false })
    expect(attendNext(6, 8, 5, 0.75)).toEqual({ kind: 'above', onLine: true })
  })
  it('finds the smallest N', () => {
    // 8/11 -> 9/12 is exactly 0.75
    expect(attendNext(8, 11, 13, 0.75)).toEqual({ kind: 'needs', n: 1 })
    // 5/8 needs (5+N)/(8+N) >= 0.75, so N = 4
    expect(attendNext(5, 8, 12, 0.75)).toEqual({ kind: 'needs', n: 4 })
  })
  it('caps N by what is left this year', () => {
    expect(attendNext(3, 8, 11, 0.75)).toEqual({ kind: 'out-of-reach', left: 11 })
    expect(attendNext(4, 9, 11, 0.75)).toEqual({ kind: 'needs', n: 11 })
  })
  it('asks a brand new rep for one', () => {
    expect(attendNext(0, 0, 13, 0.75)).toEqual({ kind: 'needs', n: 1 })
  })
  it('is out of reach when nothing is left', () => {
    expect(attendNext(1, 4, 0, 0.75)).toEqual({ kind: 'out-of-reach', left: 0 })
  })
})

describe('streakOf', () => {
  it('counts back from the most recent recorded training', () => {
    const model = buildModel(rowsFor(FOUR, { Ana: 'maaa', Ben: 'aama', Cy: 'aaaa' }))
    // t4 is today and unrecorded, so only t1 to t3 count
    expect(streakOf(model, findRep(model, 'ana')!, ctx)).toBe(2)
    expect(streakOf(model, findRep(model, 'ben')!, ctx)).toBe(0)
    expect(streakOf(model, findRep(model, 'cy')!, { ...ctx, todayRecorded: true })).toBe(4)
  })
  it('skips trainings the rep was not invited to', () => {
    const model = buildModel(rowsFor(FOUR, { Ana: 'a-aa' }))
    expect(streakOf(model, findRep(model, 'ana')!, ctx)).toBe(2)
  })
})

describe('slotState', () => {
  const model = buildModel(rowsFor(FOUR, { Ana: 'am-a' }))
  const ana = findRep(model, 'ana')!
  it('maps each slot', () => {
    expect(model.trainings.map((t) => slotState(model, ana, t, ctx))).toEqual(['stamped', 'missed', 'not-invited', 'today'])
  })
  it('turns today into a stamp once recorded', () => {
    expect(slotState(model, ana, model.trainings[3], { ...ctx, todayRecorded: true })).toBe('stamped')
  })
})

describe('repStats', () => {
  it('rolls it all up', () => {
    const model = buildModel(rowsFor(FOUR, { Ana: 'amaa' }))
    const stats = repStats(model, findRep(model, 'ana')!, ctx)
    expect(stats).toMatchObject({ attended: 2, recorded: 3, left: 1, streak: 1 })
    expect(stats.next?.id).toBe('t4')
    expect(stats.toLine).toEqual({ kind: 'needs', n: 1 })
  })
  it('ignores attended flags on trainings a rep was not invited to', () => {
    const rows = rowsFor(FOUR, { Ana: 'a---' })
    rows[1].attended = true // invited false, attended true: bad export row
    const model = buildModel(rows)
    expect(repStats(model, findRep(model, 'ana')!, ctx)).toMatchObject({ attended: 1, recorded: 1 })
  })
})
