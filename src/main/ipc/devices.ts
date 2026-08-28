import { ipcMain, BrowserWindow } from 'electron'

export function registerDevicesIPC(): void {
  ipcMain.handle('devices:getAudioOutput', async () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return []
    try {
      const devices = await win.webContents.executeJavaScript(`
        navigator.mediaDevices.enumerateDevices().then(d =>
          d.filter(x => x.kind === 'audiooutput').map(x => ({
            deviceId: x.deviceId,
            label: x.label || '未知设备',
            isDefault: x.deviceId === 'default'
          }))
        ).catch(() => [])
      `)
      return devices || []
    } catch { return [] }
  })

  ipcMain.handle('devices:getCurrentOutput', async () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return 'default'
    try {
      return await win.webContents.executeJavaScript(
        `localStorage.getItem('audioOutputDevice') || 'default'`
      ) || 'default'
    } catch { return 'default' }
  })

  ipcMain.handle('devices:setAudioOutput', async (_event, deviceId: string) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return false

    try {
      await win.webContents.executeJavaScript(
        `localStorage.setItem('audioOutputDevice', '${deviceId}')`
      )
      console.log('[Devices] Saved device:', deviceId)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('devices:startListening', async () => {})
}
