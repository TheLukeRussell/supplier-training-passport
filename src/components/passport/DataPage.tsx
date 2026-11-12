// The data page: who the passport belongs to, where they stand against the
// line, what it takes to get there, and the machine-readable strip.

import { EXPIRY_DATE, ISSUE_DATE, LINE } from '../../config'
import { givenNames, initials, longDate, ordinal, shortDate, surname } from '../../lib/format'
import { mrzLines } from '../../lib/mrz'
import type { Rep } from '../../lib/model'
import type { StandingRow } from '../../lib/ranking'
import { bestRateOf, cushionOf, percentOf, type Context } from '../../lib/rules'
import { Page } from './Page'
import './DataPage.css'

interface Props {
  rep: Rep
  row: StandingRow
  rankedCount: number
  tied: boolean
  ctx: Context
}

// The one sentence that matters most on this page, plus the line under it.
function lineMessage(row: StandingRow, ctx: Context): { head: string; sub: string } {
  const { stats } = row
  const { toLine, attended, recorded, left } = stats
  if (toLine.kind === 'needs') {
    const reach = percentOf((attended + toLine.n) / (recorded + toLine.n))
    return {
      head: `Attend the next ${toLine.n} to reach the line`,
      sub: toLine.n === 1 ? `One more stamp takes you to ${reach}%.` : `${toLine.n} in a row takes you to ${reach}%.`,
    }
  }
  if (toLine.kind === 'out-of-reach') {
    const best = bestRateOf(attended, recorded, left)
    return {
      head: 'Out of reach this year',
      sub:
        left > 0 && best !== null
          ? `Even all ${left} trainings left only gets you to ${percentOf(best)}%.`
          : 'There are no trainings left this year.',
    }
  }
  const cushion = cushionOf(attended, recorded, left, ctx.line)
  return {
    head: toLine.onLine ? 'Right on the line' : 'Above the line',
    sub:
      cushion === 0
        ? 'Miss the next one and you drop below it.'
        : `You could miss the next ${cushion === 1 ? 'one' : cushion} and still be above it.`,
  }
}

export function DataPage({ rep, row, rankedCount, tied, ctx }: Props) {
  const { stats, rank } = row
  const percent = stats.rate === null ? null : percentOf(stats.rate)
  const message = lineMessage(row, ctx)
  const status = row.above ? 'above' : 'below'
  const [mrz1, mrz2] = mrzLines({
    name: rep.name,
    team: rep.team,
    attended: stats.attended,
    recorded: stats.recorded,
    percent,
    rank,
    issue: ISSUE_DATE,
    expiry: EXPIRY_DATE,
  })

  return (
    <Page kind="data" label="Data page" folio={2}>
      <header className="data__head">
        <h2 className="data__title">Passport</h2>
        <dl className="data__codes">
          <div>
            <dt>Type</dt>
            <dd>P</dd>
          </div>
          <div>
            <dt>Code</dt>
            <dd>STP</dd>
          </div>
        </dl>
      </header>

      <div className="data__bio">
        {/* Where the photo would go. Initials only, no pictures in this demo. */}
        <div className="data__photo" aria-hidden="true">
          {initials(rep.name)}
        </div>
        <dl className="data__fields">
          <div className="data__field data__field--wide">
            <dt>Surname</dt>
            <dd className="data__name">{surname(rep.name)}</dd>
          </div>
          <div className="data__field data__field--wide">
            <dt>Given names</dt>
            <dd className="data__name">{givenNames(rep.name)}</dd>
          </div>
          <div className="data__field">
            <dt>Team</dt>
            <dd>{rep.team}</dd>
          </div>
          <div className="data__field">
            <dt>Rep ID</dt>
            <dd className="data__id">{rep.id}</dd>
          </div>
          <div className="data__field">
            <dt>Date of issue</dt>
            <dd>{longDate(ISSUE_DATE)}</dd>
          </div>
          <div className="data__field">
            <dt>Date of expiry</dt>
            <dd>{longDate(EXPIRY_DATE)}</dd>
          </div>
        </dl>
      </div>

      <dl className="data__stats">
        <div className="data__stat">
          <dt>Stamps</dt>
          <dd>
            {stats.recorded === 0 ? (
              <span className="data__figure data__figure--word">None yet</span>
            ) : (
              <span className="data__figure">
                {stats.attended}
                <span className="data__of"> of {stats.recorded}</span>
              </span>
            )}
          </dd>
        </div>
        <div className="data__stat">
          <dt>Rate</dt>
          <dd>
            <span className="data__figure">{percent === null ? 'None' : `${percent}%`}</span>
          </dd>
        </div>
        <div className="data__stat">
          <dt>Rank</dt>
          <dd>
            {rank === null ? (
              <span className="data__figure data__figure--word">Not yet</span>
            ) : (
              <span className="data__figure">
                {ordinal(rank)}
                <span className="data__of">
                  {' '}
                  of {rankedCount}
                  {tied ? ', tied' : ''}
                </span>
              </span>
            )}
          </dd>
        </div>
        <div className="data__stat">
          <dt>Next training</dt>
          <dd className="data__next">
            {stats.next ? (
              <>
                <span className="data__next-name">{stats.next.supplier}</span>
                <span>
                  {shortDate(stats.next.date)}
                  {stats.next.date === ctx.today && <span className="tag tag--today data__today">Today</span>}
                </span>
              </>
            ) : (
              <span>None left this year</span>
            )}
          </dd>
        </div>
      </dl>

      <div className={`data__line data__line--${status}`} role="status">
        <p className="data__line-head">{message.head}</p>
        <p className="data__line-sub">{message.sub}</p>
        <p className="data__line-note">The line is {Math.round(LINE * 100)}% for now (placeholder).</p>
      </div>

      {/* Two lines of 44 on a wide page. On a phone the spans run inline and
          break anywhere, so the strip wraps to three lines and stays 16px. */}
      <p className="data__mrz" aria-label={`Machine-readable zone for ${rep.name}`}>
        <span>{mrz1}</span>
        <span>{mrz2}</span>
      </p>
    </Page>
  )
}
