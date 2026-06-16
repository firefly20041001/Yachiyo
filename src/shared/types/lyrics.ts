export type LyricsSource = 'netease' | 'qqmusic'

export interface LyricsLine {
  time: number // milliseconds
  text: string
  translation?: string
}

export interface Lyrics {
  source: LyricsSource
  lines: LyricsLine[]
  rawLrc?: string
}

export interface LyricsRequest {
  trackId: string
  trackName: string
  artistName: string
  source: LyricsSource
}

export interface LyricsProviderInterface {
  source: LyricsSource
  getLyrics(request: LyricsRequest): Promise<Lyrics | null>
}
