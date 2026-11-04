import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

/**
 * 糖果空间 App（uni-app + Vue3 + Vite）
 * - H5 开发态通过 proxy 直连本地 API（默认 3000）
 * - 生产态由 VITE_API_BASE_URL 指向业务域名（scripts/set-domain.mjs 统一同步）
 */
export default defineConfig({
  plugins: [uni()],
  server: {
    port: Number(process.env.VITE_PORT || 8081),
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
