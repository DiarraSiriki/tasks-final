import type { IncomingMessage } from 'node:http'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// Les routes /tasks et /users existent à la fois côté React (pages) et côté API.
// Une navigation navigateur (Accept: text/html) doit donc recevoir l'application,
// tandis que les appels axios (Accept: application/json) partent vers le backend.
function spaBypass(req: IncomingMessage) {
  if (req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // En dev/local : le backend tourne sur localhost:3000.
  // En Docker : VITE_PROXY_TARGET=http://backend:3000.
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  const proxy = {
    '/api': { target: proxyTarget, changeOrigin: true },
    '/tasks': { target: proxyTarget, changeOrigin: true, bypass: spaBypass },
    '/users': { target: proxyTarget, changeOrigin: true, bypass: spaBypass },
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
