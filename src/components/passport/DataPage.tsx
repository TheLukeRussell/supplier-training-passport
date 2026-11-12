// The data page: who the passport belongs to, where they stand against the
// line, what it takes to get there, and the machine-readable strip.

import { EXPIRY_DATE, ISSUE_DATE, LINE } from '../../config'
import { givenNames, initials, ordinal, shortDate, stampDate, surname } from '../../lib/format'
import { lineMessage } from '../../lib/messages'
import { mrzLines } from '../../lib/mrz'
import type { Rep } from '../../lib/model'
import type { StandingRow } from '../../lib/ranking'
import { percentOf, type Context } from '../../lib/rules'
import { Page } from './Page'
import './DataPage.css'

interface Props {
  rep: Rep
  row: StandingRow
  rankedCount: number
  tied: boolean
  ctx: Context
}

export function DataPage({ rep, row, rankedCount, tied, ctx }: Props) {
  const { stats, rank } = row
  const percent = stats.rate === null ? null : percentOf(stats.rate)
  const message = lineMessage(stats, ctx)
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
      {/* Everything above the strip, what ICAO calls the visual inspection
          zone. It lays out just like the page body, and it's the box the
          laminate covers, so the film stops short of the strip and the
          page number. */}
      <div className="data__viz">
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

        {/* Names sit beside the photo box like a real bio page. Everything else
            runs the full width underneath so IDs and dates never squeeze. */}
        <div className="data__bio">
          <div className="data__photo" aria-hidden="true">
            {initials(rep.name)}
          </div>
          <dl className="data__names">
            <div className="data__field">
              <dt>Surname</dt>
              <dd className="data__name">{surname(rep.name)}</dd>
            </div>
            <div className="data__field">
              <dt>Given names</dt>
              <dd className="data__name">{givenNames(rep.name)}</dd>
            </div>
          </dl>
        </div>
        <dl className="data__fields">
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
            <dd className="data__date">{stampDate(ISSUE_DATE)}</dd>
          </div>
          <div className="data__field">
            <dt>Date of expiry</dt>
            <dd className="data__date">{stampDate(EXPIRY_DATE)}</dd>
          </div>
        </dl>

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

        {/* The line’s number lives here, with the placeholder note beside it. */}
        <div className={`data__line data__line--${status}`} role="status">
          <p className="data__line-head">{message.head}</p>
          <p className="data__line-sub">{message.sub}</p>
          <p className="data__line-note">The line is {Math.round(LINE * 100)}% for now (placeholder).</p>
        </div>

        {/* The laminate: a clear film printed with fine gold waves that
            only catch the light while the page tilts or turns. Paint only. */}
        <span className="data__laminate" aria-hidden="true">
          <span className="data__light" />
        </span>
      </div>

      {/* Two lines of 44 on a wide page. On a phone the spans run inline and
          break anywhere, so the strip wraps to three lines and stays 16px. */}
      {/* role="img" so screen readers use the label instead of reading out
          88 characters of chevrons. */}
      <p className="data__mrz" role="img" aria-label={`Machine-readable zone for ${rep.name}`}>
        <span>{mrz1}</span>
        <span>{mrz2}</span>
      </p>
    </Page>
  )
}
