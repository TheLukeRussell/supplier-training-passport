// The Standings screen: three figures, the podium, and the full board with
// the President's Club line drawn across it. Team filter and name search
// live in the URL (#/standings?team=west&q=kai) so a filtered view can be shared.

import { useSearchParams } from 'react-router'
import { TEAMS } from '../../config'
import { figuresFor } from '../../lib/ranking'
import { useApp } from '../../state/AppState'
import { Board } from './Board'
import { Figures } from './Figures'
import { Podium } from './Podium'
import './StandingsScreen.css'

export function StandingsScreen() {
  const app = useApp()
  const { model, ctx, board, viewAs } = app.ready!
  const [params, setParams] = useSearchParams()

  const teamParam = (params.get('team') ?? '').toLowerCase()
  const team = TEAMS.find((t) => t.toLowerCase() === teamParam) ?? null
  const query = params.get('q') ?? ''
  const needle = query.trim().toLowerCase()

  const update = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const out = new URLSearchParams(current)
        if (value) out.set(key, value)
        else out.delete(key)
        return out
      },
      { replace: true },
    )

  // The figures follow the team filter. Search only narrows the board.
  const teamRows = team ? board.filter((row) => row.rep.team === team) : board
  const rows = needle ? teamRows.filter((row) => row.rep.name.toLowerCase().includes(needle)) : teamRows
  const figures = figuresFor(teamRows, model, ctx)
  const scope = team ? `${team} reps` : 'reps'

  return (
    <div className="standings container">
      <header className="standings__head">
        <h1 className="standings__title">Standings</h1>
        <span className="accent-bar" aria-hidden="true" />
        <p className="standings__sub">
          Ranked by rate: trainings attended out of trainings invited to. The dashed line on the board is the President's Club line.
        </p>
      </header>

      <Figures figures={figures} scope={scope} />

      <div className="standings__tools">
        <fieldset className="seg">
          <legend>Team</legend>
          <span>
            <input type="radio" name="team" id="team-all" checked={!team} onChange={() => update('team', null)} />
            <label htmlFor="team-all">All teams</label>
          </span>
          {TEAMS.map((t) => (
            <span key={t}>
              <input
                type="radio"
                name="team"
                id={`team-${t.toLowerCase()}`}
                checked={team === t}
                onChange={() => update('team', t.toLowerCase())}
              />
              <label htmlFor={`team-${t.toLowerCase()}`}>{t}</label>
            </span>
          ))}
        </fieldset>
        <div className="field standings__search">
          <label htmlFor="search">Search by name</label>
          <input
            id="search"
            className="input"
            type="search"
            name="q"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => update('q', e.target.value || null)}
          />
        </div>
      </div>

      <section className="scoreboard" aria-label="Scoreboard">
        {!needle && teamRows.some((row) => row.rank !== null) && <Podium rows={teamRows} team={team} />}
        <Board rows={rows} viewAsId={viewAs.id} team={team} query={query} onClear={() => update('q', null)} />
      </section>
    </div>
  )
}
