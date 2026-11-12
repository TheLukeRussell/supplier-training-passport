// The "Passport of" picker: opens anyone's passport on the page you're on,
// so you can compare two reps' April to June pages. It only changes whose
// passport is open. Who you are (View as, in the demo panel) stays put.

import { useNavigate } from 'react-router'
import { TEAMS } from '../../config'
import type { Model, Rep } from '../../lib/model'
import './PassportPicker.css'

interface Props {
  model: Model
  rep: Rep
  // The page in the URL right now, 0 for the front cover.
  page: number
}

export function PassportPicker({ model, rep, page }: Props) {
  const navigate = useNavigate()

  return (
    <div className="picker">
      <label htmlFor="passport-of" className="picker__label">
        Passport of
      </label>
      {/* The box carries the chevron, since a select can't draw its own. */}
      <span className="picker__box">
        <select
          id="passport-of"
          className="picker__select"
          value={rep.id}
          onChange={(event) => navigate(`/passport/${event.target.value}${page ? `?page=${page}` : ''}`)}
        >
          {TEAMS.map((team) => (
            <optgroup key={team} label={team}>
              {model.reps
                .filter((r) => r.team === team)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </span>
    </div>
  )
}
