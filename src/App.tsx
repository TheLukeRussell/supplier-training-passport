// The app shell: top bar, the demo panel, and the two screens. Routes are
// #/passport/<rep-id> and #/standings, with filters in the query string.

import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
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

  return (
    <div className="app">
      <a className="skip" href="#main">
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
