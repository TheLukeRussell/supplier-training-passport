// Tests for the machine-readable strip.

import { describe, expect, it } from 'vitest'
import { checkDigit, mrzLines } from './mrz'

describe('checkDigit', () => {
  it('matches the worked examples from the passport spec', () => {
    expect(checkDigit('L898902C3')).toBe('6')
    expect(checkDigit('740812')).toBe('2')
    expect(checkDigit('120415')).toBe('9')
  })
  it('treats filler as zero', () => {
    expect(checkDigit('<<<<')).toBe('0')
  })
})

describe('mrzLines', () => {
  const base = {
    name: 'Hannah Kowalski',
    team: 'East',
    attended: 8,
    recorded: 11,
    percent: 72,
    rank: 15,
    issue: '2027-01-01',
    expiry: '2027-12-31',
  }

  it('makes two lines of 44', () => {
    const [one, two] = mrzLines(base)
    expect(one).toHaveLength(44)
    expect(two).toHaveLength(44)
  })

  it('puts the surname first, then given names', () => {
    expect(mrzLines(base)[0]).toBe('P<STPKOWALSKI<<HANNAH'.padEnd(44, '<'))
  })

  it('packs the stats into line two', () => {
    const two = mrzLines(base)[1]
    expect(two.startsWith('HKOWALSKI')).toBe(true)
    expect(two).toContain('EST270101')
    expect(two).toContain('A08I11R072K15')
  })

  it('strips accents and fills unranked stats', () => {
    const [one, two] = mrzLines({ ...base, name: 'Amélie Gagnon', team: 'Canada', attended: 0, recorded: 0, percent: null, rank: null })
    expect(one).toContain('GAGNON<<AMELIE')
    expect(two).toContain('CAN')
    expect(two).toContain('A00I00R<<<K<<')
  })

  it('handles hyphens and long names without going over 44', () => {
    const [one] = mrzLines({ ...base, name: 'Maria-Luisa Fernandez-Castellanos de la Vega Montoya' })
    expect(one).toHaveLength(44)
    expect(one).not.toMatch(/[^A-Z0-9<]/)
  })
})
