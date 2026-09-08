import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.HERMES_KANBAN_PROXY_TARGET || 'http://127.0.0.1:8790'
  const hermesProxy = {
    target,
    changeOrigin: true,
    ws: true,
    headers: { origin: target },
    rewrite: (path: string) => path.replace(/^\/hermes-api/, '')
  }

  return {
    plugins: [react()],
    server: { proxy: { '/hermes-api': hermesProxy } },
    preview: { proxy: { '/hermes-api': hermesProxy } }
  }
})
