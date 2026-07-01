import { ipcMain } from 'electron'
import { accountService } from '../accounts/AccountService'
import { loginWindow } from '../accounts/AccountLoginWindow'
import { AccountProvider } from '@shared/types/accounts'

export function registerAccountIPC(): void {
  // Open login window for a provider
  ipcMain.handle('accounts:openLogin', async (_event, provider: AccountProvider) => {
    return new Promise<boolean>((resolve) => {
      loginWindow.openLoginWindow(provider as any, async (cookie) => {
        if (cookie) {
          const p = accountService.getProvider(provider)
          // Always save the cookie
          p.saveCookie(cookie)

          // Try to get account info, but don't fail if it doesn't work
          try {
            const info = await p.getAccountInfo(cookie)
            if (info) {
              p.saveAccountInfo(info)
            } else {
              // Save minimal info so we know the user is logged in
              p.saveAccountInfo({
                provider,
                userId: '',
                displayName: provider === 'netease' ? '网易云用户' : 'QQ用户',
                isLoggedIn: true,
                lastLoginAt: Date.now()
              })
            }
          } catch {
            // Save minimal info even on error
            p.saveAccountInfo({
              provider,
              userId: '',
              displayName: provider === 'netease' ? '网易云用户' : 'QQ用户',
              isLoggedIn: true,
              lastLoginAt: Date.now()
            })
          }

          resolve(true)
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
