// The app shell: top bar, the demo panel, and the two screens. Routes are
// #/passport/<rep-id> and #/standings, with filters in the query string.

import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { DemoPanel } from './components/shell/DemoPanel'
import { LoadState } from './components/shell/LoadState'
import { TopBar } from './components/shell/TopBar'
import { PassportScreen } from './components/passport/PassportScreen'
import { StandingsScreen } from './components/standings/StandingsScreen'
import { useApp } from './state/AppState'

export function App() {
  const app = useApp()
  const [demoOpen, setDemoOpen] = useState(false)
  const home = app.ready ? `/passport/${app.ready.viewAs.id}` : '/passport'
  const { pathname } = useLocation()

  // A new screen starts at the top. Opening a passport from far down the
  // board used to leave the page scrolled, with the top bar out of view.
  // Not Standings while rows are about to slide, though: the board scrolls
  // your row into view itself, and this runs after it.
  const slide = useRef(app.slideFrom)
  useEffect(() => {
    slide.current = app.slideFrom
  })
  useEffect(() => {
    if (pathname === '/standings' && slide.current) return
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app">
      {/* The router owns the hash, so the link moves focus itself instead of
          following #main, which the router would read as a page. */}
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Skip to content
      </a>
      <TopBar demoOpen={demoOpen} onToggleDemo={() => setDemoOpen((open) => !open)} />
      <DemoPanel open={demoOpen} onClose={() => setDemoOpen(false)} />
      <main id="main" className="main" tabIndex={-1}>
        <Routes>
          <Route path="/passport/:repId" element={app.ready ? <PassportScreen /> : <LoadState screen="passport" />} />
          <Route path="/standings" element={app.ready ? <StandingsScreen /> : <LoadState screen="standings" />} />
          <Route path="*" element={app.ready ? <Navigate to={home} replace /> : <LoadState screen="passport" />} />
        </Routes>
      </main>
    </div>
  )
}
