import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = ['cloudmood-web-production.up.railway.app']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts,
  },
})
