import { defineConfig } from 'vite'
import cesium from 'vite-plugin-cesium'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [cesium()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        reveal: resolve(__dirname, 'reveal.html'),
      },
    },
  },
})


