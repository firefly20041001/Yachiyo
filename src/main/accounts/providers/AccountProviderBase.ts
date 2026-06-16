import { AccountProvider, AccountInfo, LoginQRCode, LoginResult, AccountProviderInterface } from '@shared/types/accounts'
import { accountDB } from '../../database'

export abstract class AccountProviderBase implements AccountProviderInterface {
  abstract provider: AccountProvider

  // Default implementations - subclasses can override
  async generateQRCode(): Promise<LoginQRCode> {
    throw new Error('QR code login not supported for this provider')
  }

  async checkQRCodeStatus(_unikey: string): Promise<LoginResult> {
    return { success: false, error: 'Not supported' }
  }

  abstract getAccountInfo(cookie: string): Promise<AccountInfo | null>
  abstract validateCookie(cookie: string): Promise<boolean>

  saveCookie(cookie: string): void {
    const existing = accountDB.get(this.provider) || { cookie: '' }
    accountDB.set(this.provider, {
      ...existing,
      cookie,
      updatedAt: Date.now()
    })
    console.log(`[${this.provider}] Cookie saved, length: ${cookie.length}`)
  }

  getCookie(): string | null {
    const record = accountDB.get(this.provider)
    const cookie = record?.cookie ?? null
    console.log(`[${this.provider}] getCookie:`, cookie ? `found (${cookie.length} chars)` : 'null')
    return cookie
  }

  saveAccountInfo(info: AccountInfo): void {
    const existing = accountDB.get(this.provider) || { cookie: '' }
    accountDB.set(this.provider, {
      ...existing,
      cookie: existing.cookie,
      userId: info.userId,
      displayName: info.displayName,
      avatarUrl: info.avatarUrl,
      lastLoginAt: info.lastLoginAt || Date.now(),
      updatedAt: Date.now()
    })
    console.log(`[${this.provider}] Account info saved:`, info.displayName)
  }

  getStoredAccountInfo(): AccountInfo | null {
    const record = accountDB.get(this.provider)
    if (!record?.userId) return null

    return {
      provider: this.provider,
      userId: record.userId,
      displayName: record.displayName || '',
      avatarUrl: record.avatarUrl,
      isLoggedIn: true,
      lastLoginAt: record.lastLoginAt
    }
  }

  clearAccount(): void {
    accountDB.delete(this.provider)
    console.log(`[${this.provider}] Account cleared`)
  }
}
