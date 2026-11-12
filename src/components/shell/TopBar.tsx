// The top bar: wordmark, the two screens, the sample data tag and the switch
// that opens the demo panel.

import { Link, NavLink, useLocation } from 'react-router'
import { useApp } from '../../state/AppState'
import './TopBar.css'

interface Props {
  demoOpen: boolean
  onToggleDemo: () => void
}

export function TopBar({ demoOpen, onToggleDemo }: Props) {
  const { ready } = useApp()
  const { pathname } = useLocation()
  const passportPath = ready ? `/passport/${ready.viewAs.id}` : '/passport'

  return (
    <header className="topbar">
      <div className="topbar__inner container">
        <Link to={passportPath} className="topbar__mark" aria-label="Training Passport 2027, your passport">
          Training Passport 2027
        </Link>
        <nav className="topbar__tabs" aria-label="Screens">
          {/* Passport links to whoever you're viewing as, so it counts as
              current on any passport, not just that one URL. */}
          <Link
            to={passportPath}
            className={`topbar__tab${pathname.startsWith('/passport') ? ' is-current' : ''}`}
            aria-current={pathname.startsWith('/passport') ? 'page' : undefined}
          >
            Passport
          </Link>
          <NavLink to="/standings" className={({ isActive }) => `topbar__tab${isActive ? ' is-current' : ''}`}>
            Standings
          </NavLink>
        </nav>
        <div className="topbar__end">
          <span className="topbar__sample">Sample data</span>
          <button
            type="button"
            className="topbar__demo"
            aria-expanded={demoOpen}
            aria-controls="demo-panel"
            onClick={onToggleDemo}
          >
            {demoOpen ? 'Hide demo' : 'Demo'}
          </button>
        </div>
      </div>
    </header>
  )
}
