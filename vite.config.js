import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE_PATH is set automatically by the GitHub Actions workflow.
// Netlify doesn't need it — leave it unset for Netlify.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
