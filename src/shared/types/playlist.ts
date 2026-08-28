import { MusicSource, Track, Playlist } from './streaming'

export type PlaylistSourceType = 'local' | 'import'
export type TrackOrigin = 'import' | 'manual'

export interface SyncedPlaylist {
  id: string
  name: string
  description?: string
  coverUrl?: string
  source: MusicSource
  sourcePlaylistId: string
  sourceType: PlaylistSourceType
  sourceUrl?: string // Original import URL
  tracks: SyncedTrack[]
  lastSyncedAt: number
  createdAt: number
}

export interface SyncedTrack {
  id: string
  track: Track
  origin: TrackOrigin // 'import' from remote source, 'manual' added by user
  matchedTrack?: Track
  matchConfidence: number
  addedAt: number
}

export interface PlaylistSyncRequest {
  source: MusicSource
  playlistId: string
  targetSource?: MusicSource
}

export interface PlaylistSyncResult {
  success: boolean
  playlist: SyncedPlaylist
  matchedCount: number
  unmatchedCount: number
  errors: string[]
}

export interface PlaylistRefreshResult {
  added: number
  removed: number
  kept: number // manual tracks kept
  total: number
}

export interface PlaylistServiceInterface {
  create(name: string): Promise<SyncedPlaylist>
  createFromRemote(playlist: Playlist, sourceUrl?: string): Promise<SyncedPlaylist>
  getAll(): Promise<SyncedPlaylist[]>
  getById(id: string): Promise<SyncedPlaylist | null>
  delete(id: string): Promise<void>
  syncPlaylist(request: PlaylistSyncRequest): Promise<PlaylistSyncResult>
  refreshPlaylist(playlistId: string): Promise<PlaylistRefreshResult>
  addTrack(playlistId: string, track: Track): Promise<void>
  removeTrack(playlistId: string, trackId: string): Promise<void>
}
