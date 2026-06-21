import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE_PATH is set automatically by the GitHub Actions workflow.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',

  // EFFICIENCY: Manual chunk splitting using function form.
  // Vite 8 uses rolldown which requires manualChunks as a function, not an object.
  // Each vendor group becomes a separate cached chunk — the browser only
  // re-downloads a chunk when that library updates, not on every app deploy.
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-') ||
              id.includes('node_modules/victory')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/@google/generative-ai')) {
            return 'vendor-ai';
          }
        },
      },
    },
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