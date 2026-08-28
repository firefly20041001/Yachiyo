import { AccountProviderBase } from './AccountProviderBase'
import { AccountInfo, AccountProvider } from '@shared/types/accounts'
import { fetchJson } from '../../network/fetch'

export class NeteaseAccountProvider extends AccountProviderBase {
  provider: AccountProvider = 'netease'

  async getAccountInfo(cookie: string): Promise<AccountInfo | null> {
    try {
      const res = await fetchJson<any>(
        'https://music.163.com/api/nuser/account/get',
        {
          headers: {
            Cookie: cookie,
            Referer: 'https://music.163.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 8000
        }
      )

      if (res?.code === 200 && res?.profile) {
        return {
          provider: 'netease',
          userId: String(res.profile.userId),
          displayName: res.profile.nickname,
          avatarUrl: res.profile.avatarUrl,
          isLoggedIn: true,
          lastLoginAt: Date.now()
        }
      }

      // Fallback: try to extract from cookie
      const musicU = cookie.match(/MUSIC_U=([^;]+)/)
      if (musicU) {
        return {
          provider: 'netease',
          userId: musicU[1].substring(0, 10),
          displayName: '网易云用户',
          avatarUrl: '',
          isLoggedIn: true,
          lastLoginAt: Date.now()
        }
      }

      return null
    } catch {
      // Fallback: check if MUSIC_U cookie exists
      const musicU = cookie.match(/MUSIC_U=([^;]+)/)
      if (musicU) {
        return {
          provider: 'netease',
          userId: musicU[1].substring(0, 10),
          displayName: '网易云用户',
          avatarUrl: '',
          isLoggedIn: true,
          lastLoginAt: Date.now()
        }
      }
      return null
    }
  }

  async validateCookie(cookie: string): Promise<boolean> {
    return /MUSIC_U=([^;]+)/.test(cookie)
  }
}
