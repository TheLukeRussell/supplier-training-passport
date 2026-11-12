// Tests for the machine-readable strip.

import { describe, expect, it } from 'vitest'
import { TEAMS } from '../config'
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
    team: 'Communications',
    attended: 5,
    recorded: 7,
    percent: 71,
    rank: 28,
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
    expect(two).toContain('COM270101')
    expect(two).toContain('A05I07R071K28')
  })

  it('strips accents and fills unranked stats', () => {
    const [one, two] = mrzLines({ ...base, name: 'Amélie Gagnon', team: 'Federal', attended: 0, recorded: 0, percent: null, rank: null })
    expect(one).toContain('GAGNON<<AMELIE')
    expect(two).toContain('FED')
    expect(two).toContain('A00I00R<<<K<<')
  })

  it('gives every team its own three letters', () => {
    const codes = TEAMS.map((team) => mrzLines({ ...base, team })[1].slice(10, 13))
    expect(codes).toEqual(['COM', 'POS', 'NET', 'CSC', 'FED'])
  })

  it('handles hyphens and long names without going over 44', () => {
    const [one] = mrzLines({ ...base, name: 'Maria-Luisa Fernandez-Castellanos de la Vega Montoya' })
    expect(one).toHaveLength(44)
    expect(one).not.toMatch(/[^A-Z0-9<]/)
  })
})
