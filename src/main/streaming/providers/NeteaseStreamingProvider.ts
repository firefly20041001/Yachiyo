import { createRequire } from 'module'
import { StreamingProvider } from '../StreamingProvider'
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
} from '@shared/types/streaming'
import { fetchJson } from '../../network/fetch'

// Load NetEase API package (ECHO pattern)
const loadFromCjs = createRequire(import.meta.url)
let ncmApi: any = null
try {
  ncmApi = loadFromCjs('@neteasecloudmusicapienhanced/api')
} catch {
  console.warn('NetEase API package not available, using HTTP fallback only')
}

const API = 'https://music.163.com'

const neteaseHeaders = (cookie?: string): Record<string, string> => ({
  Referer: 'https://music.163.com/',
  Origin: 'https://music.163.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  ...(cookie ? { Cookie: cookie } : {})
})

// Quality cascade (ECHO pattern)
const neteaseQualityLevels: Record<string, Array<{ level: string; bitrate: number; encodeType: string }>> = {
  hires: [
    { level: 'jymaster', bitrate: 2000000, encodeType: 'flac' },
    { level: 'sky', bitrate: 1500000, encodeType: 'flac' },
    { level: 'jyeffect', bitrate: 1500000, encodeType: 'flac' },
    { level: 'hires', bitrate: 999000, encodeType: 'flac' },
    { level: 'lossless', bitrate: 999000, encodeType: 'flac' },
    { level: 'exhigh', bitrate: 320000, encodeType: 'mp3' },
    { level: 'higher', bitrate: 192000, encodeType: 'mp3' },
    { level: 'standard', bitrate: 128000, encodeType: 'mp3' }
  ],
  lossless: [
    { level: 'lossless', bitrate: 999000, encodeType: 'flac' },
    { level: 'exhigh', bitrate: 320000, encodeType: 'mp3' },
    { level: 'higher', bitrate: 192000, encodeType: 'mp3' },
    { level: 'standard', bitrate: 128000, encodeType: 'mp3' }
  ],
  high: [
    { level: 'exhigh', bitrate: 320000, encodeType: 'mp3' },
    { level: 'higher', bitrate: 192000, encodeType: 'mp3' },
    { level: 'standard', bitrate: 128000, encodeType: 'mp3' }
  ],
  standard: [{ level: 'standard', bitrate: 128000, encodeType: 'mp3' }]
}

export class NeteaseStreamingProvider extends StreamingProvider {
  source: MusicSource = 'netease'

  private mapTrack(song: any): Track {
    // NetEase fee: 0=free, 1=VIP, 4=paid album, 8=free with login
    const isVip = song.fee === 1 || song.fee === 4
    return {
      id: String(song.id),
      source: 'netease',
      name: song.name || '',
      artists: (song.ar || song.artists || []).map((a: any) => a.name),
      albumName: song.al?.name || song.album?.name || '',
      albumId: String(song.al?.id || song.album?.id || ''),
      albumCoverUrl: song.al?.picUrl || song.album?.picUrl || '',
      duration: song.dt || song.duration || 0,
      vip: isVip
    }
  }

  async search(request: SearchRequest): Promise<SearchResult> {
    const { query, type = ['track'], limit = 30, offset = 0 } = request
    const typeMap: Record<string, number> = { track: 1, album: 10, artist: 100, playlist: 1000 }
    const searchType = typeMap[type[0]] || 1

    try {
      // Use cloudsearch which returns picUrl (ECHO pattern)
      const res = await fetchJson<any>(
        `${API}/api/cloudsearch/pc?s=${encodeURIComponent(query)}&type=${searchType}&limit=${limit}&offset=${offset}`,
        { headers: neteaseHeaders(this.getCookie()), timeout: 8000 }
      )

      const songs = res?.result?.songs || []
      return {
        tracks: songs.map((s: any) => this.mapTrack(s)),
        albums: (res?.result?.albums || []).map((a: any) => ({
          id: String(a.id), source: 'netease' as MusicSource, name: a.name,
          artist: a.artist?.name || '', coverUrl: a.picUrl || '', tracks: []
        })),
        artists: (res?.result?.artists || []).map((a: any) => ({
          id: String(a.id), source: 'netease' as MusicSource, name: a.name, avatarUrl: a.picUrl || ''
        })),
        playlists: (res?.result?.playlists || []).map((p: any) => ({
          id: String(p.id), source: 'netease' as MusicSource, name: p.name,
          description: p.description || '', coverUrl: p.coverImgUrl || '',
          trackCount: p.trackCount || 0, creatorName: p.creator?.nickname || '', creatorId: String(p.creator?.userId || '')
        })),
        total: res?.result?.songCount || songs.length,
        source: 'netease'
      }
    } catch (err) {
      console.error('NetEase search error:', err)
      return { tracks: [], albums: [], artists: [], playlists: [], total: 0, source: 'netease' }
    }
  }

