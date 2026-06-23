import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    port: 4173,
    host: true,
  },
  // Em produção, remove console.log/info/debug (ruído) — mantém console.error e
  // console.warn pra debug em prod. Não afeta o dev (que não minifica).
  esbuild: {
    pure: ['console.log', 'console.info', 'console.debug'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
})

