// Vite setup. The base path matches the GitHub Pages repo name so assets and
// the data file resolve under /supplier-training-passport/ once deployed.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/supplier-training-passport/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
