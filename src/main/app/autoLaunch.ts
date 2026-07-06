import { app, ipcMain } from 'electron'
import { settingsDB } from '../database'

const SETTINGS_KEY = 'settings.autoLaunch'
const MINIMIZE_KEY = 'settings.launchMinimized'

export function isAutoLaunch(): boolean {
  return process.argv.includes('--startup')
}

export function setupAutoLaunch(): void {
  const enabled = settingsDB.get(SETTINGS_KEY, false)
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
      args: ['--startup']
    })
    console.log('[AutoLaunch] Setup, enabled:', enabled)
  } catch (err) {
    console.error('[AutoLaunch] Setup failed:', err)
  }
}

export function setAutoLaunch(enabled: boolean): void {
  settingsDB.set(SETTINGS_KEY, enabled)
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
      args: ['--startup']
    })
    console.log('[AutoLaunch] Set to:', enabled)
  } catch (err) {
    console.error('[AutoLaunch] Set failed:', err)
  }
}

export function isAutoLaunchEnabled(): boolean {
  try {
    const settings = app.getLoginItemSettings()
    return settings.openAtLogin || false
  } catch {
    return false
  }
}

export function isLaunchMinimized(): boolean {
  return settingsDB.get(MINIMIZE_KEY, false)
}

export function registerAutoLaunchIPC(): void {
  ipcMain.handle('autolaunch:get', () => isAutoLaunchEnabled())
  ipcMain.handle('autolaunch:set', (_event, enabled: boolean) => {
    setAutoLaunch(enabled)
    return true
  })
  ipcMain.handle('autolaunch:getMinimize', () => isLaunchMinimized())
  ipcMain.handle('autolaunch:setMinimize', (_event, enabled: boolean) => {
    settingsDB.set(MINIMIZE_KEY, enabled)
    return true
  })
}
