import { BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { settingsDB } from '../database'

let lyricsWindow: BrowserWindow | null = null
let isCreating = false

export function createLyricsWindow(): BrowserWindow | null {
  if (isCreating) return lyricsWindow
  if (lyricsWindow && !lyricsWindow.isDestroyed()) {
    lyricsWindow.show()
    return lyricsWindow
  }
  isCreating = true

  const settings = getLyricsSettings()
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

  lyricsWindow = new BrowserWindow({
    width: settings.width,
    height: settings.height,
    x: settings.x ?? Math.floor((screenWidth - settings.width) / 2),
    y: settings.y ?? 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: !settings.locked,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  lyricsWindow.setAlwaysOnTop(true, 'screen-saver')
  lyricsWindow.setVisibleOnAllWorkspaces(true)

  if (settings.locked) lyricsWindow.setIgnoreMouseEvents(true)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    lyricsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/lyrics.html')
  } else {
    lyricsWindow.loadFile(join(__dirname, '../renderer/lyrics.html'))
  }

  lyricsWindow.on('moved', () => {
    if (lyricsWindow) {
      const bounds = lyricsWindow.getBounds()
      settingsDB.set('lyrics.x', bounds.x)
      settingsDB.set('lyrics.y', bounds.y)
    }
  })

  lyricsWindow.on('resized', () => {
    if (lyricsWindow) {
      const bounds = lyricsWindow.getBounds()
      settingsDB.set('lyrics.width', bounds.width)
      settingsDB.set('lyrics.height', bounds.height)
    }
  })

  lyricsWindow.on('closed', () => { lyricsWindow = null })

  isCreating = false
  return lyricsWindow
}

export function destroyLyricsWindow(): void {
  if (lyricsWindow && !lyricsWindow.isDestroyed()) lyricsWindow.close()
  lyricsWindow = null
}

export function toggleLyricsWindow(): void {
  console.log('[Lyrics] toggleLyricsWindow called, current:', !!lyricsWindow)
  if (lyricsWindow && !lyricsWindow.isDestroyed()) {
    console.log('[Lyrics] Destroying lyrics window')
    destroyLyricsWindow()
    settingsDB.set('lyrics.enabled', false)
  } else {
    console.log('[Lyrics] Creating lyrics window')
    createLyricsWindow()
    settingsDB.set('lyrics.enabled', true)
  }
  notifySettingsChanged()
}

export function getLyricsWindow(): BrowserWindow | null {
  return lyricsWindow
}

export function updateLyricsWindow(line: string, translation?: string): void {
  if (lyricsWindow && !lyricsWindow.isDestroyed()) {
    lyricsWindow.webContents.send('lyrics:update', { line, translation })
  }
}

function notifySettingsChanged() {
  const settings = getLyricsSettings()
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && !win.getTitle().includes('Lyrics')) {
      win.webContents.send('lyrics-settings:changed', settings)
    }
  }
}

export function getLyricsSettings() {
  return {
    enabled: settingsDB.get('lyrics.enabled', false),
    fontSize: settingsDB.get('lyrics.fontSize', 28),
    fontFamily: settingsDB.get('lyrics.fontFamily', 'PingFang SC'),
    color: settingsDB.get('lyrics.color', '#ffffff'),
    bgColor: settingsDB.get('lyrics.bgColor', 'rgba(0,0,0,0.3)'),
    shadowColor: settingsDB.get('lyrics.shadowColor', 'rgba(0,0,0,0.8)'),
    opacity: settingsDB.get('lyrics.opacity', 0.9),
    width: settingsDB.get('lyrics.width', 800),
    height: settingsDB.get('lyrics.height', 120),
    x: settingsDB.get('lyrics.x', undefined),
    y: settingsDB.get('lyrics.y', undefined),
    translationEnabled: settingsDB.get('lyrics.translationEnabled', true),
    locked: settingsDB.get('lyrics.locked', false),
    bold: settingsDB.get('lyrics.bold', true),
    borderRadius: settingsDB.get('lyrics.borderRadius', 16),
    textShadow: settingsDB.get('lyrics.textShadow', true)
  }
}

export function registerLyricsIPC(): void {
  console.log('[Lyrics] Registering lyrics IPC handlers')
  ipcMain.handle('lyrics-window:show', () => { console.log('[Lyrics] IPC: show'); createLyricsWindow() })
  ipcMain.handle('lyrics-window:hide', () => { console.log('[Lyrics] IPC: hide'); destroyLyricsWindow() })
  ipcMain.handle('lyrics-window:toggle', () => { console.log('[Lyrics] IPC: toggle'); toggleLyricsWindow() })
  ipcMain.handle('lyrics-window:isVisible', () => lyricsWindow && !lyricsWindow.isDestroyed())

  ipcMain.handle('lyrics-settings:get', () => getLyricsSettings())

  ipcMain.handle('lyrics-settings:set', (_event, key: string, value: any) => {
    settingsDB.set(`lyrics.${key}`, value)
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
      lyricsWindow.webContents.send('lyrics:settings', getLyricsSettings())
      if (key === 'locked') {
        lyricsWindow.setIgnoreMouseEvents(value)
        lyricsWindow.setResizable(!value)
      }
      if (key === 'enabled' && !value) {
        destroyLyricsWindow()
      }
    }
    notifySettingsChanged()
  })
}
