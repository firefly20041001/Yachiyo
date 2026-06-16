import { LyricsSource, Lyrics, LyricsRequest, LyricsProviderInterface, LyricsLine } from '@shared/types/lyrics'

export abstract class LyricsProvider implements LyricsProviderInterface {
  abstract source: LyricsSource
  abstract getLyrics(request: LyricsRequest): Promise<Lyrics | null>

  protected parseLrc(lrcText: string): LyricsLine[] {
    const lines: LyricsLine[] = []
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g
    let match

    while ((match = regex.exec(lrcText)) !== null) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const ms = parseInt(match[3], 10)
      const time = minutes * 60000 + seconds * 1000 + (match[3].length === 2 ? ms * 10 : ms)
      const text = match[4].trim()

      if (text) {
        lines.push({ time, text })
      }
    }

    return lines.sort((a, b) => a.time - b.time)
  }
}
