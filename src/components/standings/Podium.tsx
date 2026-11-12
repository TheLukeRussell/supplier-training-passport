// The podium: the top three, set apart. Ties keep their shared rank here
// too, so a two-way tie for second shows two 2s, not a 2 and a 3.

import { Link } from 'react-router'
import { DATA_PAGE } from '../../lib/book'
import { ordinal } from '../../lib/format'
import type { StandingRow } from '../../lib/ranking'
import { percentOf } from '../../lib/rules'
import './Podium.css'

interface Props {
  rows: StandingRow[]
  team: string | null
}

// Visual order is 2nd, 1st, 3rd. Reading order stays 1st, 2nd, 3rd.
const PLACES = ['first', 'second', 'third'] as const

// Step height follows each rep's place among the three shown, not the slot:
// place is one plus how many of the three rank strictly better. Two tied for
// second both stand on the second step, and a team's top three ranked 5, 5
// and 14 overall get tall, tall and short.
const HEIGHTS = ['tall', 'mid', 'short'] as const

export function Podium({ rows, team }: Props) {
  const ranked = rows.filter((row) => row.rank !== null)
  const top = ranked.slice(0, 3)
  // If the third spot is tied with people below it, say so instead of
  // pretending the cut was clean.
  const alsoTied = top.length === 3 ? ranked.slice(3).filter((row) => row.rank === top[2].rank).length : 0

  return (
    <div className="podium">
      <h2 className="podium__title">{team ? `${team}'s top three` : 'Top three'}</h2>
      <ol className="podium__steps">
        {top.map((row, i) => {
          const tied = ranked.filter((r) => r.rank === row.rank).length > 1
          return (
            <li key={row.rep.id} className={`podium__step podium__step--${PLACES[i]} podium__step--${HEIGHTS[top.filter((r) => r.rank! < row.rank!).length]}`}>
              <p className="podium__rank">
                <span className="visually-hidden">Rank </span>
                {tied ? 'T' : ''}
                {row.rank}
              </p>
              <Link className="podium__name" to={`/passport/${row.rep.id}?page=${DATA_PAGE}`}>
                {row.rep.name}
              </Link>
              <p className="podium__meta">{row.rep.team}</p>
              <p className="podium__rate">
                {percentOf(row.stats.rate ?? 0)}%
                <span className="podium__stamps">
                  {' '}
                  {row.stats.attended} of {row.stats.recorded}
                </span>
              </p>
            </li>
          )
        })}
      </ol>
      {alsoTied > 0 && (
        <p className="podium__note">
          {alsoTied === 1 ? 'One more rep is' : `${alsoTied} more reps are`} tied at {ordinal(top[2].rank!)}. See the board.
        </p>
      )}
    </div>
  )
}
