// Page math for the passport book. Page 0 is the front cover, then six
// inside pages (the inside cover, the data page, four visa pages, one per
// quarter), then page 7, the back cover.
// On a phone you see one page at a time. On a wide screen you see spreads:
// the closed front, pages 1 and 2, 3 and 4, 5 and 6, then the closed back.

import type { Training } from './model'

export const PAGE_COUNT = 6 // inside pages
export const DATA_PAGE = 2
export const BACK_COVER = PAGE_COUNT + 1

export interface PageInfo {
  page: number
  name: string
  months?: [number, number, number]
}

export const PAGES: PageInfo[] = [
  { page: 1, name: 'Inside cover' },
  { page: 2, name: 'Data page' },
  { page: 3, name: 'Visas, January to March', months: [1, 2, 3] },
  { page: 4, name: 'Visas, April to June', months: [4, 5, 6] },
  { page: 5, name: 'Visas, July to September', months: [7, 8, 9] },
  { page: 6, name: 'Visas, October to December', months: [10, 11, 12] },
]

export const ALL_PAGES = Array.from({ length: BACK_COVER + 1 }, (_, i) => i)

// Which visa page a training lives on: one page per quarter.
export function pageForTraining(training: Training): number {
  const month = Number(training.date.slice(5, 7))
  return 2 + Math.ceil(month / 3)
}

// Anything that isn't a whole page number from 1 to 7 means the front cover.
export function parsePage(value: string | null): number {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= BACK_COVER ? n : 0
}

export function viewCount(spread: boolean): number {
  return spread ? 2 + PAGE_COUNT / 2 : BACK_COVER + 1
}

const lastSpread = () => 1 + PAGE_COUNT / 2

// A "view" is what's in front of you: one page on a phone, a spread on a
// wide screen. Page 3 on a wide screen is spread 2 (pages 3 and 4).
export function viewForPage(page: number, spread: boolean): number {
  if (!spread) return page
  if (page === 0) return 0
  if (page === BACK_COVER) return lastSpread()
  return Math.ceil(page / 2)
}

// The page number to put in the URL for a view. On a wide screen the first
// spread maps to the data page, so the same link opens the data page on a phone.
export function pageForView(view: number, spread: boolean): number {
  if (!spread) return view
  if (view === 0) return 0
  if (view === lastSpread()) return BACK_COVER
  return view === 1 ? DATA_PAGE : view * 2 - 1
}

// The pages showing in a view. Spreads are [left, right]. The closed book on
// a wide screen is [null, 0] at the front (the cover on the right) and
// [7, null] at the back (the back cover on the left).
export function pagesInView(view: number, spread: boolean): (number | null)[] {
  if (!spread) return [view]
  if (view === 0) return [null, 0]
  if (view === lastSpread()) return [BACK_COVER, null]
  return [view * 2 - 1, view * 2]
}

export function viewLabel(view: number, spread: boolean): string {
  const pages = pagesInView(view, spread).filter((p): p is number => p !== null)
  if (pages.length === 1 && pages[0] === 0) return 'Cover'
  if (pages.length === 1 && pages[0] === BACK_COVER) return 'Back cover'
  if (pages.length === 1) return `${PAGES[pages[0] - 1].name}, page ${pages[0]} of ${PAGE_COUNT}`
  return `Pages ${pages[0]} and ${pages[1]} of ${PAGE_COUNT}`
}
