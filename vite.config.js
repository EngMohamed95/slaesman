import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        // supabase-js is on the boot critical path (session restore), so it
        // cannot be lazy — but it changes far less often than app code. Its own
        // chunk stays in the browser cache across deploys instead of being
        // re-downloaded inside the entry bundle every time a page edits.
        advancedChunks: {
          groups: [
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/ },
          ],
        },
      },
    },
  },
})
