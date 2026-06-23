import { MusicSource, Track, Playlist } from '@shared/types/streaming'
import { SyncedPlaylist, SyncedTrack, PlaylistSyncRequest, PlaylistSyncResult } from '@shared/types/playlist'
import { playlistDB } from '../database'
import { streamingRegistry } from '../streaming/StreamingProviderRegistry'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export class PlaylistService {
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
      tracks: [],
      lastSyncedAt: now,
      createdAt: now
    }

    playlistDB.set(id, record)
    return this.mapRecord(record)
  }

  async createFromRemote(playlist: Playlist): Promise<SyncedPlaylist> {
    const id = generateId()
    const now = Date.now()

    const record = {
      id,
      name: playlist.name,
      description: playlist.description || '',
      coverUrl: playlist.coverUrl,
      source: playlist.source,
      sourcePlaylistId: playlist.id,
      tracks: (playlist.tracks || []).map((track) => ({
        trackId: track.id,
        trackSource: track.source,
        trackName: track.name,
        trackArtists: JSON.stringify(track.artists),
        trackAlbum: track.albumName,
        trackCover: track.albumCoverUrl,
        trackDuration: track.duration,
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
    const records = playlistDB.getAll()
    return records.map((r) => this.mapRecord(r))
  }

  async getById(id: string): Promise<SyncedPlaylist | null> {
    const record = playlistDB.get(id)
    if (!record) return null
    return this.mapRecord(record)
  }

  async delete(id: string): Promise<void> {
    playlistDB.delete(id)
  }

  async syncPlaylist(request: PlaylistSyncRequest): Promise<PlaylistSyncResult> {
    const provider = streamingRegistry.getProvider(request.source)
    const remotePlaylist = await provider.getPlaylist(request.playlistId)

    // Check if we already have this playlist
    const existing = playlistDB.findBySource(request.source, request.playlistId)

    const now = Date.now()
    const tracks = (remotePlaylist.tracks || []).map((track) => ({
      trackId: track.id,
      trackSource: track.source,
      trackName: track.name,
      trackArtists: JSON.stringify(track.artists),
      trackAlbum: track.albumName,
      trackCover: track.albumCoverUrl,
      trackDuration: track.duration,
      matchConfidence: 0,
      addedAt: now
    }))

    if (existing) {
      // Update existing
      playlistDB.set(existing.id, {
        ...existing,
        name: remotePlaylist.name,
        description: remotePlaylist.description || '',
        coverUrl: remotePlaylist.coverUrl,
        tracks,
        lastSyncedAt: now
      })
    } else {
      // Create new
      const id = generateId()
      playlistDB.set(id, {
        id,
        name: remotePlaylist.name,
        description: remotePlaylist.description || '',
        coverUrl: remotePlaylist.coverUrl,
        source: request.source,
        sourcePlaylistId: request.playlistId,
        tracks,
        lastSyncedAt: now,
        createdAt: now
      })
    }

    // Cross-platform matching
    let matchedCount = 0
    let unmatchedCount = 0

    if (request.targetSource && request.targetSource !== request.source) {
      const targetProvider = streamingRegistry.getProvider(request.targetSource)

      for (const track of remotePlaylist.tracks || []) {
        try {
          const searchResult = await targetProvider.search({
            query: `${track.name} ${track.artists.join(' ')}`,
            source: request.targetSource,
            type: ['track'],
            limit: 5
          })

          const bestMatch = this.findBestMatch(track, searchResult.tracks)
          if (bestMatch) {
            matchedCount++
          } else {
            unmatchedCount++
          }
        } catch {
          unmatchedCount++
        }
      }
    }

    const playlistId = existing ? existing.id : playlistDB.findBySource(request.source, request.playlistId)?.id || ''
    const syncedPlaylist = await this.getById(playlistId)

    return {
      success: true,
      playlist: syncedPlaylist!,
      matchedCount,
      unmatchedCount,
      errors: []
    }
  }

  async addTrack(playlistId: string, track: Track): Promise<void> {
    const record = playlistDB.get(playlistId)
    if (!record) {
      console.log('[Playlist] addTrack: playlist not found:', playlistId)
      return
    }

    console.log('[Playlist] addTrack:', track.name, 'to', record.name, 'tracks count:', record.tracks.length)

    // Remove existing entry if present, then add to top
    record.tracks = record.tracks.filter((t) => !(t.trackId === track.id && t.trackSource === track.source))

    record.tracks.unshift({
      trackId: track.id,
      trackSource: track.source,
      trackName: track.name,
      trackArtists: JSON.stringify(track.artists),
      trackAlbum: track.albumName,
      trackCover: track.albumCoverUrl,
      trackDuration: track.duration,
      matchConfidence: 0,
      addedAt: Date.now()
    })

    console.log('[Playlist] addTrack: done, new count:', record.tracks.length)
    playlistDB.set(playlistId, record)
  }

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    const record = playlistDB.get(playlistId)
    if (!record) {
      console.log('[Playlist] removeTrack: playlist not found:', playlistId)
      return
    }

    const beforeCount = record.tracks.length
    console.log('[Playlist] removeTrack: looking for trackId:', trackId, 'in', beforeCount, 'tracks')
    console.log('[Playlist] existing trackIds:', record.tracks.map(t => t.trackId).slice(0, 5))
    record.tracks = record.tracks.filter((t) => t.trackId !== trackId)
    const afterCount = record.tracks.length
    console.log('[Playlist] removeTrack result: before:', beforeCount, 'after:', afterCount)
    playlistDB.set(playlistId, record)
  }

  private findBestMatch(original: Track, candidates: Track[]): Track | null {
    if (!candidates.length) return null

    const originalName = original.name.toLowerCase().trim()
    const originalArtists = original.artists.map((a) => a.toLowerCase().trim()).sort().join(',')

    for (const candidate of candidates) {
      const candidateName = candidate.name.toLowerCase().trim()
      const candidateArtists = candidate.artists.map((a) => a.toLowerCase().trim()).sort().join(',')

      if (candidateName === originalName && candidateArtists === originalArtists) {
        return candidate
      }
    }

    for (const candidate of candidates) {
      const candidateName = candidate.name.toLowerCase().trim()
      if (candidateName.includes(originalName) || originalName.includes(candidateName)) {
        return candidate
      }
    }

    return null
  }

  private mapRecord(record: any): SyncedPlaylist {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      coverUrl: record.coverUrl,
      source: record.source as MusicSource,
      sourcePlaylistId: record.sourcePlaylistId,
      tracks: (record.tracks || []).map((t: any) => ({
        id: `${t.trackId}-${t.trackSource}`,
        track: {
          id: t.trackId,
          source: t.trackSource as MusicSource,
          name: t.trackName,
          artists: JSON.parse(t.trackArtists || '[]'),
          albumName: t.trackAlbum || '',
          albumId: '',
          albumCoverUrl: t.trackCover || '',
          duration: t.trackDuration || 0
        },
        matchedTrack: t.matchedTrackId
          ? {
              id: t.matchedTrackId,
              source: t.matchedTrackSource as MusicSource,
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
