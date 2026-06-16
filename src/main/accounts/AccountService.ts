import { AccountProvider, AccountInfo, LoginQRCode, LoginResult } from '@shared/types/accounts'
import { AccountProviderBase } from './providers/AccountProviderBase'
import { NeteaseAccountProvider } from './providers/NeteaseAccountProvider'
import { QQMusicAccountProvider } from './providers/QQMusicAccountProvider'
import { getDatabase } from '../database'

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

  async generateQRCode(provider: AccountProvider): Promise<LoginQRCode> {
    return this.getProvider(provider).generateQRCode()
  }

  async checkQRCodeStatus(provider: AccountProvider, unikey: string): Promise<LoginResult> {
    return this.getProvider(provider).checkQRCodeStatus(unikey)
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
    const netease = this.getStoredAccountInfo('netease')
    const qqmusic = this.getStoredAccountInfo('qqmusic')

    // Validate cookies in background
    if (netease) {
      const p = this.getProvider('netease')
      const cookie = p.getCookie()
      if (cookie && !(await p.validateCookie(cookie))) {
        p.clearAccount()
        // netease is stale
      }
    }

    if (qqmusic) {
      const p = this.getProvider('qqmusic')
      const cookie = p.getCookie()
      if (cookie && !(await p.validateCookie(cookie))) {
        p.clearAccount()
        // qqmusic is stale
      }
    }

    return {
      netease: this.getStoredAccountInfo('netease'),
      qqmusic: this.getStoredAccountInfo('qqmusic')
    }
  }

  // Start polling QR code status
  startQRCodePolling(
    provider: AccountProvider,
    unikey: string,
    callback: (result: LoginResult) => void
  ): void {
    const pollId = `${provider}-${unikey}`

    // Clear existing polling
    this.stopQRCodePolling(pollId)

    const interval = setInterval(async () => {
      try {
        const result = await this.checkQRCodeStatus(provider, unikey)
        callback(result)

        if (result.success || result.error === 'QR code expired') {
          this.stopQRCodePolling(pollId)
        }
      } catch (err) {
        callback({ success: false, error: 'Network error' })
      }
    }, 2000) // Poll every 2 seconds

    this.loginPollingIntervals.set(pollId, interval)
  }

  stopQRCodePolling(pollId: string): void {
    const interval = this.loginPollingIntervals.get(pollId)
    if (interval) {
      clearInterval(interval)
      this.loginPollingIntervals.delete(pollId)
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
