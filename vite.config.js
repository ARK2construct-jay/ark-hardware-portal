import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mockApiPlugin } from './dev/mockApiPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Only active for local UI work with `MOCK_API=1 npm run dev` — never in
    // production builds. Real API development should use `vercel dev`.
    process.env.MOCK_API === '1' && mockApiPlugin(),
  ].filter(Boolean),
  server: {
    proxy: process.env.MOCK_API === '1'
      ? undefined
      : {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
  },
})
