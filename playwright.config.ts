import { defineConfig, devices } from '@playwright/test';

// E2E（Large）。ビルド成果物（vite build → vite preview）に対して実ブラウザで通す。
// 方針・シナリオの正は docs/dev/testing.md §5。
//
// 接続先は E2E_BASE_URL で切り替えられる（例 https://mahjo.academy/preview/）。
// 指定したときはローカルのサーバーを立てず、その URL へ流す（デプロイ後のスモーク用）。
// 末尾の / は必須（テストは baseURL からの相対パスで開く）。
const externalBaseURL = process.env.E2E_BASE_URL;
const localBaseURL = 'http://localhost:4173/';

export default defineConfig({
  testDir: './e2e',
  // OneDrive 配下では並列ワーカーが不安定（vitest と同じ理由）。本数も少ないので直列で十分。
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: externalBaseURL ?? localBaseURL,
    // 失敗したときだけ、後から再生できる記録を残す（Trace Viewer・録画）。
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'npx vite build && npx vite preview --port 4173 --strictPort',
        url: localBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
