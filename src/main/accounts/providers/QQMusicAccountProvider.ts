import { AccountProviderBase } from './AccountProviderBase'
import { AccountInfo, AccountProvider } from '@shared/types/accounts'
import { fetchJson, computeGTK } from '../../network/fetch'

export class QQMusicAccountProvider extends AccountProviderBase {
  provider: AccountProvider = 'qqmusic'

  private extractUin(cookie: string): string {
    for (const name of ['uin', 'qqmusic_uin', 'p_uin', 'pt2gguin', 'loginUin', 'wxuin']) {
      const match = cookie.match(new RegExp(`${name}=o?(\\d+)`, 'i'))
      if (match) return match[1]
    }
    return ''
  }

  private extractSessionKey(cookie: string): string {
    for (const name of ['qqmusic_key', 'qm_keyst', 'music_key', 'p_skey', 'skey']) {
      const match = cookie.match(new RegExp(`${name}=([^;]+)`))
      if (match) return match[1]
    }
    return ''
  }

  async getAccountInfo(cookie: string): Promise<AccountInfo | null> {
    try {
      const uin = this.extractUin(cookie)
      if (!uin) return null

      const sessionKey = this.extractSessionKey(cookie)
      const gtk = sessionKey ? computeGTK(sessionKey) : 5381

      console.log('[QQMusic] getAccountInfo - uin:', uin, 'gtk:', gtk)

      // Try GetLoginUserInfo (ECHO pattern)
      const res = await fetchJson<any>('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        method: 'POST',
        headers: {
          Cookie: cookie,
          Referer: 'https://y.qq.com/',
          Origin: 'https://y.qq.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: {
          comm: {
            uin: `o${uin}`,
            format: 'json',
            ct: 24,
            cv: 4747474,
            platform: 'yqq.json',
            chid: '0',
            g_tk: gtk,
            g_tk_new_20200303: gtk,
            inCharset: 'utf-8',
            outCharset: 'utf-8',
            notice: 0,
            needNewCode: 1
          },
          req_0: {
            module: 'music.UserInfo.userInfoServer',
            method: 'GetLoginUserInfo',
            param: {}
          }
        },
        timeout: 10000
      })

      console.log('[QQMusic] GetLoginUserInfo response:', JSON.stringify(res?.req_0?.data).substring(0, 300))

      // ECHO pattern: response is req_0.data.info
      const data = res?.req_0?.data || {}
      const info = data.info || data.userInfo || data

      // Extract nickname and avatar
      const nick = info.nick || info.nickname || info.name || ''
      const headurl = info.logo || info.headurl || info.avatar || info.pic || ''

      console.log('[QQMusic] extracted nick:', nick, 'headurl:', headurl)

      if (nick || headurl) {
        return {
          provider: 'qqmusic',
          userId: uin,
          displayName: nick || `QQ${uin}`,
          avatarUrl: headurl,
          isLoggedIn: true,
          lastLoginAt: Date.now()
        }
      }

      // Fallback: try another API
      try {
        const res2 = await fetchJson<any>(`https://c.y.qq.com/rsc/fcgi-bin/fcg_get_profile.fcg?loginUin=${uin}&hostUin=${uin}&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`, {
          headers: {
            Cookie: cookie,
            Referer: 'https://y.qq.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        })

        console.log('[QQMusic] profile response:', JSON.stringify(res2?.data).substring(0, 200))

        const profile = res2?.data
        if (profile) {
          return {
            provider: 'qqmusic',
            userId: uin,
            displayName: profile.nickname || profile.nick || `QQ${uin}`,
            avatarUrl: profile.headurl || profile.avatar || profile.logo || '',
            isLoggedIn: true,
            lastLoginAt: Date.now()
          }
        }
      } catch (e) {
        console.log('[QQMusic] profile API error:', e)
      }

      // Final fallback
      return {
        provider: 'qqmusic',
        userId: uin,
        displayName: `QQ${uin}`,
        avatarUrl: '',
        isLoggedIn: true,
        lastLoginAt: Date.now()
      }
    } catch (err) {
      console.error('[QQMusic] getAccountInfo error:', err)
      const uin = this.extractUin(cookie)
      if (uin) {
        return {
          provider: 'qqmusic',
          userId: uin,
          displayName: `QQ${uin}`,
          avatarUrl: '',
          isLoggedIn: true,
          lastLoginAt: Date.now()
        }
      }
      return null
    }
  }

  async validateCookie(cookie: string): Promise<boolean> {
    return this.extractUin(cookie) !== ''
  }
}
