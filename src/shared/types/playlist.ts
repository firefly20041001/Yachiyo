import { MusicSource, Track, Playlist } from './streaming'

export interface SyncedPlaylist {
  id: string
  name: string
  description?: string
  coverUrl?: string
  source: MusicSource
  sourcePlaylistId: string
  tracks: SyncedTrack[]
  lastSyncedAt: number
  createdAt: number
}

export interface SyncedTrack {
  id: string
  track: Track
  matchedTrack?: Track // Cross-platform matched track
  matchConfidence: number // 0-1
  addedAt: number
}

export interface PlaylistSyncRequest {
  source: MusicSource
  playlistId: string
  targetSource?: MusicSource // If syncing to another platform
}

export interface PlaylistSyncResult {
  success: boolean
  playlist: SyncedPlaylist
  matchedCount: number
  unmatchedCount: number
  errors: string[]
}

export interface PlaylistServiceInterface {
  createFromRemote(playlist: Playlist): Promise<SyncedPlaylist>
  getAll(): Promise<SyncedPlaylist[]>
  getById(id: string): Promise<SyncedPlaylist | null>
  delete(id: string): Promise<void>
  syncPlaylist(request: PlaylistSyncRequest): Promise<PlaylistSyncResult>
  addTrack(playlistId: string, track: Track): Promise<void>
  removeTrack(playlistId: string, trackId: string): Promise<void>
}
