import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // En dev/local : le backend tourne sur localhost:3000.
  // En Docker : VITE_PROXY_TARGET=http://backend:3000.
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  const proxy = {
    '/api': { target: proxyTarget, changeOrigin: true },
    '/tasks': { target: proxyTarget, changeOrigin: true },
    '/users': { target: proxyTarget, changeOrigin: true },
    '/examples': { target: proxyTarget, changeOrigin: true },
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      proxy,
    },
    preview: {
      port: 5173,
      host: true,
      proxy,
    },
  }
})
