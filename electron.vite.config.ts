import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

// Plugin to copy lyrics.html to output
function copyLyricsHtml(): any {
  return {
    name: 'copy-lyrics-html',
    closeBundle() {
      const src = resolve('src/renderer/lyrics.html')
      const dest = resolve('out/renderer/lyrics.html')
      try {
        copyFileSync(src, dest)
      } catch {}
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react(), copyLyricsHtml()]
  }
})
