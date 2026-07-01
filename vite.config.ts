import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, existsSync, cpSync } from 'node:fs';
import { join } from 'node:path';

import { cloudflare } from "@cloudflare/vite-plugin";

// Dev-only: отдаём базу тестов из верхнеуровневой папки tests/ по пути /tests/*
function serveTestsDir(): Plugin {
  return {
    name: 'serve-tests-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/tests/')) return next();
        const rel = decodeURIComponent(req.url.split('?')[0].replace(/^\/tests\//, ''));
        if (rel.includes('..')) { res.statusCode = 400; return res.end('bad path'); }
        const file = join(process.cwd(), 'tests', rel);
        if (!existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(file));
      });
    },
  };
}

// Build: кладём базу тестов из tests/ в dist/tests/, чтобы сборка была
// самодостаточной (для статик-хостинга — Cloudflare Pages / Netlify и т.п.).
function copyTestsToDist(): Plugin {
  return {
    name: 'copy-tests-to-dist',
    apply: 'build',
    closeBundle() {
      cpSync('tests', 'dist/tests', { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [serveTestsDir(), copyTestsToDist(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Тесты',
      short_name: 'Тесты',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0d6efd',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/tests/'),
          handler: 'NetworkFirst',
          options: { cacheName: 'tests-base', expiration: { maxEntries: 50 } },
        },
      ],
    },
  }), cloudflare()],
});