export type MusicSource = 'netease' | 'qqmusic'

export type QualityLevel = 'standard' | 'high' | 'lossless' | 'hires'

export interface Track {
  id: string
  source: MusicSource
  name: string
  artists: string[]
  albumName: string
  albumId: string
  albumCoverUrl: string
  duration: number // milliseconds
  quality?: QualityLevel
  vip?: boolean
  // Cross-platform mapping
  mappedTrackId?: string
  mappedSource?: MusicSource
}

export interface Album {
  id: string
  source: MusicSource
  name: string
  artist: string
  coverUrl: string
  tracks: Track[]
  publishTime?: number
}

export interface Artist {
  id: string
  source: MusicSource
  name: string
  avatarUrl?: string
  description?: string
}

export interface Playlist {
  id: string
  source: MusicSource
  name: string
  description?: string
  coverUrl: string
  trackCount: number
  creatorName: string
  creatorId: string
  tracks?: Track[]
  isLocal?: boolean
}

export interface SearchResult {
  tracks: Track[]
  albums: Album[]
  artists: Artist[]
  playlists: Playlist[]
  total: number
  source: MusicSource
}

export interface SearchRequest {
  query: string
  source: MusicSource
  type?: ('track' | 'album' | 'artist' | 'playlist')[]
  limit?: number
  offset?: number
}

export interface PlaybackInfo {
  url: string
  quality: QualityLevel
  format: string
  bitrate: number
  size: number
}

export interface StreamingProviderInterface {
  source: MusicSource
  search(request: SearchRequest): Promise<SearchResult>
  getTrack(id: string): Promise<Track>
  resolvePlayback(id: string, quality: QualityLevel): Promise<PlaybackInfo>
  getPlaylist(id: string): Promise<Playlist>
  getUserPlaylists(userId: string): Promise<Playlist[]>
  getLikedSongs(userId: string): Promise<Track[]>
  getAlbum(id: string): Promise<Album>
  getArtist(id: string): Promise<Artist>
}
