import { defineConfig, devices } from '@playwright/test'

const MOCK_API_PORT = 19876

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      // Start the mock API server FIRST so it's ready before Next.js boots.
      // Next.js will use API_URL=http://127.0.0.1:19876 for all server-side fetches.
      command: `MOCK_API_PORT=${MOCK_API_PORT} node e2e/helpers/mock-server.mjs`,
      url: `http://127.0.0.1:${MOCK_API_PORT}/_mock/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command: 'next dev -p 3001',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_E2E: 'true',
        MICROSOFT_JWKS_URL: 'http://localhost:3001/api/auth/test-jwks',
        API_URL: `http://127.0.0.1:${MOCK_API_PORT}`,
        MOCK_API_PORT: String(MOCK_API_PORT),
      },
    },
  ],
})
