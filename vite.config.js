import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // base:'/airclub/',
  plugins: [react()],
  server: {
    allowedHosts: ['hotdesk-client.aeroclub.ru'],
  }
})
