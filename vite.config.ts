import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import oxlint from 'vite-plugin-oxlint'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    oxlint(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
