import { LyricsProvider } from '../LyricsProvider'
import { LyricsSource, Lyrics, LyricsRequest, LyricsLine } from '@shared/types/lyrics'
import { fetchText } from '../../network/fetch'

const LEGACY_API = 'https://c.y.qq.com'

const qqHeaders = (cookie?: string): Record<string, string> => ({
  Referer: 'https://y.qq.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ...(cookie ? { Cookie: cookie } : {})
})

// Base64 decode helper (ECHO pattern)
const maybeDecodeBase64 = (str: string): string => {
  if (!str) return ''
  // Check if it looks like base64 (no CJK, no brackets, length divisible by 4)
  if (/[一-鿿　-〿]/.test(str)) return str
  if (str.includes('[') && str.includes(':')) return str
  if (str.length % 4 !== 0) return str
  try {
    return atob(str)
  } catch {
    return str
  }
}

export class QQMusicLyricsProvider extends LyricsProvider {
  source: LyricsSource = 'qqmusic'

  async getLyrics(request: LyricsRequest): Promise<Lyrics | null> {
    try {
      const songmid = request.trackId

      // Fetch lyrics (ECHO pattern: legacy endpoint with nobase64=1)
      const url = `${LEGACY_API}/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${songmid}&pcachetime=${Date.now()}&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&nobase64=1`

      const raw = await fetchText(url, { headers: qqHeaders(), timeout: 8000 })

      let res: any
      try {
        res = JSON.parse(raw.trim().replace(/^[^(]*\((.*)\);?$/s, '$1'))
      } catch {
        res = JSON.parse(raw)
      }

      if (!res?.lyric) return null

      const lyricText = maybeDecodeBase64(res.lyric)
      const lines = this.parseLrc(lyricText)

      // Add translations (ECHO pattern)
      if (res.trans) {
        const transText = maybeDecodeBase64(res.trans)
        const translationLines = this.parseLrc(transText)
        for (const line of lines) {
          const transLine = translationLines.find((t) => Math.abs(t.time - line.time) < 100)
          if (transLine) line.translation = transLine.text
        }
      }

      return { source: 'qqmusic', lines, rawLrc: lyricText }
    } catch {
      return null
    }
  }
}
