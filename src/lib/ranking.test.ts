// Tests for tie ranking, rank change and the standings figures.

import { describe, expect, it } from 'vitest'
import { buildModel } from './model'
import { changeFor, compareRates, figuresFor, lineIndex, rankTallies, standings } from './ranking'
import type { Context } from './rules'
import { FOUR, rowsFor } from './test-helpers'

const ctx: Context = { today: '2027-04-13', todayRecorded: false, line: 0.75 }

describe('compareRates', () => {
  it('treats equal fractions as equal', () => {
    expect(compareRates({ attended: 7, recorded: 9 }, { attended: 14, recorded: 18 })).toBe(0)
  })
  it('sorts higher rates first', () => {
    expect(compareRates({ attended: 9, recorded: 10 }, { attended: 1, recorded: 2 })).toBeLessThan(0)
  })
})

describe('rankTallies', () => {
  it('shares ranks on ties and skips the next number', () => {
    const ranks = rankTallies([
      { id: 'a', name: 'Ana', tally: { attended: 4, recorded: 4 } },
      { id: 'b', name: 'Ben', tally: { attended: 3, recorded: 4 } },
      { id: 'c', name: 'Cy', tally: { attended: 6, recorded: 8 } },
      { id: 'd', name: 'Di', tally: { attended: 1, recorded: 4 } },
      { id: 'e', name: 'Ed', tally: { attended: 0, recorded: 0 } },
    ])
    expect([...ranks.entries()]).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 2],
      ['d', 4],
      ['e', null],
    ])
  })
})

describe('changeFor', () => {
  it('reads the move since the last training', () => {
    expect(changeFor(3, 5, true)).toEqual({ kind: 'up', places: 2 })
    expect(changeFor(5, 3, true)).toEqual({ kind: 'down', places: 2 })
    expect(changeFor(4, 4, true)).toEqual({ kind: 'same' })
    expect(changeFor(4, null, true)).toEqual({ kind: 'new' })
    expect(changeFor(null, null, true)).toEqual({ kind: 'none' })
    expect(changeFor(1, 1, false)).toEqual({ kind: 'none' })
  })
})

describe('standings', () => {
  const model = buildModel(rowsFor(FOUR, { Ana: 'aaa', Ben: 'maa', Cy: 'ama', Di: 'mma', Ed: '---a' }))
  const rows = standings(model, ctx)

  it('sorts by rank, alphabetical inside a tie, unranked last', () => {
    expect(rows.map((r) => [r.rep.name, r.rank])).toEqual([
      ['Ana', 1],
      ['Ben', 2],
      ['Cy', 2],
      ['Di', 4],
      ['Ed', null],
    ])
  })

  it('works out movement against the training before', () => {
    // Before t3: Ana 2/2, Cy 1/2, Ben 1/2, Di 0/2. Cy was tied 2nd and stays 2nd.
    // Ben was tied 2nd too. Di was 4th and stays 4th.
    const change = Object.fromEntries(rows.map((r) => [r.rep.name, r.change]))
    expect(change.Ana).toEqual({ kind: 'same' })
    expect(change.Di).toEqual({ kind: 'same' })
    expect(change.Ed).toEqual({ kind: 'none' })
  })

  it('marks who is above the line and where the line falls', () => {
    expect(rows.map((r) => r.above)).toEqual([true, false, false, false, false])
    expect(lineIndex(rows)).toBe(1)
  })

  it("moves people once today's training is recorded", () => {
    const after = standings(model, { ...ctx, todayRecorded: true })
    const ed = after.find((r) => r.rep.name === 'Ed')!
    expect(ed.rank).toBe(1) // 1 of 1, tied with Ana's 3 of 3
    expect(ed.change).toEqual({ kind: 'new' })
  })
})

describe('figuresFor', () => {
  it('computes the three numbers', () => {
    const model = buildModel(rowsFor(FOUR, { Ana: 'aaa', Ben: 'maa', Ed: '----' }))
    const rows = standings(model, ctx)
    const figures = figuresFor(rows, model, ctx)
    expect(figures.above).toBe(1)
    expect(figures.ranked).toBe(2)
    expect(figures.averageRate).toBeCloseTo((1 + 2 / 3) / 2)
    expect(figures.held).toBe(3)
    expect(figures.total).toBe(4)
  })
  it('has no average with nobody ranked', () => {
    const model = buildModel(rowsFor(FOUR, { Ed: '----' }))
    expect(figuresFor(standings(model, ctx), model, ctx).averageRate).toBeNull()
  })
})
