// The book and its page turn. It always settles on whatever view the URL asks
// for; if that's a different view than the one showing, it turns a page to
// get there (or just swaps, under reduced motion).

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ALL_PAGES, TURN_MS, pagesInView, viewCount } from '../../lib/book'
import './Book.css'

interface Props {
  view: number
  spread: boolean
  reduced: boolean
  // Render one page. `still` is true while a turn is running (and for the
  // hidden sizer copies), so a page can hold off on its own animation, the
  // stamp, until the paper stops moving.
  render: (page: number, still: boolean) => ReactNode
}

interface Turn {
  from: number
  to: number
  spread: boolean
}

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

export function Book({ view, spread, reduced, render }: Props) {
  const [settled, setSettled] = useState({ view, spread })
  const [pending, setTurn] = useState<Turn | null>(null)
  const leafRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const lastShown = useRef(settled)

  // Going from phone to spread (or back) changes what a "view" means. When
  // that happens, show the new view straight away instead of turning.
  const shown = settled.spread === spread ? settled.view : view
  const turn = pending && pending.spread === spread ? pending : null

  useEffect(() => {
    if (settled.spread !== spread) {
      setSettled({ view, spread })
      setTurn(null)
      return
    }
    if (turn || view === shown) return
    if (reduced) setSettled({ view, spread })
    else setTurn({ from: shown, to: view, spread })
  }, [view, shown, turn, reduced, spread, settled.spread])

  // The page turn. The leaf is one sheet of paper with a page printed on each
  // side. On a spread it hinges on the spine: going forward it swings from the
  // right page over to the left (0 to -180 degrees), going back it swings from
  // the left over to the right. On a phone there's no spine to land on, so the
  // page swings away to the left going forward and swings in from the left
  // going back. Only transform moves, so it stays smooth.
  useLayoutEffect(() => {
    const leaf = leafRef.current
    if (!turn || !leaf) return
    const forward = turn.to > turn.from
    const keyframes = spread
      ? forward
        ? ['rotateY(0deg)', 'rotateY(-180deg)']
        : ['rotateY(0deg)', 'rotateY(180deg)']
      : forward
        ? ['rotateY(0deg)', 'rotateY(-180deg)']
        : ['rotateY(-180deg)', 'rotateY(0deg)']
    const animation = leaf.animate(
      keyframes.map((transform) => ({ transform })),
      { duration: TURN_MS, easing: EASE, fill: 'forwards' },
    )
    animation.onfinish = () => {
      setSettled({ view: turn.to, spread: turn.spread })
      setTurn(null)
    }
    return () => animation.cancel()
  }, [turn, spread])

  // When a page lands, focus may have gone with the old one: Open passport,
  // Back to the front and any slot on the page that left all unmount. If it
  // dropped to the body, put it on the first page now showing, so the next
  // Tab carries on from here instead of from the top of the screen. A layout
  // effect, so focus moves in the same frame the page lands.
  useLayoutEffect(() => {
    const before = lastShown.current
    lastShown.current = settled
    if (before.view === settled.view || before.spread !== settled.spread) return
    const active = document.activeElement
    if (active && active !== document.body) return
    const page = bookRef.current?.querySelector<HTMLElement>(':scope > .book__slot > .book__sheet > *')
    if (!page) return
    page.tabIndex = -1
    page.focus({ preventScroll: true })
  }, [settled])

  // Closed at the front, the cover sits on the right; closed at the back, the
  // back cover sits on the left. Book.css slides the book to centre either.
  const target = turn ? turn.to : shown
  const closedFront = spread && target === 0
  const closedBack = spread && target === viewCount(spread) - 1
  const className = `book${spread ? ' book--spread' : ' book--single'}${closedFront ? ' is-closed' : ''}${closedBack ? ' is-closed-back' : ''}${turn ? ' is-turning' : ''}`

  // The sizer: every page, stacked invisibly in one grid cell, so the book is
  // always as tall as its tallest page. Without it a phone book jumps from
  // the cover's height to the data page's height the moment you open it.
  const sizer = (
    <div className="book__sizer" aria-hidden="true" inert>
      {ALL_PAGES.map((page) => (
        <div key={page} className="book__sizer-page">
          {render(page, true)}
        </div>
      ))}
    </div>
  )

  if (!turn) {
    const pages = pagesInView(shown, spread)
    return (
      <div ref={bookRef} className={className}>
        {sizer}
        {pages.map((page, i) => (
          <div key={i} className={`book__slot book__slot--${slotSide(i, spread)}`}>
            {page === null ? null : (
              <div key={page} className="book__sheet">
                {render(page, false)}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Mid-turn, work out what's underneath and what's printed on each side of
  // the moving leaf. See the comment on the animation above for the geometry.
  const forward = turn.to > turn.from
  const from = pagesInView(turn.from, spread)
  const to = pagesInView(turn.to, spread)
  let base: (number | null)[]
  let front: number | null
  let back: number | null
  let side: 'left' | 'right' | 'single'
  if (spread) {
    base = forward ? [from[0], to[1]] : [to[0], from[1]]
    front = forward ? from[1] : from[0]
    back = forward ? to[0] : to[1]
    side = forward ? 'right' : 'left'
  } else {
    base = forward ? [to[0]] : [from[0]]
    front = forward ? from[0] : to[0]
    back = null
    side = 'single'
  }

  return (
    <div ref={bookRef} className={className}>
      {sizer}
      {base.map((page, i) => (
        <div key={i} className={`book__slot book__slot--${slotSide(i, spread)}`}>
          {page === null ? null : (
            <div key={page} className="book__sheet">
              {render(page, true)}
            </div>
          )}
        </div>
      ))}
      <div ref={leafRef} className={`book__leaf book__leaf--${side}${!spread && !forward ? ' is-incoming' : ''}`} aria-hidden="true" inert>
        <div className="book__face book__face--front">{front === null ? null : render(front, true)}</div>
        {back !== null && <div className="book__face book__face--back">{render(back, true)}</div>}
      </div>
    </div>
  )
}

function slotSide(index: number, spread: boolean): string {
  if (!spread) return 'single'
  return index === 0 ? 'left' : 'right'
}
