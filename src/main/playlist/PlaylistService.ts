import { MusicSource, Track, Playlist } from '@shared/types/streaming'
import { SyncedPlaylist, SyncedTrack, PlaylistSyncRequest, PlaylistSyncResult, PlaylistRefreshResult } from '@shared/types/playlist'
import { playlistDB } from '../database'
import { streamingRegistry } from '../streaming/StreamingProviderRegistry'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export class PlaylistService {
  // Create a local (empty) playlist
  async create(name: string): Promise<SyncedPlaylist> {
    const id = generateId()
    const now = Date.now()

    const record = {
      id,
      name,
      description: '',
      coverUrl: '',
      source: 'local' as any,
      sourcePlaylistId: '',
      sourceType: 'local' as const,
      tracks: [],
      lastSyncedAt: now,
      createdAt: now
    }

    playlistDB.set(id, record)
    return this.mapRecord(record)
  }

  // Create a playlist from a remote source (import)
  async createFromRemote(playlist: Playlist, sourceUrl?: string): Promise<SyncedPlaylist> {
    const id = generateId()
    const now = Date.now()

    const record = {
      id,
      name: playlist.name,
      description: playlist.description || '',
      coverUrl: playlist.coverUrl,
      source: playlist.source,
      sourcePlaylistId: playlist.id,
      sourceType: 'import' as const,
      sourceUrl: sourceUrl || '',
      tracks: (playlist.tracks || []).map((track) => ({
        trackId: track.id,
        trackSource: track.source,
        trackName: track.name,
        trackArtists: JSON.stringify(track.artists),
        trackAlbum: track.albumName,
        trackCover: track.albumCoverUrl,
        trackDuration: track.duration,
        origin: 'import' as const,
        matchConfidence: 0,
        addedAt: now
      })),
      lastSyncedAt: now,
      createdAt: now
    }

    playlistDB.set(id, record)
    return this.mapRecord(record)
  }

  async getAll(): Promise<SyncedPlaylist[]> {
    return playlistDB.getAll().map((r) => this.mapRecord(r))
  }

  async getById(id: string): Promise<SyncedPlaylist | null> {
    const record = playlistDB.get(id)
    if (!record) return null
    return this.mapRecord(record)
  }

  async delete(id: string): Promise<void> {
    playlistDB.delete(id)
  }

  // Refresh an imported playlist
  async refreshPlaylist(playlistId: string): Promise<PlaylistRefreshResult> {
    const record = playlistDB.get(playlistId)
    if (!record || record.sourceType !== 'import') {
      throw new Error('Not an imported playlist')
    }

    const provider = streamingRegistry.getProvider(record.source as MusicSource)
    const remotePlaylist = await provider.getPlaylist(record.sourcePlaylistId)
    const remoteTracks = remotePlaylist.tracks || []

    // Separate existing tracks by origin
    const manualTracks = record.tracks.filter((t) => t.origin === 'manual')
    const importedTracks = record.tracks.filter((t) => t.origin === 'import')

    // Build set of remote track IDs
    const remoteTrackIds = new Set(remoteTracks.map((t) => t.id))

    // Find new tracks (in remote but not in imported)
    const existingImportedIds = new Set(importedTracks.map((t) => t.trackId))
    const newTracks = remoteTracks.filter((t) => !existingImportedIds.has(t.id))

    // Find removed tracks (in imported but not in remote)
    const removedTracks = importedTracks.filter((t) => !remoteTrackIds.has(t.trackId))

    // Build new imported track records
    const now = Date.now()
    const newImportedTracks = remoteTracks.map((track) => ({
      trackId: track.id,
      trackSource: track.source,
      trackName: track.name,
      trackArtists: JSON.stringify(track.artists),
      trackAlbum: track.albumName,
      trackCover: track.albumCoverUrl,
      trackDuration: track.duration,
      origin: 'import' as const,
      matchConfidence: 0,
      addedAt: now
    }))

    // Combine: new imported tracks + manual tracks
    record.tracks = [...newImportedTracks, ...manualTracks]
    record.lastSyncedAt = now

    playlistDB.set(playlistId, record)

    return {
      added: newTracks.length,
      removed: removedTracks.length,
      kept: manualTracks.length,
      total: record.tracks.length
    }
  }

  async addTrack(playlistId: string, track: Track): Promise<void> {
    const record = playlistDB.get(playlistId)
    if (!record) return

    // Remove duplicate if exists
    record.tracks = record.tracks.filter((t) => !(t.trackId === track.id && t.trackSource === track.source))

    // Add to top with origin 'manual'
    record.tracks.unshift({
      trackId: track.id,
      trackSource: track.source,
      trackName: track.name,
      trackArtists: JSON.stringify(track.artists),
      trackAlbum: track.albumName,
      trackCover: track.albumCoverUrl,
      trackDuration: track.duration,
      origin: 'manual',
      matchConfidence: 0,
      addedAt: Date.now()
    })

    playlistDB.set(playlistId, record)
  }

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    const record = playlistDB.get(playlistId)
    if (!record) return

    record.tracks = record.tracks.filter((t) => t.trackId !== trackId)
    playlistDB.set(playlistId, record)
  }

  // Legacy sync method (kept for compatibility)
  async syncPlaylist(request: PlaylistSyncRequest): Promise<PlaylistSyncResult> {
    const provider = streamingRegistry.getProvider(request.source)
    const remotePlaylist = await provider.getPlaylist(request.playlistId)

    const existing = playlistDB.findBySource(request.source, request.playlistId)

    if (existing) {
      await this.refreshPlaylist(existing.id)
      const updated = playlistDB.get(existing.id)!
      return {
        success: true,
        playlist: this.mapRecord(updated),
        matchedCount: 0,
        unmatchedCount: 0,
        errors: []
      }
    }

    const created = await this.createFromRemote(remotePlaylist)
    return {
      success: true,
      playlist: created,
      matchedCount: 0,
      unmatchedCount: 0,
      errors: []
    }
  }

  private mapRecord(record: any): SyncedPlaylist {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      coverUrl: record.coverUrl,
      source: record.source,
      sourcePlaylistId: record.sourcePlaylistId,
      sourceType: record.sourceType || 'local',
      sourceUrl: record.sourceUrl,
      tracks: (record.tracks || []).map((t: any) => ({
        id: `${t.trackId}-${t.trackSource}`,
        track: {
          id: t.trackId,
          source: t.trackSource,
          name: t.trackName,
          artists: JSON.parse(t.trackArtists || '[]'),
          albumName: t.trackAlbum || '',
          albumId: '',
          albumCoverUrl: t.trackCover || '',
          duration: t.trackDuration || 0
        },
        origin: t.origin || 'manual',
        matchedTrack: t.matchedTrackId
          ? {
              id: t.matchedTrackId,
              source: t.matchedTrackSource,
              name: '',
              artists: [],
              albumName: '',
              albumId: '',
              albumCoverUrl: '',
              duration: 0
            }
          : undefined,
        matchConfidence: t.matchConfidence || 0,
        addedAt: t.addedAt
      })),
      lastSyncedAt: record.lastSyncedAt,
      createdAt: record.createdAt
    }
  }
}

export const playlistService = new PlaylistService()
