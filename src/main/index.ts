import { app, BrowserWindow, ipcMain } from 'electron'
import { createMainWindow } from './app/window'
import { createTray, destroyTray, updateTrayTrackInfo } from './app/tray'
import { setupThumbnailBar, updateThumbnailBarState } from './app/thumbnailBar'
import { registerAllIPC } from './ipc'
import { registerLyricsIPC, updateLyricsWindow, toggleLyricsWindow, createLyricsWindow } from './app/lyricsWindow'
import { registerShortcuts, unregisterShortcuts } from './app/shortcuts'
import { setupAutoLaunch, registerAutoLaunchIPC, isAutoLaunch, isLaunchMinimized } from './app/autoLaunch'
import { settingsDB } from './database'

let mainWindow: BrowserWindow | null = null

if (process.platform === 'win32') {
  app.setAppUserModelId('com.yachiyo.app')
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    registerAllIPC()
    registerLyricsIPC()
    setupAutoLaunch()

    ipcMain.on('window:minimize', () => mainWindow?.minimize())
    ipcMain.on('window:maximize', () => {
      if (mainWindow?.isMaximized()) mainWindow?.unmaximize()
      else mainWindow?.maximize()
    })
    ipcMain.on('window:close', () => {
      const closeAction = settingsDB.get('settings.closeAction', 'minimize')
      if (closeAction === 'exit') {
        ;(app as any).isQuitting = true
        app.quit()
      } else {
        mainWindow?.hide()
      }
    })

    ipcMain.on('tray:togglePlay', () => mainWindow?.webContents.send('tray:togglePlay'))
    ipcMain.on('tray:next', () => mainWindow?.webContents.send('tray:next'))
    ipcMain.on('tray:prev', () => mainWindow?.webContents.send('tray:prev'))
    ipcMain.on('tray:toggleLyrics', () => toggleLyricsWindow())
    ipcMain.on('tray:updateTrack', (_e, trackName: string, artist: string) => {
      updateTrayTrackInfo(trackName, artist)
    })
    ipcMain.on('lyrics:updateLine', (_e, line: string, translation?: string) => {
      updateLyricsWindow(line, translation)
    })

    // Update thumbnail bar when playback state changes
    ipcMain.on('playback:stateChanged', (_e, playing: boolean) => {
      updateThumbnailBarState(playing)
    })

    ipcMain.handle('settings:get', (_e, key: string, defaultValue: any) => settingsDB.get(key, defaultValue))
    ipcMain.handle('settings:set', (_e, key: string, value: any) => settingsDB.set(key, value))

    // Auto-launch
    ipcMain.handle('app:setAutoLaunch', (_e, enabled: boolean) => {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: app.getPath('exe')
      })
      return true
    })
    ipcMain.on('window:show', () => {
      if (mainWindow) { mainWindow.show(); mainWindow.focus() }
    })

    mainWindow = createMainWindow()
    createTray()
    setupThumbnailBar(mainWindow)

    // Check if started via Windows auto-start
    const isStartup = process.argv.includes('--startup')
    const minimizeOnStartup = settingsDB.get('settings.minimizeOnStartup', false)

    if (isStartup && minimizeOnStartup) {
      // Started via auto-start with minimize option - hide to tray
      mainWindow.hide()
    }

    // Restore floating lyrics if it was enabled
    const lyricsEnabled = settingsDB.get('lyrics.enabled', false)
    if (lyricsEnabled) {
      createLyricsWindow()
    }

    // Register global shortcuts
    registerShortcuts((channel: string, ...args: any[]) => {
      mainWindow?.webContents.send(channel, ...args)
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow()
      }
    })
  })

  app.on('before-quit', () => {
    ;(app as any).isQuitting = true
    unregisterShortcuts()
    destroyTray()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
