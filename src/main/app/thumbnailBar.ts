import { BrowserWindow, ipcMain, nativeImage, NativeImage } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

let mainWindowRef: BrowserWindow | null = null
let isPlaying = false
let currentCoverUrl = ''

function loadIcon(name: string): NativeImage {
  const paths = [
    join(__dirname, '../../resources/icons/' + name),
    join(__dirname, '../../../resources/icons/' + name),
    join(process.cwd(), 'resources/icons/' + name)
  ]

  for (const p of paths) {
    if (existsSync(p)) {
      const img = nativeImage.createFromPath(p)
      console.log('[ThumbnailBar]', name, '->', p, 'empty:', img.isEmpty(), 'size:', img.getSize())
      return img
    }
  }

  console.log('[ThumbnailBar]', name, '-> NOT FOUND')
  return nativeImage.createEmpty()
}

function setButtons(win: BrowserWindow) {
  if (process.platform !== 'win32' || !win || win.isDestroyed()) return

  try {
    win.setThumbarButtons([
      { tooltip: '上一首', icon: loadIcon('prev.png'), click: () => mainWindowRef?.webContents.send('tray:prev') },
      { tooltip: isPlaying ? '暂停' : '播放', icon: isPlaying ? loadIcon('pause.png') : loadIcon('play.png'), click: () => mainWindowRef?.webContents.send('tray:togglePlay') },
      { tooltip: '下一首', icon: loadIcon('next.png'), click: () => mainWindowRef?.webContents.send('tray:next') }
    ])

    // Overlay icon
    if (isPlaying && currentCoverUrl) {
      fetch(currentCoverUrl)
        .then(r => Buffer.from(r.arrayBuffer()))
        .then(buf => {
          const icon = nativeImage.createFromBuffer(buf).resize({ width: 16, height: 16 })
          if (!icon.isEmpty()) win.setOverlayIcon(icon, '正在播放')
        })
        .catch(() => win.setOverlayIcon(null, ''))
    } else {
      win.setOverlayIcon(null, '')
    }

    console.log('[ThumbnailBar] Updated, playing:', isPlaying)
  } catch (err) {
    console.log('[ThumbnailBar] Error:', (err as Error).message)
  }
}

export function setupThumbnailBar(win: BrowserWindow): void {
  if (process.platform !== 'win32') return
  mainWindowRef = win

  ipcMain.on('thumbnailbar:updateCover', (_e, coverUrl: string) => {
    currentCoverUrl = coverUrl
    if (mainWindowRef && !mainWindowRef.isDestroyed()) setButtons(mainWindowRef)
  })

  win.once('show', () => setButtons(win))
}

export function updateThumbnailBarState(playing: boolean): void {
  if (process.platform !== 'win32' || !mainWindowRef || mainWindowRef.isDestroyed()) return
  isPlaying = playing
  setButtons(mainWindowRef)
}
