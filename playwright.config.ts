import { defineConfig } from '@playwright/test'

// Set PW_PORT to run the suite against an isolated dev server, leaving a
// server already running on the default port untouched (e.g. one serving a
// physical test device).
const port = process.env.PW_PORT || '3000'
const origin = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  use: {
    baseURL: origin,
    browserName: 'chromium',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
    video: process.env.PW_VIDEO === '1' ? 'on' : 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: `${origin}/museum/notebook`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NUXT_DEVTOOLS_DISABLED: '1',
      NUXT_BUILD_DIR: process.env.PW_PORT ? '.nuxt-visual' : '.nuxt',
    },
  },
  projects: [
    {
      name: 'desktop-1440x900',
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-390x844',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
})
