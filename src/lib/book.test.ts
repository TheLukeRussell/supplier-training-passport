// Tests for the book's page math.

import { describe, expect, it } from 'vitest'
import { pageForTraining, pageForView, pagesInView, parsePage, viewCount, viewForPage, viewLabel } from './book'

const training = (date: string) => ({ id: 'x', supplier: 'Zebra', title: 'x', date, format: 'virtual' as const })

describe('book', () => {
  it('puts trainings on their quarter page', () => {
    expect(pageForTraining(training('2027-01-12'))).toBe(3)
    expect(pageForTraining(training('2027-06-17'))).toBe(4)
    expect(pageForTraining(training('2027-07-01'))).toBe(5)
    expect(pageForTraining(training('2027-12-14'))).toBe(6)
  })

  it('reads the page from the url and falls back to the cover', () => {
    expect(parsePage('4')).toBe(4)
    expect(parsePage(null)).toBe(0)
    expect(parsePage('7')).toBe(0)
    expect(parsePage('2.5')).toBe(0)
    expect(parsePage('nope')).toBe(0)
  })

  it('counts views', () => {
    expect(viewCount(true)).toBe(4)
    expect(viewCount(false)).toBe(7)
  })

  it('maps pages to spreads and back', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((p) => viewForPage(p, true))).toEqual([0, 1, 1, 2, 2, 3, 3])
    expect([0, 1, 2, 3].map((v) => pageForView(v, true))).toEqual([0, 2, 3, 5])
    expect(viewForPage(4, false)).toBe(4)
    expect(pageForView(4, false)).toBe(4)
  })

  it('lists what is showing', () => {
    expect(pagesInView(0, true)).toEqual([null, 0])
    expect(pagesInView(2, true)).toEqual([3, 4])
    expect(pagesInView(2, false)).toEqual([2])
  })

  it('labels the view for screen readers', () => {
    expect(viewLabel(0, true)).toBe('Cover')
    expect(viewLabel(1, true)).toBe('Pages 1 and 2 of 6')
    expect(viewLabel(4, false)).toBe('Visas, April to June, page 4 of 6')
  })
})
