import { defineConfig, devices } from '@playwright/test';

// E2E against the assembled stack (Rails serving the web bundle + API + DB on
// one origin), not the Vite preview. The stack is started externally (docker
// compose, or a locally booted server); this config does NOT manage a webServer.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e-docker',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // E2E selects elements by stable data-test-id hooks, never styling classes.
    testIdAttribute: 'data-test-id',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
