// The Passport screen: the book for one rep, the page controls under it, and
// the training detail slip. The page lives in the URL (?page=4), so a link
// can open straight to a visa page. The book can be picked up and tilted too
// (see useTilt.ts).

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { BACK_COVER, DATA_PAGE, pageForView, parsePage, viewCount, viewForPage, viewLabel } from '../../lib/book'
import { findRep, type Training } from '../../lib/model'
import { useApp } from '../../state/AppState'
import { useReducedMotion, useSpread } from '../../state/useMedia'
import { BackCover } from './BackCover'
import { Book } from './Book'
import { Cover } from './Cover'
import { DataPage } from './DataPage'
import { NotesPage } from './NotesPage'
import { PassportPicker } from './PassportPicker'
import { SlotDetail } from './SlotDetail'
import { isPinchZoomed, usePinchZoom } from './usePinchZoom'
import { useTilt } from './useTilt'
import { VisaPage } from './VisaPage'
import './PassportScreen.css'

// How far a finger has to travel sideways before it counts as a swipe.
const SWIPE_PX = 48
// Places where the arrow keys move a text cursor, so they keep them.
const TYPING = 'textarea, [contenteditable="true"], input:not([type="radio"], [type="checkbox"], [type="button"], [type="submit"], [type="reset"])'

export function PassportScreen() {
  const app = useApp()
  const { model, ctx, board, viewAs } = app.ready!
  const { repId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const spread = useSpread()
  const reduced = useReducedMotion()
  const zoomed = usePinchZoom()
  const [detail, setDetail] = useState<Training | null>(null)
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null)
  const swiped = useRef(false)
  const tilt = useTilt(reduced)
  const { ref: tiltRef, onPointerMove: onTiltMove, onLostPointerCapture: onTiltLost } = tilt

  const rep = findRep(model, repId)
  // Stable, so the stamp moment's timer isn't restarted by every re-render.
  const repEmail = rep?.email
  const { landed } = app
  const onLanded = useCallback(() => {
    if (repEmail) landed(repEmail)
  }, [landed, repEmail])
  const page = parsePage(params.get('page'))
  const view = viewForPage(page, spread)
  const last = viewCount(spread) - 1

  const goToView = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(last, next))
      setParams(
        (current) => {
          const out = new URLSearchParams(current)
          const p = pageForView(target, spread)
          if (p === 0) out.delete('page')
          else out.set('page', String(p))
          return out
        },
        { replace: true },
      )
    },
    [last, setParams, spread],
  )

  // Left and right arrow keys turn pages, unless you're typing somewhere or
  // the detail slip is open. On a button, a radio or a select (the demo
  // panel, the passport picker) they still turn pages, and preventDefault
  // stops them from changing the choice or the rep on the way.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (detail || event.altKey || event.metaKey || event.ctrlKey) return
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      const target = event.target as HTMLElement | null
      if (target?.closest(TYPING)) return
      goToView(event.key === 'ArrowRight' ? view + 1 : view - 1)
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail, goToView, view])

  if (!rep) {
    return (
      <div className="container">
        <section className="passport-missing" aria-labelledby="missing-title">
          <h1 id="missing-title" className="passport-missing__title">
            No passport for “{repId}”
          </h1>
          <p>That rep ID isn’t in the attendance data. It may have a typo, or the rep may not be in this export.</p>
          <p>
            <Link to="/standings">Find them on the standings</Link> or <Link to={`/passport/${viewAs.id}`}>open {viewAs.name}’s passport</Link>.
          </p>
        </section>
      </div>
    )
  }

  const row = board.find((r) => r.rep.id === rep.id)!
  const rankedCount = board.filter((r) => r.rank !== null).length
  const landing = app.landing.has(rep.email)

  const render = (p: number, still: boolean) => {
    if (p === 0) return <Cover rep={rep} still={still} onOpen={() => goToView(viewForPage(DATA_PAGE, spread))} />
    if (p === 1) return <NotesPage />
    if (p === BACK_COVER) return <BackCover rep={rep} still={still} onFront={() => goToView(0)} />
    if (p === 2) return <DataPage rep={rep} row={row} rankedCount={rankedCount} ctx={ctx} />
    return (
      <VisaPage
        page={p}
        model={model}
        rep={rep}
        ctx={ctx}
        stats={row.stats}
        landing={landing}
        onLanded={onLanded}
        onOpen={setDetail}
        still={still}
      />
    )
  }

  // The click a swipe or a tilt leaves behind arrives right away. Swallow it
  // so a slot doesn't open, and if none comes, forget about it so the next
  // real tap still works.
  const swallowClick = () => {
    swiped.current = true
    window.setTimeout(() => (swiped.current = false), 350)
  }

  // Swipes: track one pointer, and on release decide if it was a sideways
  // drag. The same pointer can pick the book up and tilt it (useTilt), and a
  // tilt is never a swipe.
  const onPointerDown = (event: PointerEvent) => {
    swiped.current = false
    tilt.onPointerDown(event)
    if (event.pointerType === 'mouse') return
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (tilt.onPointerUp(event)) {
      swallowClick()
      return
    }
    if (!start || start.id !== event.pointerId) return
    // Pinched in, a sideways drag is someone panning across a stamp.
    if (isPinchZoomed()) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return
    swallowClick()
    goToView(dx < 0 ? view + 1 : view - 1)
  }

  return (
    <div className={`passport container${spread && (view === 0 || view === last) ? ' is-closed' : ''}${zoomed ? ' is-zoomed' : ''}`}>
      <h1 className="visually-hidden">{rep.name}’s passport</h1>
      <PassportPicker model={model} rep={rep} page={page} />
      <div
        ref={tiltRef}
        className="passport__stage"
        onPointerDown={onPointerDown}
        onPointerMove={onTiltMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(event) => {
          swipe.current = null
          tilt.onPointerCancel(event)
        }}
        onLostPointerCapture={onTiltLost}
        onClickCapture={(event) => {
          if (swiped.current) {
            event.preventDefault()
            event.stopPropagation()
            swiped.current = false
          }
        }}
      >
        <Book view={view} spread={spread} reduced={reduced} render={render} />
      </div>

      {/* At either end the button stays focusable (aria-disabled, not
          disabled), so keyboard focus doesn't fall off the page. */}
      <nav className="passport__controls" aria-label="Pages">
        <button
          type="button"
          className="passport__turn"
          onClick={() => view > 0 && goToView(view - 1)}
          aria-disabled={view === 0 || undefined}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <p className="passport__where" aria-live="polite">
          {viewLabel(view, spread)}
        </p>
        <button
          type="button"
          className="passport__turn"
          onClick={() => view < last && goToView(view + 1)}
          aria-disabled={view === last || undefined}
          aria-label="Next page"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </nav>

      <SlotDetail training={detail} model={model} rep={rep} ctx={ctx} onClose={() => setDetail(null)} />
    </div>
  )
}
