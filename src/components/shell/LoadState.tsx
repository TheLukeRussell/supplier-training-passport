// What the screens show before the data is ready: a skeleton in the shape of
// what's coming, an empty state if the file has no rows, and an error with a
// way to try again.

import { useApp } from '../../state/AppState'
import './LoadState.css'

interface Props {
  screen: 'passport' | 'standings'
}

export function LoadState({ screen }: Props) {
  const { status, error, retry } = useApp()

  if (status === 'error') {
    return (
      <div className="container">
        <section className="state" role="alert" aria-labelledby="state-title">
          <h1 id="state-title" className="state__title">
            Couldn’t load attendance
          </h1>
          <p className="state__text">{error}</p>
          <p className="state__text">Passports and standings need that file. Nothing you changed in the demo is lost.</p>
          <button type="button" className="btn" onClick={retry}>
            Try again
          </button>
        </section>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className="container">
        <section className="state" aria-labelledby="state-title">
          <h1 id="state-title" className="state__title">
            No attendance yet
          </h1>
          <p className="state__text">
            The attendance file loaded, but it has no trainings in it. Once the export has rows, every passport fills in and the board ranks everyone.
          </p>
          <button type="button" className="btn" onClick={retry}>
            Load it again
          </button>
        </section>
      </div>
    )
  }

  // Loading: the outline of whatever screen is on its way.
  return (
    <div className="container" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading attendance data
      </p>
      {screen === 'passport' ? (
        <div className="skeleton skeleton--book" aria-hidden="true">
          <div className="skeleton__page" />
          <div className="skeleton__page skeleton__page--cover" />
        </div>
      ) : (
        <div className="skeleton skeleton--board" aria-hidden="true">
          <div className="skeleton__bar skeleton__bar--title" />
          <div className="skeleton__figures">
            <div className="skeleton__bar" />
            <div className="skeleton__bar" />
            <div className="skeleton__bar" />
          </div>
          <div className="skeleton__panel">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton__row" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
