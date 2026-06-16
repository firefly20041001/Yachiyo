export type AccountProvider = 'netease' | 'qqmusic'

export interface AccountInfo {
  provider: AccountProvider
  userId: string
  displayName: string
  avatarUrl?: string
  isLoggedIn: boolean
  lastLoginAt?: number
}

export interface AccountState {
  netease: AccountInfo | null
  qqmusic: AccountInfo | null
}

export interface LoginQRCode {
  provider: AccountProvider
  qrurl: string
  unikey: string
}

export interface LoginResult {
  success: boolean
  cookie?: string
  accountInfo?: AccountInfo
  error?: string
}

export interface AccountProviderInterface {
  provider: AccountProvider
  generateQRCode(): Promise<LoginQRCode>
  checkQRCodeStatus(unikey: string): Promise<LoginResult>
  getAccountInfo(cookie: string): Promise<AccountInfo | null>
  validateCookie(cookie: string): Promise<boolean>
}
