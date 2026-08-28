import { LyricsProvider } from '../LyricsProvider'
import { LyricsSource, Lyrics, LyricsRequest, LyricsLine } from '@shared/types/lyrics'
import { fetchJson } from '../../network/fetch'

const API = 'https://music.163.com'

const neteaseHeaders = (cookie?: string): Record<string, string> => ({
  Referer: 'https://music.163.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ...(cookie ? { Cookie: cookie } : {})
})

export class NeteaseLyricsProvider extends LyricsProvider {
  source: LyricsSource = 'netease'

  async getLyrics(request: LyricsRequest): Promise<Lyrics | null> {
    try {
      let trackId = request.trackId

      // Search for track if no ID (ECHO pattern)
      if (!trackId || trackId === '0') {
        const searchRes = await fetchJson<any>(
          `${API}/api/search/get/web?type=1&s=${encodeURIComponent(request.trackName + ' ' + request.artistName)}&limit=5&offset=0`,
          { headers: neteaseHeaders(), timeout: 8000 }
        )
        const songs = searchRes?.result?.songs
        if (!songs?.length) return null
        trackId = String(songs[0].id)
      }

      // Fetch lyrics (ECHO pattern)
      const res = await fetchJson<any>(
        `${API}/api/song/lyric?id=${trackId}&lv=1&kv=1&tv=1&rv=1`,
        { headers: neteaseHeaders(), timeout: 8000 }
      )

      if (!res?.lrc?.lyric) return null

      const lines = this.parseLrc(res.lrc.lyric)

      // Add translations (ECHO pattern)
      if (res.tlyric?.lyric) {
        const translationLines = this.parseLrc(res.tlyric.lyric)
        for (const line of lines) {
          const transLine = translationLines.find((t) => Math.abs(t.time - line.time) < 100)
          if (transLine) line.translation = transLine.text
        }
      }

      return { source: 'netease', lines, rawLrc: res.lrc.lyric }
    } catch {
      return null
    }
  }
}
