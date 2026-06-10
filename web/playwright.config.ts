import { defineConfig, devices } from '@playwright/test';

const e2eMode = process.env.E2E_MODE === 'docker' ? 'docker' : 'local';
const dockerBaseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: e2eMode !== 'docker',
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    // Select by stable data-test-id hooks, never copy or styling classes.
    testIdAttribute: 'data-test-id',
  },
  projects:
    e2eMode === 'docker'
      ? [
          {
            name: 'docker-chromium',
            use: {
              ...devices['Desktop Chrome'],
              baseURL: dockerBaseURL,
            },
          },
        ]
      : [
          {
            name: 'local-mobile',
            use: {
              ...devices['Pixel 5'],
              baseURL: 'http://localhost:4173',
              permissions: ['camera'],
              // Fake media so "Allow camera" grants and the scanner UI renders
              // (manual entry lives behind a granted camera).
              launchOptions: {
                args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
              },
            },
          },
        ],
  webServer:
    e2eMode === 'docker'
      ? undefined
      : {
          command: 'npm run build && npm run preview -- --port 4173',
          port: 4173,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
});