  async getTrack(id: string): Promise<Track> {
    const res = await fetchJson<any>(
      `${API}/api/song/detail/?id=${id}&ids=[${id}]`,
      { headers: neteaseHeaders(this.getCookie()), timeout: 8000 }
    )
    if (!res?.songs?.length) throw new Error(`Track not found: ${id}`)
    return this.mapTrack(res.songs[0])
  }

  async resolvePlayback(id: string, quality: QualityLevel = 'standard'): Promise<PlaybackInfo> {
    const levels = neteaseQualityLevels[quality] || neteaseQualityLevels.standard
    const cookie = this.getCookie() || ''

    for (const { level, bitrate, encodeType } of levels) {
      // Try NCM API package first (ECHO pattern)
      if (ncmApi) {
        try {
          const res = await ncmApi.song_url_v1({ id, level, cookie })
          const url = res?.body?.data?.[0]?.url
          if (url) {
            return { url, quality, format: encodeType === 'flac' ? 'flac' : 'mp3', bitrate, size: 0 }
          }
        } catch {}
      }

      // Fallback: direct HTTP (ECHO pattern)
      try {
        const res = await fetchJson<any>(
          `${API}/api/song/enhance/player/url/v1?ids=[${id}]&level=${level}&br=${bitrate}&encodeType=${encodeType}&csrf_token=&os=pc`,
          { headers: neteaseHeaders(cookie), timeout: 4500 }
        )
        const url = res?.data?.[0]?.url
        if (url) {
          return { url, quality, format: encodeType === 'flac' ? 'flac' : 'mp3', bitrate, size: 0 }
        }
      } catch {}

      // Second fallback
      try {
        const res = await fetchJson<any>(
          `${API}/api/song/enhance/player/url?ids=[${id}]&br=${bitrate}`,
          { headers: neteaseHeaders(cookie), timeout: 4500 }
        )
        const url = res?.data?.[0]?.url
        if (url) {
          return { url, quality, format: 'mp3', bitrate, size: 0 }
        }
      } catch {}
    }

    throw new Error('Failed to get playback URL')
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const res = await fetchJson<any>(
      `${API}/api/v6/playlist/detail?id=${id}`,
      { headers: neteaseHeaders(this.getCookie()), timeout: 8000 }
    )
    const pl = res?.playlist
    if (!pl) throw new Error('Playlist not found')

    const tracksRes = ncmApi
      ? await ncmApi.playlist_track_all({ id, cookie: this.getCookie() || '' }).catch(() => null)
      : null

    return {
      id: String(pl.id), source: 'netease', name: pl.name,
      description: pl.description || '', coverUrl: pl.coverImgUrl || '',
      trackCount: pl.trackCount || 0, creatorName: pl.creator?.nickname || '',
      creatorId: String(pl.creator?.userId || ''),
      tracks: (tracksRes?.body?.songs || []).map((s: any) => this.mapTrack(s))
    }
  }

  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    const res = await fetchJson<any>(
      `${API}/api/user/playlist?uid=${userId}&limit=1000&offset=0&includeVideo=true`,
      { headers: neteaseHeaders(this.getCookie()), timeout: 8000 }
    )
    return (res?.playlist || []).map((pl: any) => ({
      id: String(pl.id), source: 'netease' as MusicSource, name: pl.name,
      description: pl.description || '', coverUrl: pl.coverImgUrl || '',
      trackCount: pl.trackCount || 0, creatorName: pl.creator?.nickname || '',
      creatorId: String(pl.creator?.userId || '')
    }))
  }

  async getLikedSongs(userId: string): Promise<Track[]> {
    try {
      const res = await fetchJson<any>(
        `${API}/api/song/like/get?uid=${userId}`,
        { headers: neteaseHeaders(this.getCookie()), timeout: 8000 }
      )
      return (res?.ids || []).map((id: number) => ({
        id: String(id), source: 'netease' as MusicSource, name: '',
        artists: [], albumName: '', albumId: '', albumCoverUrl: '', duration: 0
      }))
    } catch {
      return []
    }
  }

  async getAlbum(id: string): Promise<Album> {
    const res = await fetchJson<any>(
      `${API}/api/v1/album/${id}`,
      { headers: neteaseHeaders(this.getCookie()), timeout: 8000 }
    )
    return {
      id: String(res?.album?.id || id), source: 'netease', name: res?.album?.name || '',
      artist: res?.album?.artist?.name || '', coverUrl: res?.album?.picUrl || '',
      tracks: (res?.songs || []).map((s: any) => this.mapTrack(s)),
      publishTime: res?.album?.publishTime
    }
  }

  async getArtist(id: string): Promise<Artist> {
    const res = await fetchJson<any>(
      `${API}/api/v1/artist/${id}`,
      { headers: neteaseHeaders(this.getCookie()), timeout: 8000 }
    )
    return {
      id: String(res?.artist?.id || id), source: 'netease',
      name: res?.artist?.name || '', avatarUrl: res?.artist?.picUrl || ''
    }
  }
}
