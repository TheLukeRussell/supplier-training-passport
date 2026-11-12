// Tests for tie ranking, rank change and the standings figures.

import { describe, expect, it } from 'vitest'
import { buildModel } from './model'
import { changeFor, compareRates, figuresFor, lineIndex, rankTallies, standings } from './ranking'
import type { Context } from './rules'
import { FOUR, rowsFor, SIX } from './test-helpers'

const ctx: Context = { today: '2027-04-13', todayRecorded: false, line: 0.75 }
const ctx6: Context = { today: '2027-06-17', todayRecorded: false, line: 0.75 }

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

  it('leaves anyone with fewer than three recorded unranked', () => {
    const items = [
      { id: 'a', name: 'Ana', tally: { attended: 2, recorded: 3 } },
      { id: 'b', name: 'Ben', tally: { attended: 2, recorded: 2 } },
      { id: 'c', name: 'Cy', tally: { attended: 0, recorded: 1 } },
    ]
    expect([...rankTallies(items).entries()]).toEqual([
      ['a', 1],
      ['b', null],
      ['c', null],
    ])
    // The minimum is a setting, but nothing recorded is never ranked.
    expect(rankTallies(items, 1).get('b')).toBe(1)
    expect(rankTallies([{ id: 'e', name: 'Ed', tally: { attended: 0, recorded: 0 } }], 0).get('e')).toBeNull()
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
  // Five recorded before today (t6). Fi has only two of them, Ed none.
  const model = buildModel(
    rowsFor(SIX, { Ana: 'aaaaa-', Ben: 'maaaa-', Cy: 'aaaam-', Di: 'mmaaa-', Ed: '-----a', Fi: '---aaa' }),
  )
  const rows = standings(model, ctx6)
  const by = (list: typeof rows) => Object.fromEntries(list.map((r) => [r.rep.name, r]))

  it('sorts by rank, alphabetical inside a tie, unranked last', () => {
    expect(rows.map((r) => [r.rep.name, r.rank])).toEqual([
      ['Ana', 1],
      ['Ben', 2],
      ['Cy', 2],
      ['Di', 4],
      ['Ed', null],
      ['Fi', null],
    ])
  })

  it('marks the reps who share a rank', () => {
    expect(rows.map((r) => r.tied)).toEqual([false, true, true, false, false, false])
  })

  it('keeps the tie when the board is filtered down to one of them', () => {
    const twoTeams = buildModel([...rowsFor(SIX, { Ana: 'aaaaa-', Ben: 'maaaa-' }), ...rowsFor(SIX, { Cy: 'aaaam-' }, 'West')])
    const west = standings(twoTeams, ctx6).filter((r) => r.rep.team === 'West')
    expect(west.map((r) => [r.rep.name, r.rank, r.tied])).toEqual([['Cy', 2, true]])
  })

  it('works out movement against the training before', () => {
    // Before t5: Ana and Cy 4 of 4 (tied 1st), Ben 3 of 4 (3rd), Di 2 of 4 (4th).
    const change = Object.fromEntries(rows.map((r) => [r.rep.name, r.change]))
    expect(change.Ana).toEqual({ kind: 'same' })
    expect(change.Ben).toEqual({ kind: 'up', places: 1 })
    expect(change.Cy).toEqual({ kind: 'down', places: 1 })
    expect(change.Di).toEqual({ kind: 'same' })
    expect(change.Ed).toEqual({ kind: 'none' })
    expect(change.Fi).toEqual({ kind: 'none' })
  })

  it('marks who is above the line and where the line falls', () => {
    // Fi is at 2 of 2, but unranked reps never count as above.
    expect(rows.map((r) => r.above)).toEqual([true, true, true, false, false, false])
    expect(lineIndex(rows)).toBe(3)
  })

  it("ranks a rep once today's training makes their third", () => {
    const after = by(standings(model, { ...ctx6, todayRecorded: true }))
    expect(after.Fi.rank).toBe(1) // 3 of 3, tied with Ana's 5 of 5
    expect(after.Fi.tied).toBe(true)
    expect(after.Fi.change).toEqual({ kind: 'new' })
    expect(after.Ben.change).toEqual({ kind: 'down', places: 1 })
  })

  it('keeps a new hire unranked at 1 of 1', () => {
    const after = by(standings(model, { ...ctx6, todayRecorded: true }))
    expect(after.Ed.stats.attended).toBe(1)
    expect(after.Ed.stats.recorded).toBe(1)
    expect(after.Ed.rank).toBeNull()
    expect(after.Ed.above).toBe(false)
    expect(after.Ed.change).toEqual({ kind: 'none' })
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
  it('leaves unranked reps out of the line count and the average', () => {
    const model = buildModel(rowsFor(SIX, { Ana: 'aaaaa-', Di: 'mmaaa-', Fi: '---aaa' }))
    const figures = figuresFor(standings(model, ctx6), model, ctx6)
    expect(figures.above).toBe(1)
    expect(figures.ranked).toBe(2)
    expect(figures.averageRate).toBeCloseTo((1 + 3 / 5) / 2)
  })
  it('has no average with nobody ranked', () => {
    const model = buildModel(rowsFor(FOUR, { Ed: '----' }))
    expect(figuresFor(standings(model, ctx), model, ctx).averageRate).toBeNull()
  })
})
