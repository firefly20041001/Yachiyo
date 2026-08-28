import { BrowserWindow, ipcMain, nativeImage, NativeImage } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

let mainWindowRef: BrowserWindow | null = null
let isPlaying = false
let currentCoverUrl = ''

// Cache icons after first load to avoid disk reads on every play/pause toggle
const iconCache: Record<string, NativeImage> = {}

function loadIcon(name: string): NativeImage {
  if (iconCache[name] && !iconCache[name].isEmpty()) return iconCache[name]

  const paths = [
    join(__dirname, '../../resources/icons/' + name),
    join(__dirname, '../../../resources/icons/' + name),
    join(process.cwd(), 'resources/icons/' + name)
  ]

  for (const p of paths) {
    if (existsSync(p)) {
      const img = nativeImage.createFromPath(p)
      iconCache[name] = img
      return img
    }
  }

  iconCache[name] = nativeImage.createEmpty()
  return iconCache[name]
}

// Cache cover image to avoid re-fetching on every state change
let cachedCoverUrl = ''
let cachedCoverIcon: NativeImage | null = null

function setButtons(win: BrowserWindow) {
  if (process.platform !== 'win32' || !win || win.isDestroyed()) return

  try {
    win.setThumbarButtons([
      { tooltip: '上一首', icon: loadIcon('prev.png'), click: () => mainWindowRef?.webContents.send('tray:prev') },
      { tooltip: isPlaying ? '暂停' : '播放', icon: isPlaying ? loadIcon('pause.png') : loadIcon('play.png'), click: () => mainWindowRef?.webContents.send('tray:togglePlay') },
      { tooltip: '下一首', icon: loadIcon('next.png'), click: () => mainWindowRef?.webContents.send('tray:next') }
    ])

    // Overlay icon (cached)
    if (isPlaying && currentCoverUrl) {
      if (currentCoverUrl === cachedCoverUrl && cachedCoverIcon) {
        win.setOverlayIcon(cachedCoverIcon, '正在播放')
      } else {
        fetch(currentCoverUrl)
          .then(r => r.arrayBuffer())
          .then(buf => {
            const icon = nativeImage.createFromBuffer(buf).resize({ width: 16, height: 16 })
            cachedCoverUrl = currentCoverUrl
            cachedCoverIcon = icon
            if (!icon.isEmpty() && !win.isDestroyed()) win.setOverlayIcon(icon, '正在播放')
          })
          .catch(() => { if (!win.isDestroyed()) win.setOverlayIcon(null, '') })
      }
    } else {
      win.setOverlayIcon(null, '')
    }
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