import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: true
    },
    resolve: {
      alias: {
        '@': resolve('src'),
        '@main': resolve('src/main'),
        '@preload': resolve('src/preload'),
        '@renderer': resolve('src/renderer/src')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: true
    },
    resolve: {
      alias: {
        '@': resolve('src'),
        '@main': resolve('src/main'),
        '@preload': resolve('src/preload'),
        '@renderer': resolve('src/renderer/src')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src'),
        '@main': resolve('src/main'),
        '@preload': resolve('src/preload'),
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
