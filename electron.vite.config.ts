import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

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
    define: {
      // Single source of truth for the version is package.json
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    plugins: [react(), copyLyricsHtml()]
  }
})
