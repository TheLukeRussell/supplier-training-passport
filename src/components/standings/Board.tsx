// The full board: every rep ranked, with the President's Club line drawn
// across it like a cut line on a golf leaderboard. When today's attendance
// gets recorded, rows slide from their old spots to their new ones.

import { Fragment, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { LINE } from '../../config'
import { DATA_PAGE } from '../../lib/book'
import { lineIndex, type Change, type StandingRow } from '../../lib/ranking'
import { percentOf } from '../../lib/rules'
import { useApp, type SlideFrom } from '../../state/AppState'
import { useReducedMotion } from '../../state/useMedia'
import './Board.css'

interface Props {
  rows: StandingRow[]
  viewAsId: string
  team: string | null
  query: string
  onClear: () => void
}

const SLIDE_MS = 720
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

function ChangeCell({ change }: { change: Change }) {
  switch (change.kind) {
    case 'up':
    case 'down':
      return (
        <span className={`move move--${change.kind}`}>
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d={change.kind === 'up' ? 'M6 2 11 10H1Z' : 'M6 10 1 2h10Z'} />
          </svg>
          <span className="visually-hidden">{change.kind === 'up' ? 'Up' : 'Down'} </span>
          {change.places}
          <span className="visually-hidden"> since the last training</span>
        </span>
      )
    case 'same':
      return <span className="move move--same">Same</span>
    case 'new':
      return <span className="move move--new">New</span>
    case 'none':
      return <span className="visually-hidden">No change yet</span>
  }
}

export function Board({ rows, viewAsId, team, query, onClear }: Props) {
  const { slideFrom, clearSlide } = useApp()
  const reduced = useReducedMotion()
  const bodyRef = useRef<HTMLTableSectionElement>(null)

  // The row slide, done FLIP style. The board is already drawn in its new
  // order. Work out where each row sat before the recording by laying the
  // old order out again from the top, using each row's real height and the
  // President's Club line at its old place (it moves when someone crosses
  // it). Then jump each row back there with a transform and let it glide
  // home. It plays once per recording, even when React runs the effect twice.
  const played = useRef<SlideFrom | null>(null)
  useLayoutEffect(() => {
    if (!slideFrom || played.current === slideFrom) return
    played.current = slideFrom
    const body = bodyRef.current
    if (!body || reduced) {
      clearSlide()
      return
    }
    // Bring your row to the middle of the screen first, so the slide plays
    // where you can see it. The board runs well below the fold, and on a
    // phone it's three or four screens tall. Everything below is measured
    // after the scroll, so the slide maths still holds.
    const you = body.querySelector<HTMLElement>('.board__row.is-you')
    const youBox = you?.getBoundingClientRect()
    if (you && youBox && (youBox.top < 0 || youBox.bottom > window.innerHeight)) you.scrollIntoView({ block: 'center' })
    const els = Array.from(body.querySelectorAll<HTMLElement>('[data-rep]'))
    const now = new Map(els.map((el) => [el.dataset.rep!, el.getBoundingClientRect()]))
    const cutEl = body.querySelector<HTMLElement>('.board__cut')
    const cutBox = cutEl?.getBoundingClientRect()
    // The space between two neighbouring rows (none in a table, a gap on phones).
    let space = 0
    for (let k = 1; k < els.length; k++) {
      if (els[k - 1].nextElementSibling === els[k]) {
        space = now.get(els[k].dataset.rep!)!.top - now.get(els[k - 1].dataset.rep!)!.bottom
        break
      }
    }
    const before = slideFrom.order.filter((id) => now.has(id))
    const oldCut = before.filter((id) => slideFrom.above.has(id)).length
    let y = Math.min(...[...now.values()].map((box) => box.top), cutBox?.top ?? Infinity)
    const oldTop = new Map<string, number>()
    before.forEach((id, k) => {
      if (cutBox && k === oldCut) y += cutBox.height + space
      oldTop.set(id, y)
      y += now.get(id)!.height + space
    })
    els.forEach((el, index) => {
      const from = oldTop.get(el.dataset.rep!)
      const to = now.get(el.dataset.rep!)!.top
      if (from === undefined || Math.abs(from - to) < 1) return
      el.animate([{ transform: `translateY(${from - to}px)` }, { transform: 'translateY(0)' }], {
        duration: SLIDE_MS,
        easing: EASE_OUT,
        delay: Math.min(index, 15) * 20,
        fill: 'backwards',
      })
    })
    clearSlide()
  }, [slideFrom, reduced, clearSlide])

  if (rows.length === 0) {
    return (
      <div className="board-empty" role="status">
        <p className="board-empty__title">{query ? `Nobody named “${query}”${team ? ` on ${team}` : ''}` : `Nobody on ${team ?? 'the board'} yet`}</p>
        <p className="board-empty__text">
          {query ? 'Check the spelling, or search the whole board instead.' : 'Reps show up here once the export lists them.'}
        </p>
        {query && (
          <button type="button" className="btn board-empty__action" onClick={onClear}>
            Clear search
          </button>
        )}
      </div>
    )
  }

  const cut = lineIndex(rows)
  const cutRow = (
    <tr className="board__cut" role="row">
      <td colSpan={8} role="cell">
        <span className="board__cut-label">
          President’s Club line, {Math.round(LINE * 100)}% (placeholder)
        </span>
      </td>
    </tr>
  )

  return (
    <div className="board-wrap">
      <h2 className="board__title">The board</h2>
      <table className="board" role="table" aria-label={`Standings${team ? ` for ${team}` : ''}, ranked by rate`}>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Rank</th>
            <th scope="col" role="columnheader">Change</th>
            <th scope="col" role="columnheader">Rep</th>
            <th scope="col" role="columnheader">Team</th>
            <th scope="col" role="columnheader">Stamps</th>
            <th scope="col" role="columnheader">Rate</th>
            <th scope="col" role="columnheader">Streak</th>
            <th scope="col" role="columnheader">Status</th>
          </tr>
        </thead>
        <tbody ref={bodyRef} role="rowgroup">
          {rows.map((row, i) => {
            const you = row.rep.id === viewAsId
            const status = row.rank === null ? 'Unranked' : row.above ? 'Above' : 'Below'
            return (
              <Fragment key={row.rep.id}>
                {i === cut && cutRow}
                <tr
                  role="row"
                  data-rep={row.rep.id}
                  className={`board__row${row.rank === null ? ' is-unranked' : row.above ? ' is-above' : ' is-below'}${you ? ' is-you' : ''}`}
                >
                  <td role="cell" className="board__rank">
                    {row.rank === null ? (
                      <>
                        <span aria-hidden="true">NR</span>
                        <span className="visually-hidden">Not ranked</span>
                      </>
                    ) : (
                      <>
                        {row.tied && <span className="visually-hidden">Tied </span>}
                        {row.tied ? 'T' : ''}
                        {row.rank}
                      </>
                    )}
                  </td>
                  <td role="cell" className="board__change" data-label="Change">
                    <ChangeCell change={row.change} />
                  </td>
                  <th role="rowheader" scope="row" className="board__rep">
                    <Link to={`/passport/${row.rep.id}?page=${DATA_PAGE}`} className="board__link">
                      {row.rep.name}
                    </Link>
                    {you && <span className="tag tag--you">You</span>}
                  </th>
                  <td role="cell" className="board__team" data-label="Team">
                    <span className="board__val">{row.rep.team}</span>
                  </td>
                  <td role="cell" className="board__stamps" data-label="Stamps">
                    <span className="board__val">
                      {row.stats.attended} of {row.stats.recorded}
                    </span>
                  </td>
                  <td role="cell" className="board__rate">
                    {row.stats.rate === null ? 'None' : `${percentOf(row.stats.rate)}%`}
                  </td>
                  <td role="cell" className="board__streak" data-label="Streak">
                    <span className="board__val">{row.stats.streak}</span>
                  </td>
                  <td role="cell" className="board__status" data-label="Status">
                    {status}
                  </td>
                </tr>
              </Fragment>
            )
          })}
          {cut === rows.length && cutRow}
        </tbody>
      </table>
    </div>
  )
}
