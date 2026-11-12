// Smoke test setup. Runs locally against the dev server, in the Chrome that's
// already installed (channel "chrome"), once at phone width and once at laptop width.
// `npm run test:iphone` adds a run in WebKit (Safari's engine) as an iPhone 16
// Pro Max, because Safari lays some things out differently than Chrome does.

import { defineConfig, devices } from '@playwright/test'

// PORT=... runs it against a dev server on another port, so two checkouts
// can test at the same time.
const PORT = Number(process.env.PORT) || 5175
const BASE = `http://localhost:${PORT}/supplier-training-passport/`

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'phone-390', use: { channel: 'chrome', viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'desktop-1280', use: { channel: 'chrome', viewport: { width: 1280, height: 800 } } },
    // Opt in with IPHONE=1. Needs `npx playwright install webkit` once.
    ...(process.env.IPHONE ? [{ name: 'phone-iphone-16-pro-max', use: devices['iPhone 16 Pro Max'] }] : []),
  ],
})
