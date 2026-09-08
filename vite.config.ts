import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const hermesProxy = {
  target: 'http://127.0.0.1:8790',
  changeOrigin: true,
  ws: true,
  headers: { origin: 'http://127.0.0.1:8790' },
  rewrite: (path: string) => path.replace(/^\/hermes-api/, '')
}

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/hermes-api': hermesProxy } },
  preview: { proxy: { '/hermes-api': hermesProxy } }
})
