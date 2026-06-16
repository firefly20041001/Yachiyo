import { ipcMain } from 'electron'
import { accountService } from '../accounts/AccountService'
import { loginWindow } from '../accounts/AccountLoginWindow'
import { AccountProvider } from '@shared/types/accounts'

export function registerAccountIPC(): void {
  // Open login window for a provider
  ipcMain.handle('accounts:openLogin', async (_event, provider: AccountProvider) => {
    return new Promise<boolean>((resolve) => {
      loginWindow.openLoginWindow(provider as any, (cookie) => {
        if (cookie) {
          const p = accountService.getProvider(provider)
          p.saveCookie(cookie)
          // Get account info
          p.getAccountInfo(cookie).then((info) => {
            if (info) p.saveAccountInfo(info)
            resolve(true)
          }).catch(() => resolve(false))
        } else {
          resolve(false)
        }
      })
    })
  })

  ipcMain.handle('accounts:getAll', async () => {
    return accountService.getAllAccounts()
  })

  ipcMain.handle('accounts:getInfo', async (_event, provider: AccountProvider) => {
    return accountService.getStoredAccountInfo(provider)
  })

  ipcMain.handle('accounts:logout', async (_event, provider: AccountProvider) => {
    return accountService.logout(provider)
  })

  ipcMain.handle('accounts:closeLogin', async () => {
    loginWindow.close()
  })
}
