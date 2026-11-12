// The top bar: the logo and program name, the two screens, and the switch
// that opens the demo panel.

import { Link, NavLink, useLocation } from 'react-router'
import { useApp } from '../../state/AppState'
import './TopBar.css'

interface Props {
  demoOpen: boolean
  onToggleDemo: () => void
}

// The logo file is used exactly as supplied. BASE_URL keeps the path right on Pages.
const LOGO = `${import.meta.env.BASE_URL}brand/scansource-logo.svg`

export function TopBar({ demoOpen, onToggleDemo }: Props) {
  const { ready } = useApp()
  const { pathname } = useLocation()
  const passportPath = ready ? `/passport/${ready.viewAs.id}` : '/passport'

  return (
    <header className="topbar">
      <div className="topbar__inner container">
        <Link to={passportPath} className="topbar__home">
          <img src={LOGO} alt="ScanSource" width={142} height={28} className="topbar__logo" />
          <span className="topbar__product">Training Passport 2027</span>
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
    </header>
  )
}
