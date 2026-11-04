import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // 业务域名由 config/domain.json + scripts/set-domain.mjs 统一下发
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:3000'
  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': { target: apiBase, changeOrigin: true },
        '/uploads': { target: apiBase, changeOrigin: true }
      }
    },
    build: { outDir: 'dist', chunkSizeWarningLimit: 1500 }
  }
})
