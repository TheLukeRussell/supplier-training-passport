// Tests for the smaller helpers: seeded randomness, the model, stamps, the
// demo picks and the formatters.

import { describe, expect, it } from 'vitest'
import { SUPPLIERS } from '../config'
import { pickDefaultRep, pickTodayAttendees } from './demo'
import { daysBetween, initials, ordinal, shortDate, stampDate } from './format'
import { buildModel, findRep, repIdFromEmail, withAttendance } from './model'
import { hashString, seededRandom, shuffled, unitFor } from './random'
import { repStats, type Context } from './rules'
import { STAMP_SHAPES, stampLook } from './stamps'
import { FOUR, rowsFor } from './test-helpers'

describe('random', () => {
  it('gives the same sequence for the same seed', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('stays in [0, 1)', () => {
    const r = seededRandom(7)
    for (let i = 0; i < 1000; i++) {
      const x = r()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
  it('hashes strings stably', () => {
    expect(hashString('zebra')).toBe(hashString('zebra'))
    expect(hashString('zebra')).not.toBe(hashString('zebrA'))
    expect(unitFor('x', 1)).toBe(unitFor('x', 1))
  })
  it('shuffles without losing anything', () => {
    expect(shuffled([1, 2, 3, 4, 5], seededRandom(3)).sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('model', () => {
  it('makes url-safe rep ids from emails', () => {
    expect(repIdFromEmail('Hannah.Kowalski@example.com')).toBe('hannah-kowalski')
    expect(repIdFromEmail('amélie.o.gagnon@example.com')).toBe('amelie-o-gagnon')
  })
  it('sorts reps by name and trainings by date', () => {
    const rows = rowsFor([...FOUR].reverse(), { Zed: 'aaaa', Ana: 'aaaa' })
    const model = buildModel(rows)
    expect(model.reps.map((r) => r.name)).toEqual(['Ana', 'Zed'])
    expect(model.trainings.map((t) => t.id)).toEqual(['t1', 't2', 't3', 't4'])
  })
  it('only marks invited reps when recording attendance', () => {
    const model = buildModel(rowsFor(FOUR, { Ana: 'aaam', Ben: 'aaa-' }))
    const next = withAttendance(model, 't4', ['ana@example.com', 'ben@example.com'])
    const ctx: Context = { today: '2027-04-13', todayRecorded: true, line: 0.75 }
    expect(repStats(next, findRep(next, 'ana')!, ctx).attended).toBe(4)
    expect(repStats(next, findRep(next, 'ben')!, ctx).recorded).toBe(3)
    // the original model is untouched
    expect(repStats(model, findRep(model, 'ana')!, ctx).attended).toBe(3)
  })
})

describe('stampLook', () => {
  it('gives every listed supplier its own shape and ink pair', () => {
    const pairs = SUPPLIERS.map((s) => {
      const look = stampLook(s, 'a@example.com', 't1')
      return `${look.shape}/${look.ink}`
    })
    expect(new Set(pairs).size).toBe(SUPPLIERS.length)
  })
  it('keeps the same tilt for the same rep and training', () => {
    expect(stampLook('Zebra', 'a@example.com', 't1').rotate).toBe(stampLook('Zebra', 'a@example.com', 't1').rotate)
  })
  it('tilts a little, never a lot', () => {
    for (let i = 0; i < 50; i++) {
      const { rotate } = stampLook('Brady', `r${i}@example.com`, `t${i}`)
      expect(Math.abs(rotate)).toBeLessThanOrEqual(9)
    }
  })
  it('handles a supplier that is not on the list', () => {
    expect(STAMP_SHAPES).toContain(stampLook('Somebody New', 'a@example.com', 't1').shape)
  })
})

describe('demo picks', () => {
  const ctx: Context = { today: '2027-04-13', todayRecorded: false, line: 0.75 }
  const model = buildModel(rowsFor(FOUR, { Ana: 'aaam', Ben: 'aamm', Cy: 'amam', Di: 'aaa-' }))

  it('always includes the rep you are viewing as', () => {
    const cy = findRep(model, 'cy')!
    const picks = pickTodayAttendees(model, model.trainings[3], cy, 0, 1)
    expect(picks).toEqual(['cy@example.com'])
  })
  it('skips reps who were not invited', () => {
    const picks = pickTodayAttendees(model, model.trainings[3], findRep(model, 'ana')!, 1, 1)
    expect(picks).not.toContain('di@example.com')
  })
  it('is the same every time', () => {
    const ana = findRep(model, 'ana')!
    expect(pickTodayAttendees(model, model.trainings[3], ana, 0.5, 9)).toEqual(pickTodayAttendees(model, model.trainings[3], ana, 0.5, 9))
  })
  it('opens as someone who crosses the line today', () => {
    // Ana is 3/3 (above). Ben 2/3 -> 3/4 crosses. Cy 2/3 -> 3/4 crosses too, Ben wins on name.
    expect(pickDefaultRep(model, ctx)?.name).toBe('Ben')
  })
})

describe('format', () => {
  it('formats dates without time zone drift', () => {
    expect(shortDate('2027-06-17')).toBe('Thu, Jun 17')
    expect(stampDate('2027-01-05')).toBe('05 JAN 2027')
    expect(daysBetween('2027-06-17', '2027-07-14')).toBe(27)
  })
  it('does ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st'])
  })
  it('does initials', () => {
    expect(initials('Hannah Kowalski')).toBe('HK')
    expect(initials('Cher')).toBe('C')
  })
})
