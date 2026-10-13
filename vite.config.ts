/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  // 公開サイト（LP・キャラ紹介＝public/ の素 HTML）と分離し、React アプリのエントリは
  // app.html のみ。ルート index.html は持たない（/ は public/index.html＝LP が担う）。
  // 構成の正は docs/design/architecture.md §4・docs/design/screens.md §6。
  build: {
    rollupOptions: {
      input: { app: 'app.html' },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // BGM（.m4a）は precache に入れず、オンにして取得したときだけランタイムキャッシュに残す
      // （既定オフの機能でオフライン初回容量を増やさない。sound.md「BGM の実現方式」・ADR-0004）。
      workbox: {
        // 既定の glob は .webp を含まないため、キャラ画像（表情差分・立ち絵・サムネ）と看板牌が
        // precache されず初回読込後のオフライン動作（architecture.md §1）が成立しない。webp を明示する。
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        // og.png は SNS のリンクプレビュー用（og:image）。ブラウザ側では使わないのでオフライン一覧に入れない。
        globIgnores: ['**/*.m4a', '**/og.png'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.m4a'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bgm',
              expiration: { maxEntries: 8 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Mahjo（マージョ）',
        short_name: 'Mahjo',
        description: '麻雀の役と点数の基礎が、魅力的なキャラクターと一緒に身につく個人用の学習Webアプリ。',
        // インストール起動・リピーターは LP を飛ばしてアプリへ直行（/ 直アクセスのみ LP）。
        // manifest 位置（base 配下）からの相対なので base 移行にも追従する。
        start_url: 'app.html',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        lang: 'ja',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    // e2e/ は Playwright（npm run test:e2e）の担当。Vitest には拾わせない。
    // .claude/ は worktree（リポジトリの丸ごとの写し）の置き場。拾うとテストが重複して何倍にもなる。
    exclude: [...configDefaults.exclude, 'e2e/**', '.claude/**'],
  },
});
