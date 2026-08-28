import { AccountProvider, AccountInfo, LoginQRCode, LoginResult } from '@shared/types/accounts'
import { AccountProviderBase } from './providers/AccountProviderBase'
import { NeteaseAccountProvider } from './providers/NeteaseAccountProvider'
import { QQMusicAccountProvider } from './providers/QQMusicAccountProvider'

export class AccountService {
  private providers: Map<AccountProvider, AccountProviderBase> = new Map()
  private loginPollingIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.providers.set('netease', new NeteaseAccountProvider())
    this.providers.set('qqmusic', new QQMusicAccountProvider())
  }

  getProvider(name: AccountProvider): AccountProviderBase {
    const provider = this.providers.get(name)
    if (!provider) throw new Error(`Unknown provider: ${name}`)
    return provider
  }

  async getAccountInfo(provider: AccountProvider): Promise<AccountInfo | null> {
    const p = this.getProvider(provider)
    const cookie = p.getCookie()
    if (!cookie) return null
    const info = await p.getAccountInfo(cookie)
    return info
  }

  getStoredAccountInfo(provider: AccountProvider): AccountInfo | null {
    return this.getProvider(provider).getStoredAccountInfo()
  }

  getCookie(provider: AccountProvider): string | null {
    return this.getProvider(provider).getCookie()
  }

  async logout(provider: AccountProvider): Promise<void> {
    this.getProvider(provider).clearAccount()
  }

  async getAllAccounts(): Promise<Record<AccountProvider, AccountInfo | null>> {
    return {
      netease: this.getStoredAccountInfo('netease'),
      qqmusic: this.getStoredAccountInfo('qqmusic')
    }
  }

  stopAllPolling(): void {
    for (const [id, interval] of this.loginPollingIntervals) {
      clearInterval(interval)
    }
    this.loginPollingIntervals.clear()
  }
}

export const accountService = new AccountService()
