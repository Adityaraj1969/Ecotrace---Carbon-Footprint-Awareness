import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE_PATH is set automatically by the GitHub Actions workflow.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',

  // EFFICIENCY: Manual chunk splitting.
  // Without this, Vite bundles React + Firebase + Recharts + Gemini into a
  // single large JS file. With it, each vendor group becomes a separate cached
  // chunk — the browser only re-downloads a chunk when that library updates,
  // not on every app deploy. Result: dramatically faster repeat visits.
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — changes almost never
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase — large library, infrequent updates
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
          // Recharts — only needed on Dashboard
          'vendor-charts': ['recharts'],
          // Gemini SDK — only needed on Insights
          'vendor-ai': ['@google/generative-ai'],
        },
      },
    },
    // Warn when any individual chunk exceeds 500kb
    chunkSizeWarningLimit: 500,
  },

  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})