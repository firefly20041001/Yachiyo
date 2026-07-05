import { AccountProvider, AccountInfo } from '../shared/types/accounts'
import {
  MusicSource,
  QualityLevel,
  Track,
  Album,
  Artist,
  Playlist,
  SearchResult,
  SearchRequest,
  PlaybackInfo
} from '../shared/types/streaming'
import { Lyrics, LyricsRequest } from '../shared/types/lyrics'
import { SyncedPlaylist, PlaylistSyncRequest, PlaylistSyncResult } from '../shared/types/playlist'

export interface ElectronAPI {
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }

  tray: {
    onTogglePlay: (callback: () => void) => void
    onNext: (callback: () => void) => void
    onPrev: (callback: () => void) => void
    updateTrack: (trackName: string, artist: string) => void
    updatePlayingState: (isPlaying: boolean) => void
    updateCover: (coverUrl: string) => void
  }

  lyricsWindow: {
    show: () => Promise<void>
    hide: () => Promise<void>
    toggle: () => Promise<void>
    isVisible: () => Promise<boolean>
    getSettings: () => Promise<any>
    setSetting: (key: string, value: any) => Promise<void>
    onUpdate: (callback: (data: { line: string; translation?: string }) => void) => void
    onSettings: (callback: (settings: any) => void) => void
    onSettingsChanged: (callback: (settings: any) => void) => void
    updateLine: (line: string, translation?: string) => void
  }

  settings: {
    get: (key: string, defaultValue?: any) => Promise<any>
    set: (key: string, value: any) => Promise<void>
  }

  shortcuts: {
    get: () => Promise<any>
    set: (config: any) => Promise<void>
    reset: () => Promise<any>
    onTogglePlay: (callback: () => void) => void
    onNext: (callback: () => void) => void
    onPrev: (callback: () => void) => void
    onVolumeUp: (callback: () => void) => void
    onVolumeDown: (callback: () => void) => void
    onToggleLyrics: (callback: () => void) => void
  }

  devices: {
    getAudioOutput: () => Promise<Array<{ deviceId: string; label: string; isDefault: boolean }>>
    getCurrentOutput: () => Promise<string>
    setAudioOutput: (deviceId: string) => Promise<boolean>
    startListening: () => Promise<void>
    onChanged: (callback: () => void) => void
  }

  accounts: {
    openLogin: (provider: AccountProvider) => Promise<boolean>
    getAll: () => Promise<Record<AccountProvider, AccountInfo | null>>
    getInfo: (provider: AccountProvider) => Promise<AccountInfo | null>
    logout: (provider: AccountProvider) => Promise<void>
    closeLogin: () => Promise<void>
  }

  streaming: {
    search: (request: SearchRequest) => Promise<SearchResult>
    getTrack: (source: MusicSource, id: string) => Promise<Track>
    resolvePlayback: (source: MusicSource, id: string, quality: QualityLevel) => Promise<PlaybackInfo>
    getPlaylist: (source: MusicSource, id: string) => Promise<Playlist>
    getUserPlaylists: (source: MusicSource, userId: string) => Promise<Playlist[]>
    getLikedSongs: (source: MusicSource, userId: string) => Promise<Track[]>
    getAlbum: (source: MusicSource, id: string) => Promise<Album>
    getToplist: (topid: number, limit: number) => Promise<Track[]>
    getDailyRecommend: (source: MusicSource) => Promise<Track[]>
  }

  lyrics: {
    getLyrics: (request: LyricsRequest) => Promise<Lyrics | null>
  }

  playlist: {
    getAll: () => Promise<SyncedPlaylist[]>
    getById: (id: string) => Promise<SyncedPlaylist | null>
    createFromRemote: (playlist: Playlist, sourceUrl?: string) => Promise<SyncedPlaylist>
    create: (name: string) => Promise<SyncedPlaylist>
    delete: (id: string) => Promise<void>
    sync: (request: PlaylistSyncRequest) => Promise<PlaylistSyncResult>
    refresh: (id: string) => Promise<{ added: number; removed: number; kept: number; total: number }>
    addTrack: (playlistId: string, track: Track) => Promise<void>
    removeTrack: (playlistId: string, trackId: string) => Promise<void>
  }
}
