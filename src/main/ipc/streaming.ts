import { ipcMain } from 'electron'
import { streamingRegistry } from '../streaming/StreamingProviderRegistry'
import { QQMusicStreamingProvider } from '../streaming/providers/QQMusicStreamingProvider'
import { MusicSource, QualityLevel, SearchRequest } from '@shared/types/streaming'

export function registerStreamingIPC(): void {
  ipcMain.handle('streaming:search', async (_event, request: SearchRequest) => {
    const provider = streamingRegistry.getProvider(request.source)
    return provider.search(request)
  })

  ipcMain.handle(
    'streaming:getTrack',
    async (_event, source: MusicSource, id: string) => {
      const provider = streamingRegistry.getProvider(source)
      return provider.getTrack(id)
    }
  )

  ipcMain.handle(
    'streaming:resolvePlayback',
    async (_event, source: MusicSource, id: string, quality: QualityLevel) => {
      const provider = streamingRegistry.getProvider(source)
      return provider.resolvePlayback(id, quality)
    }
  )

  ipcMain.handle(
    'streaming:getPlaylist',
    async (_event, source: MusicSource, id: string) => {
      const provider = streamingRegistry.getProvider(source)
      return provider.getPlaylist(id)
    }
  )

  ipcMain.handle(
    'streaming:getUserPlaylists',
    async (_event, source: MusicSource, userId: string) => {
      const provider = streamingRegistry.getProvider(source)
      return provider.getUserPlaylists(userId)
    }
  )

  ipcMain.handle(
    'streaming:getLikedSongs',
    async (_event, source: MusicSource, userId: string) => {
      const provider = streamingRegistry.getProvider(source)
      return provider.getLikedSongs(userId)
    }
  )

  ipcMain.handle(
    'streaming:getAlbum',
    async (_event, source: MusicSource, id: string) => {
      const provider = streamingRegistry.getProvider(source)
      return provider.getAlbum(id)
    }
  )

  // Get QQ Music toplist (rankings)
  ipcMain.handle('streaming:getToplist', async (_event, topid: number, limit: number) => {
    const provider = streamingRegistry.getProvider('qqmusic') as QQMusicStreamingProvider
    return provider.getToplist(topid, limit)
  })
}
