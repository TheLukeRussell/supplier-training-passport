// Smoke test setup. Runs locally against the dev server, in the Chrome that's
// already installed (channel "chrome"), once at phone width and once at laptop width.

import { defineConfig } from '@playwright/test'

const PORT = 5175
const BASE = `http://localhost:${PORT}/supplier-training-passport/`

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: BASE,
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'phone-390', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 800 } } },
  ],
})
