import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logosimbolo.png', 'logoletras.png', 'robots.txt'],
      manifest: {
        name: 'ImobIA',
        short_name: 'ImobIA',
        description:
          'Agregador imobiliário inteligente com busca granular e rápida.',
        theme_color: '#10b981',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/logosimbolo.png',
            sizes: '512x499',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logoletras.png',
            sizes: '512x153',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
});
