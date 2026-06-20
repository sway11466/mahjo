/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
      manifest: {
        name: 'Mahjo（マージョ）',
        short_name: 'Mahjo',
        description: '役を覚え、点数を数える。麻雀の基礎が身につく個人用の学習Webアプリ。',
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
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
  },
});
