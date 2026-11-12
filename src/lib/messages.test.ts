// Tests for the wording of where a rep stands.

import { describe, expect, it } from 'vitest'
import { endorsement, lineMessage, standing } from './messages'
import type { Context, RepStats, ToLine } from './rules'

const ctx: Context = { today: '2027-06-17', todayRecorded: false, line: 0.75 }
const pioneer = { id: 't12', supplier: 'Pioneer', title: 'Pioneer partner training', date: '2027-06-17', format: 'virtual' as const }

function stats(attended: number, recorded: number, left: number, toLine: ToLine): RepStats {
  return { attended, recorded, left, toLine, rate: recorded ? attended / recorded : null, streak: 0, next: pioneer }
}

describe('lineMessage', () => {
  it('spells out one, and says what missing it costs', () => {
    // 8 of 11: miss Pioneer and it's 8 of 12, which needs 4 in a row.
    expect(lineMessage(stats(8, 11, 13, { kind: 'needs', n: 1 }), ctx)).toEqual({
      head: 'Attend the next one to reach the line',
      sub: 'Miss it and it takes 4 in a row.',
    })
  })
  it('says when missing one more puts the line out of reach', () => {
    // 4 of 9 with 11 left needs all 11. Miss one and it can't be done.
    expect(lineMessage(stats(4, 9, 11, { kind: 'needs', n: 11 }), ctx)).toEqual({
      head: 'Attend the next 11 to reach the line',
      sub: 'Miss one and the line is out of reach this year.',
    })
  })
  it('says how close an out-of-reach rep can still get', () => {
    expect(lineMessage(stats(3, 8, 11, { kind: 'out-of-reach', left: 11 }), ctx).sub).toBe(
      'Even all 11 trainings left only gets you to 73%.',
    )
  })
  it('gives room to spare above the line, none on it', () => {
    expect(lineMessage(stats(9, 10, 12, { kind: 'above', onLine: false }), ctx)).toEqual({
      head: 'Above the line',
      sub: 'You could miss the next 2 and still be above it.',
    })
    expect(lineMessage(stats(6, 8, 12, { kind: 'above', onLine: true }), ctx)).toEqual({
      head: 'Right on the line',
      sub: 'Miss the next one and you drop below it.',
    })
  })
})

describe('standing', () => {
  it('names where a rep stands', () => {
    expect(standing(stats(8, 11, 13, { kind: 'needs', n: 1 }))).toBe('One from the line')
    expect(standing(stats(5, 8, 12, { kind: 'needs', n: 4 }))).toBe('4 from the line')
    expect(standing(stats(3, 8, 11, { kind: 'out-of-reach', left: 11 }))).toBe('The line is out of reach this year')
  })
  it('says when a rep is above or on the line', () => {
    expect(standing(stats(9, 10, 12, { kind: 'above', onLine: false }))).toBe('Above the line')
    expect(standing(stats(6, 8, 12, { kind: 'above', onLine: true }))).toBe('Right on the line')
  })
})

describe('endorsement', () => {
  // The real strings use non-breaking spaces inside the date and the count.
  const plain = (text: string | null) => text?.replace(/\u00a0/g, ' ')
  it('writes up a fresh stamp', () => {
    expect(plain(endorsement(stats(9, 12, 12, { kind: 'above', onLine: true }), 'stamped', pioneer))).toBe(
      'Stamped 17 JUN 2027. 9 of 12, 75%. Right on the line.',
    )
  })
  it('writes up a miss too', () => {
    expect(plain(endorsement(stats(8, 12, 12, { kind: 'needs', n: 4 }), 'missed', pioneer))).toBe(
      'Missed 17 JUN 2027. 8 of 12, 66%. 4 from the line.',
    )
  })
  it('says nothing for a training that has not been recorded', () => {
    expect(endorsement(stats(8, 11, 13, { kind: 'needs', n: 1 }), 'today', pioneer)).toBeNull()
  })
})
