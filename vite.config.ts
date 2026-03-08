import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['192.png', '512.png'],
      manifest: {
        name: 'KlinikMandiri',
        short_name: 'KlinikMandiri',
        description: 'Aplikasi Rekam Medis KlinikMandiri',
        theme_color: '#c8e9d1',
        background_color: '#c8e9d1',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
