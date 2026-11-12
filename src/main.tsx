// Entry point. HashRouter keeps routes after the # so GitHub Pages never
// needs a 404 workaround, and Back and shared links just work.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './styles/app.css'
import { App } from './App'
import { AppProvider } from './state/AppState'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
