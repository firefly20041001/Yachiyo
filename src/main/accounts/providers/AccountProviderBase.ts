import { AccountProvider, AccountInfo, LoginQRCode, LoginResult, AccountProviderInterface } from '@shared/types/accounts'
import { accountDB } from '../../database'

export abstract class AccountProviderBase implements AccountProviderInterface {
  abstract provider: AccountProvider

  async generateQRCode(): Promise<LoginQRCode> {
    throw new Error('QR code login not supported for this provider')
  }

  async checkQRCodeStatus(_unikey: string): Promise<LoginResult> {
    return { success: false, error: 'Not supported' }
  }

  abstract getAccountInfo(cookie: string): Promise<AccountInfo | null>
  abstract validateCookie(cookie: string): Promise<boolean>

  saveCookie(cookie: string): void {
    accountDB.set(this.provider, {
      cookie,
      updatedAt: Date.now()
    })
    console.log(`[${this.provider}] Cookie saved, length: ${cookie.length}`)
  }

  getCookie(): string | null {
    const record = accountDB.get(this.provider)
    return record?.cookie ?? null
  }

  saveAccountInfo(info: AccountInfo): void {
    const existing = accountDB.get(this.provider) || { cookie: '' }
    accountDB.set(this.provider, {
      ...existing,
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
    console.log(`[${this.provider}] getStoredAccountInfo:`, record ? 'found' : 'null')

    if (!record) return null

    // If cookie exists, user is logged in
    if (record.cookie) {
      return {
        provider: this.provider,
        userId: record.userId || '',
        displayName: record.displayName || (this.provider === 'netease' ? '网易云用户' : 'QQ用户'),
        avatarUrl: record.avatarUrl,
        isLoggedIn: true,
        lastLoginAt: record.lastLoginAt
      }
    }

    return null
  }

  clearAccount(): void {
    accountDB.delete(this.provider)
    console.log(`[${this.provider}] Account cleared`)
  }
}
