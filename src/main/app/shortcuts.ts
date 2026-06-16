import { globalShortcut, ipcMain } from 'electron'
import { settingsDB } from '../database'

export interface ShortcutConfig {
  togglePlay: string
  next: string
  prev: string
  volumeUp: string
  volumeDown: string
  toggleLyrics: string
}

const DEFAULT_SHORTCUTS: ShortcutConfig = {
  togglePlay: 'CommandOrControl+Alt+P',
  next: 'CommandOrControl+Alt+Right',
  prev: 'CommandOrControl+Alt+Left',
  volumeUp: 'CommandOrControl+Alt+Up',
  volumeDown: 'CommandOrControl+Alt+Down',
  toggleLyrics: 'CommandOrControl+Alt+L'
}

let currentShortcuts: ShortcutConfig = DEFAULT_SHORTCUTS
let sendToRenderer: ((channel: string, ...args: any[]) => void) | null = null

export function getShortcuts(): ShortcutConfig {
  const saved = settingsDB.get('shortcuts', null)
  if (saved) {
    // Merge with defaults to ensure all keys exist
    return { ...DEFAULT_SHORTCUTS, ...saved }
  }
  return { ...DEFAULT_SHORTCUTS }
}

function registerAction(accelerator: string, action: string) {
  if (!accelerator) return
  try {
    const success = globalShortcut.register(accelerator, () => {
      console.log('[Shortcut] Triggered:', action, accelerator)
      sendToRenderer?.(`shortcut:${action}`)
    })
    if (success) {
      console.log('[Shortcut] Registered:', action, accelerator)
    } else {
      console.warn('[Shortcut] Failed to register:', action, accelerator)
    }
  } catch (err) {
    console.error('[Shortcut] Error registering:', action, accelerator, err)
  }
}

export function registerShortcuts(sendFn: (channel: string, ...args: any[]) => void): void {
  sendToRenderer = sendFn
  currentShortcuts = getShortcuts()

  const actionMap: Record<string, string> = {
    togglePlay: 'togglePlay',
    next: 'next',
    prev: 'prev',
    volumeUp: 'volumeUp',
    volumeDown: 'volumeDown',
    toggleLyrics: 'toggleLyrics'
  }

  for (const [key, accelerator] of Object.entries(currentShortcuts)) {
    const action = actionMap[key]
    if (action && accelerator) {
      registerAction(accelerator, action)
    }
  }

  // IPC for settings
  ipcMain.handle('shortcuts:get', () => getShortcuts())
  ipcMain.handle('shortcuts:set', (_event, config: Partial<ShortcutConfig>) => {
    const merged = { ...currentShortcuts, ...config }
    settingsDB.set('shortcuts', merged)
    currentShortcuts = merged
    unregisterShortcuts()
    // Re-register all
    for (const [key, accelerator] of Object.entries(currentShortcuts)) {
      const action = actionMap[key]
      if (action && accelerator) {
        registerAction(accelerator, action)
      }
    }
  })
  ipcMain.handle('shortcuts:reset', () => {
    settingsDB.set('shortcuts', DEFAULT_SHORTCUTS)
    currentShortcuts = { ...DEFAULT_SHORTCUTS }
    unregisterShortcuts()
    for (const [key, accelerator] of Object.entries(currentShortcuts)) {
      const action = actionMap[key]
      if (action && accelerator) {
        registerAction(accelerator, action)
      }
    }
    return DEFAULT_SHORTCUTS
  })
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll()
}
