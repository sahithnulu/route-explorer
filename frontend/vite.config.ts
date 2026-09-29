import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Route Explorer',
        short_name: 'Route Explorer',
        theme_color: '#378ADD',
        icons: []
      }
    })
  ],
})