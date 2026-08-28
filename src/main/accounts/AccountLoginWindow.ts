import { BrowserWindow, session, app } from 'electron'

interface LoginConfig {
  url: string
  domains: string[]
  requiredCookieNames: string[]
}

const LOGIN_CONFIGS: Record<string, LoginConfig> = {
  netease: {
    url: 'https://music.163.com/',
    domains: ['music.163.com', '.music.163.com', '163.com', '.163.com'],
    requiredCookieNames: ['MUSIC_U']
  },
  qqmusic: {
    url: 'https://y.qq.com/',
    domains: ['y.qq.com', '.y.qq.com', 'qq.com', '.qq.com'],
    requiredCookieNames: ['uin', 'qqmusic_key', 'qm_keyst']
  }
}

export class AccountLoginWindow {
  private window: BrowserWindow | null = null
  private pollTimer: NodeJS.Timeout | null = null
  private collectedCookies: Map<string, string> = new Map()
  private sslHandler: ((event: any, webContents: any, url: any, error: any, cert: any, callback: any) => void) | null = null

  async openLoginWindow(
    provider: 'netease' | 'qqmusic',
    onResult: (cookie: string | null) => void
  ): Promise<void> {
    const config = LOGIN_CONFIGS[provider]
    if (!config) {
      onResult(null)
      return
    }

    this.close()

    // Ignore SSL errors
    this.sslHandler = (_event, _webContents, _url, _error, _cert, callback) => {
      callback(true)
    }
    app.on('certificate-error', this.sslHandler)

    const partition = `persist:yachiyo-account-${provider}`
    this.window = new BrowserWindow({
      width: 1120,
      height: 760,
      title: `登录 ${provider === 'netease' ? '网易云音乐' : 'QQ音乐'}`,
      webPreferences: {
        partition,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        ignoreCertificateErrors: true
      }
    })

    this.window.webContents.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    )

    this.window.loadURL(config.url)

    this.collectedCookies.clear()
    const ses = session.fromPartition(partition)

    const collectCookies = async () => {
      try {
        // Collect cookies from all configured domains
        const allCookies = await ses.cookies.get({})
        for (const cookie of allCookies) {
          this.collectedCookies.set(cookie.name, cookie.value)
        }
      } catch {}
    }

    this.pollTimer = setInterval(collectCookies, 1500)

    this.window.webContents.on('did-navigate', collectCookies)
    this.window.webContents.on('did-navigate-in-page', collectCookies)
    this.window.webContents.on('did-finish-load', collectCookies)

    this.window.on('closed', () => {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
      if (this.sslHandler) {
        app.removeListener('certificate-error', this.sslHandler)
        this.sslHandler = null
      }

      collectCookies().then(() => {
        const hasRequired = config.requiredCookieNames.some((name) =>
          this.collectedCookies.has(name)
        )

        if (hasRequired) {
          const cookieStr = Array.from(this.collectedCookies.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join('; ')
          console.log(`[Login] ${provider} login success, cookies:`, Array.from(this.collectedCookies.keys()))
          onResult(cookieStr)
        } else {
          console.log(`[Login] ${provider} login failed, collected:`, Array.from(this.collectedCookies.keys()))
          onResult(null)
        }

        this.window = null
      })
    })
  }

  close(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    if (this.sslHandler) {
      app.removeListener('certificate-error', this.sslHandler)
      this.sslHandler = null
    }
    if (this.window && !this.window.isDestroyed()) {
      this.window.close()
    }
    this.window = null
  }
}

export const loginWindow = new AccountLoginWindow()
