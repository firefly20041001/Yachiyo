import { Tray, Menu, nativeImage, app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

let tray: Tray | null = null
let currentTrackName = '未播放'
let currentArtist = ''

export function updateTrayTrackInfo(trackName: string, artist: string): void {
  currentTrackName = trackName || '未播放'
  currentArtist = artist || ''
  if (tray) updateMenu()
}

function updateMenu(): void {
  const displayLabel = currentArtist
    ? `${currentTrackName} - ${currentArtist}`
    : currentTrackName

  const contextMenu = Menu.buildFromTemplate([
    { label: displayLabel, enabled: false },
    { type: 'separator' },
    {
      label: '显示主窗口',
      click: () => {
        const wins = BrowserWindow.getAllWindows()
        const mainWin = wins.find(w => !w.title.includes('Lyrics'))
        if (mainWin) {
          mainWin.show()
          mainWin.focus()
        }
      }
    },
    {
      label: '显示/隐藏悬浮歌词',
      click: () => { ipcMain.emit('tray:toggleLyrics') }
    },
    { type: 'separator' },
    { label: '上一首', click: () => { ipcMain.emit('tray:prev') } },
    { label: '播放/暂停', click: () => { ipcMain.emit('tray:togglePlay') } },
    { label: '下一首', click: () => { ipcMain.emit('tray:next') } },
    { type: 'separator' },
    { label: '退出', click: () => { app.quit() } }
  ])

  tray?.setContextMenu(contextMenu)
}

export function createTray(): Tray {
  const possiblePaths = [
    join(__dirname, '../../resources/icon.png'),
    join(__dirname, '../../../resources/icon.png'),
    join(process.cwd(), 'resources/icon.png'),
    join(process.cwd(), 'icon.png')
  ]

  let iconPath = ''
  for (const p of possiblePaths) {
    if (existsSync(p)) { iconPath = p; break }
  }

  const icon = iconPath ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty()
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('Yachiyo')
  updateMenu()

  tray.on('double-click', () => {
    const wins = BrowserWindow.getAllWindows()
    const mainWin = wins.find(w => !w.title.includes('Lyrics'))
    if (mainWin) { mainWin.show(); mainWin.focus() }
  })

  return tray
}

export function destroyTray(): void {
  if (tray) { tray.destroy(); tray = null }
}
