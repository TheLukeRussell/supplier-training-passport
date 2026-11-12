// The demo-only panel: switch who you're viewing as, record today's
// attendance, reset (with undo), and preview the loading, empty and error
// states. None of this ships in the real version.

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { TEAMS } from '../../config'
import { firstName, shortDate } from '../../lib/format'
import { TURN_MS, pageForTraining, parsePage, viewForPage } from '../../lib/book'
import { useApp, type Preview } from '../../state/AppState'
import { useReducedMotion, useSpread } from '../../state/useMedia'
import './DemoPanel.css'

interface Props {
  open: boolean
  onClose: () => void
}

const PREVIEWS: { value: Preview; label: string }[] = [
  { value: 'live', label: 'Live data' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Error' },
]

export function DemoPanel({ open, onClose }: Props) {
  const app = useApp()
  const reduced = useReducedMotion()
  const spread = useSpread()
  const { ready } = app
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  // True from the click until the turn lands and today actually gets recorded.
  const [turning, setTurning] = useState(false)
  // On a passport, "the current rep" is the one whose passport is open,
  // which may not be the rep in the View as box.
  const passportId = /^\/passport\/([^/]+)/.exec(pathname)?.[1]
  const passportRep = (ready && passportId && ready.model.reps.find((rep) => rep.id === passportId)) || null
  const recordRep = passportRep ?? ready?.viewAs

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onViewAs = (repId: string) => {
    app.setViewAs(repId)
    // On a passport, switching who you are opens your own passport.
    if (pathname.startsWith('/passport')) navigate(`/passport/${repId}?page=2`)
  }

  const onRecord = () => {
    if (turning) return
    const repId = passportRep?.id
    if (!ready?.today || !pathname.startsWith('/passport')) {
      app.record(repId)
      return
    }
    // Recording from a passport turns to the page with today's slot, so you
    // actually see the stamp land. On a phone this panel pushes the book down
    // the screen, so bring the book up first and the turn plays in view.
    const book = document.querySelector('.passport')
    if (book && book.getBoundingClientRect().top > window.innerHeight * 0.4) {
      book.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
    }
    const target = pageForTraining(ready.today)
    const there = viewForPage(parsePage(new URLSearchParams(search).get('page')), spread) === viewForPage(target, spread)
    navigate(`${pathname}?page=${target}`, { replace: true })
    // Record only once the page has turned. Recording first showed the new
    // numbers and today's stamp on the moving paper, then the stamper came
    // down on a slot that was already inked.
    if (there || reduced) {
      app.record(repId)
      return
    }
    setTurning(true)
    window.setTimeout(() => {
      app.record(repId)
      setTurning(false)
    }, TURN_MS + 80)
  }

  return (
    <section id="demo-panel" className="demo" aria-labelledby="demo-title" hidden={!open}>
      <div className="demo__inner container">
        <div className="demo__head">
          <h2 id="demo-title" className="demo__title">
            Demo controls
          </h2>
          <p className="demo__note">Only here for the demo, which runs on made-up sample data. The real passport won’t have this panel.</p>
        </div>

        {ready && (
          <div className="field demo__viewas">
            <label htmlFor="view-as">View as</label>
            <select id="view-as" className="input" value={ready.viewAs.id} onChange={(e) => onViewAs(e.target.value)}>
              {TEAMS.map((team) => (
                <optgroup key={team} label={team}>
                  {ready.model.reps
                    .filter((rep) => rep.team === team)
                    .map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {ready && (
          <div className="demo__record">
            <button type="button" className="btn" onClick={onRecord} disabled={app.recorded || turning || !ready.today}>
              Record today’s attendance
            </button>
            <p className="demo__help" aria-live="polite">
              {app.recorded
                ? `Recorded for ${shortDate(ready.ctx.today)}. Reset to run it again.`
                : ready.today
                  ? `Marks ${firstName(recordRep!.name)} at today’s ${ready.today.supplier} training, plus about two thirds of everyone else invited.`
                  : 'No training lands on the demo date, so there is nothing to record.'}
            </p>
          </div>
        )}

        <div className="demo__reset">
          <button type="button" className="btn btn--quiet" onClick={app.reset} disabled={!ready}>
            Reset demo
          </button>
          <p className="demo__help" role="status">
            {app.canUndo ? (
              <>
                Demo reset.{' '}
                <button type="button" className="link-btn" onClick={app.undoReset}>
                  Undo
                </button>
              </>
            ) : null}
          </p>
        </div>

        <fieldset className="seg demo__states">
          <legend>Data states</legend>
          {PREVIEWS.map((p) => (
            <span key={p.value}>
              <input
                type="radio"
                name="preview"
                id={`preview-${p.value}`}
                value={p.value}
                checked={app.preview === p.value}
                onChange={() => app.setPreview(p.value)}
              />
              <label htmlFor={`preview-${p.value}`}>{p.label}</label>
            </span>
          ))}
        </fieldset>

        {!app.storageOk && (
          <p className="demo__warn">This browser is blocking storage, so demo changes last until you reload.</p>
        )}
      </div>
    </section>
  )
}
