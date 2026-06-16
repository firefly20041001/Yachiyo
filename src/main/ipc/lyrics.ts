import { ipcMain } from 'electron'
import { NeteaseLyricsProvider } from '../lyrics/providers/NeteaseLyricsProvider'
import { QQMusicLyricsProvider } from '../lyrics/providers/QQMusicLyricsProvider'
import { LyricsRequest } from '@shared/types/lyrics'

const providers = {
  netease: new NeteaseLyricsProvider(),
  qqmusic: new QQMusicLyricsProvider()
}

export function registerLyricsIPC(): void {
  ipcMain.handle('lyrics:getLyrics', async (_event, request: LyricsRequest) => {
    console.log('[Lyrics] Request:', request.source, request.trackName, request.trackId)

    const provider = providers[request.source]
    if (!provider) {
      console.log('[Lyrics] No provider for:', request.source)
      return null
    }

    // Try primary source first
    let lyrics = await provider.getLyrics(request)
    if (lyrics) {
      console.log('[Lyrics] Got lyrics from', request.source, '- lines:', lyrics.lines.length)
      return lyrics
    }

    // Fallback to other source
    const fallbackSource = request.source === 'netease' ? 'qqmusic' : 'netease'
    const fallbackProvider = providers[fallbackSource]
    console.log('[Lyrics] Trying fallback:', fallbackSource)

    lyrics = await fallbackProvider.getLyrics({ ...request, source: fallbackSource })
    if (lyrics) {
      console.log('[Lyrics] Got lyrics from fallback', fallbackSource, '- lines:', lyrics.lines.length)
    } else {
      console.log('[Lyrics] No lyrics found')
    }

    return lyrics
  })
}
