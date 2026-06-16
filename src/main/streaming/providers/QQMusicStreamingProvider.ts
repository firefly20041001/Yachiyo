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
import { fetchJson, fetchText, computeGTK } from '../../network/fetch'

const API = 'https://u.y.qq.com/cgi-bin/musicu.fcg'
const LEGACY_API = 'https://c.y.qq.com'

const qqHeaders = (cookie?: string): Record<string, string> => ({
  Referer: 'https://y.qq.com/',
  Origin: 'https://y.qq.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  ...(cookie ? { Cookie: cookie } : {})
})

const uinFromCookie = (cookie?: string): string => {
  if (!cookie) return '0'
  for (const name of ['uin', 'qqmusic_uin', 'p_uin', 'pt2gguin', 'loginUin', 'wxuin']) {
    const match = cookie.match(new RegExp(`${name}=o?(\\d+)`, 'i'))
    if (match) return match[1]
  }
  return '0'
}

const qqGuidFromCookie = (cookie?: string): string => {
  if (!cookie) return '10000'
  const pgvPvid = cookie.match(/pgv_pvid=([^;]+)/)?.[1]
  if (pgvPvid) return pgvPvid.replace(/\D/g, '')
  return '10000'
}

const qqGtkFromCookie = (cookie?: string): number => {
  const skey = cookie?.match(/(?:qqmusic_key|qm_keyst|music_key|p_skey|skey)=([^;]+)/)?.[1] ?? ''
  let hash = 5381
  for (const char of skey) {
    hash += (hash << 5) + char.charCodeAt(0)
  }
  return hash & 0x7fffffff
}

const qualityPrefix = (quality: string) => {
  const map: Record<string, any> = {
    hires: { prefix: 'F000', ext: 'flac', codec: 'flac', mimeType: 'audio/flac', bitrate: 999000 },
    lossless: { prefix: 'F000', ext: 'flac', codec: 'flac', mimeType: 'audio/flac', bitrate: 999000 },
    high: { prefix: 'M800', ext: 'mp3', codec: 'mp3', mimeType: 'audio/mpeg', bitrate: 320000 },
    standard: { prefix: 'M500', ext: 'mp3', codec: 'mp3', mimeType: 'audio/mpeg', bitrate: 128000 }
  }
  return map[quality] || map.standard
}

const qqPlaybackQualityFallbacks: Record<string, string[]> = {
  hires: ['lossless', 'high', 'standard'],
  lossless: ['lossless', 'high', 'standard'],
  high: ['high', 'standard'],
  standard: ['standard'],
  fallback: ['lossless', 'high', 'standard']
}

const qqPlaybackEndpoints = [
  { module: 'music.vkey.GetVkey', method: 'UrlGetVkey', modern: true, platforms: [null] },
  { module: 'vkey.GetVkeyServer', method: 'CgiGetVkey', modern: false, platforms: ['20', 'yqq'] }
]

export class QQMusicStreamingProvider extends StreamingProvider {
  source: MusicSource = 'qqmusic'

  private mapTrack(song: any): Track {
    const mid = song.mid || song.songmid || ''
    const albumMid = song.album?.mid || song.albummid || ''
    return {
      id: mid || String(song.id || song.songid || ''),
      source: 'qqmusic',
      name: song.name || song.songname || '',
      artists: (song.singer || []).map((s: any) => s.name),
      albumName: song.album?.name || song.albumname || '',
      albumId: albumMid,
      albumCoverUrl: albumMid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg` : '',
      duration: (song.interval || 0) * 1000
    }
  }

  private async fetchSong(songMid: string): Promise<any> {
    const cookie = this.getCookie() || ''
    const uin = uinFromCookie(cookie)
    const gtk = qqGtkFromCookie(cookie)

    const res = await fetchJson<any>(API, {
      method: 'POST',
      headers: qqHeaders(cookie),
      body: {
        req_0: {
          module: 'music.pf_song_detail_svr',
          method: 'get_song_detail_yqq',
          param: { song_mid: songMid, song_type: 0 }
        },
        comm: { uin, format: 'json', ct: 24, cv: 0, g_tk: gtk }
      },
      timeout: 8000
    })

    return res?.req_0?.data?.track_info || res?.req_0?.data?.songinfo || {}
  }

  async search(request: SearchRequest): Promise<SearchResult> {
    const { query, type = ['track'], limit = 30, offset = 0 } = request
    const cookie = this.getCookie() || ''
    const uin = uinFromCookie(cookie)
    const gtk = qqGtkFromCookie(cookie)

    const searchTypeMap: Record<string, number> = { track: 0, album: 8, artist: 9, playlist: 3 }
    const searchType = searchTypeMap[type[0]] ?? 0

    try {
      const res = await fetchJson<any>(API, {
        method: 'POST',
        headers: qqHeaders(cookie),
        body: {
          comm: { ct: 24, cv: 0, uin, format: 'json', inCharset: 'utf-8', outCharset: 'utf-8', notice: 0, platform: 'h5', needNewCode: 1, g_tk: gtk, g_tk_new_20200303: gtk },
          req_1: {
            module: 'music.search.SearchCgiService',
            method: 'DoSearchForQQMusicDesktop',
            param: { query, page_num: Math.floor(offset / limit) + 1, num_per_page: limit, search_type: searchType }
          }
        },
        timeout: 10000
      })

      const body = res?.req_1?.data?.body || {}
      const songList = body.song?.list || []

      return {
        tracks: songList.map((s: any) => this.mapTrack(s)),
        albums: (body.album?.list || []).map((a: any) => ({
          id: a.albumMid || a.mid || '', source: 'qqmusic' as MusicSource, name: a.albumName || a.name || '', artist: a.singerName || '',
          coverUrl: a.albumMid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${a.albumMid}.jpg` : '', tracks: []
        })),
        artists: (body.singer?.list || []).map((a: any) => ({
          id: a.singerMid || a.mid || '', source: 'qqmusic' as MusicSource, name: a.singerName || a.name || '', avatarUrl: a.singerPic || ''
        })),
        playlists: [],
        total: body.song?.totalnum || songList.length,
        source: 'qqmusic'
      }
    } catch (err) {
      console.error('QQ Music search error:', err)
      return { tracks: [], albums: [], artists: [], playlists: [], total: 0, source: 'qqmusic' }
    }
  }

  async getTrack(id: string): Promise<Track> {
    const song = await this.fetchSong(id)
    return this.mapTrack(song)
  }

  async resolvePlayback(id: string, quality: QualityLevel = 'standard'): Promise<PlaybackInfo> {
    const cookie = this.getCookie() || ''
    const uin = uinFromCookie(cookie)
    const guid = qqGuidFromCookie(cookie)
    const gtk = qqGtkFromCookie(cookie)

    const song = await this.fetchSong(id)
    const file = song.file || {}
    const songMid = song.mid || id
    const mediaMid = file.media_mid || file.mediaMid || file.strMediaMid || songMid

    const qualities = qqPlaybackQualityFallbacks[quality] || qqPlaybackQualityFallbacks.fallback

    for (const q of qualities) {
      const selected = qualityPrefix(q)
      const filename = `${selected.prefix}${mediaMid}.${selected.ext}`

      for (const endpoint of qqPlaybackEndpoints) {
        for (const platform of endpoint.platforms) {
          const param: Record<string, unknown> = {
            guid,
            songmid: [songMid],
            filename: [filename],
            songtype: [0],
            uin,
          }
          if (endpoint.modern) {
            param.ctx = 0
          } else {
            param.loginflag = 1
            if (platform) param.platform = platform
          }

          const body = {
            req_0: { module: endpoint.module, method: endpoint.method, param },
            comm: endpoint.modern
              ? { uin, format: 'json', ct: 24, cv: 4747474, platform: 'yqq.json', chid: '0', g_tk: gtk, g_tk_new_20200303: gtk, inCharset: 'utf-8', outCharset: 'utf-8', notice: 0, needNewCode: 1 }
              : { uin, format: 'json', ct: 24, cv: 0 }
          }

          try {
            const res = await fetchJson<any>(API, { method: 'POST', headers: qqHeaders(cookie), body, timeout: 8000 })
            const data = res?.req_0?.data || {}
            const item = data.midurlinfo?.[0] || {}
            const purl = item.purl || ''

            if (!purl) continue

            const sip = Array.isArray(data.sip) ? data.sip.find((s: string) => s) : null
            const url = purl.startsWith('http') ? purl : `${sip || 'https://isure.stream.qqmusic.qq.com/'}${purl}`

            return { url, quality: q as QualityLevel, format: selected.ext, bitrate: selected.bitrate, size: 0 }
          } catch {}
        }
      }
    }

    throw new Error('Failed to get playback URL')
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const cookie = this.getCookie() || ''
    const uin = uinFromCookie(cookie)
    const gtk = qqGtkFromCookie(cookie)

    // Check if this is a toplist ID (small number like 26, 4, 27, 62, 67)
    const topid = Number(id)
    if (topid > 0 && topid < 1000) {
      // Use toplist API
      try {
        const tracks = await this.getToplist(topid, 100)
        const toplistNames: Record<number, string> = {
          26: '飙升榜', 4: '流行指数榜', 27: '热歌榜', 62: '新歌榜', 67: '抖音排行榜'
        }
        return {
          id, source: 'qqmusic', name: toplistNames[topid] || `QQ音乐榜${id}`,
          description: '', coverUrl: '', trackCount: tracks.length,
          creatorName: 'QQ音乐', creatorId: uin, tracks
        }
      } catch {}
    }

    // Regular playlist: use uniform_get_Dissinfo
    try {
      const res = await fetchJson<any>(API, {
        method: 'POST',
        headers: qqHeaders(cookie),
        body: {
          req_0: {
            module: 'music.srfDissInfo.aiDissInfo',
            method: 'uniform_get_Dissinfo',
            param: { disstid: Number(id), dirid: 0, tag: 1, charset: 'utf8', g_tk: gtk }
          },
          comm: { uin, format: 'json', ct: 24, cv: 0, g_tk: gtk }
        },
        timeout: 10000
      })

      const dissinfo = res?.req_0?.data
      const songlist = dissinfo?.songlist || []
      return {
        id, source: 'qqmusic', name: dissinfo?.dirinfo?.title || 'QQ Music Playlist',
        description: dissinfo?.dirinfo?.desc || '', coverUrl: dissinfo?.dirinfo?.picurl || '',
        trackCount: dissinfo?.dirinfo?.songcnt || songlist.length,
        creatorName: dissinfo?.dirinfo?.nickname || '', creatorId: String(dissinfo?.dirinfo?.uin || ''),
        tracks: songlist.map((s: any) => this.mapTrack(s))
      }
    } catch {}

    // Fallback: legacy
    try {
      const res = await fetchJson<any>(
        `${LEGACY_API}/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&disstid=${id}&format=json&g_tk=5381&loginUin=0`,
        { headers: qqHeaders(cookie), timeout: 10000 }
      )
      const cd = res?.cdlist?.[0]
      return {
        id, source: 'qqmusic', name: cd?.dissname || 'QQ Music Playlist',
        description: cd?.desc || '', coverUrl: cd?.logo || '', trackCount: cd?.total_song_num || 0,
        creatorName: cd?.nickname || '', creatorId: String(cd?.uin || ''),
        tracks: (cd?.songlist || []).map((s: any) => this.mapTrack(s))
      }
    } catch {
      return { id, source: 'qqmusic', name: 'QQ Music Playlist', description: '', coverUrl: '', trackCount: 0, creatorName: '', creatorId: '', tracks: [] }
    }
  }

  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    const cookie = this.getCookie() || ''
    const uin = uinFromCookie(cookie)
    const gtk = qqGtkFromCookie(cookie)
    const results: Playlist[] = []

    console.log('[QQMusic] getUserPlaylists - uin:', uin)

    // Get user's collected playlists via legacy API
    try {
      const res = await fetchJson<any>(
        `${LEGACY_API}/fav/fcgi-bin/fcg_get_profile_order_asset.fcg?loginUin=${uin}&hostUin=${uin}&cid=205360772&reqtype=2&sin=0&ein=49&format=json&g_tk=${gtk}`,
        { headers: qqHeaders(cookie), timeout: 10000 }
      )

      const cdlist = res?.data?.cdlist || []
      console.log('[QQMusic] user collected playlists:', cdlist.length)

      for (const cd of cdlist) {
        results.push({
          id: String(cd.disstid || cd.dissid || ''),
          source: 'qqmusic' as MusicSource,
          name: cd.dissname || cd.title || '',
          description: cd.desc || '',
          coverUrl: cd.logo || cd.picurl || '',
          trackCount: cd.song_cnt || cd.total_song_num || 0,
          creatorName: cd.nickname || '',
          creatorId: String(cd.uin || uin)
        })
      }
    } catch (err) {
      console.error('[QQMusic] getUserPlaylists error:', err)
    }

    // Also add default toplist
    results.unshift({
      id: 'qq_toplist_26',
      source: 'qqmusic' as MusicSource,
      name: 'QQ音乐飙升榜',
      description: 'QQ音乐热门歌曲排行榜',
      coverUrl: '',
      trackCount: 50,
      creatorName: 'QQ音乐',
      creatorId: uin
    })

    console.log('[QQMusic] total playlists:', results.length)
    return results
  }

  async getLikedSongs(userId: string): Promise<Track[]> { return [] }

  async getAlbum(id: string): Promise<Album> {
    const res = await fetchJson<any>(
      `${LEGACY_API}/v8/fcg-bin/fcg_v8_album_info_cp.fcg?albummid=${id}&format=json&newsong=1`,
      { headers: qqHeaders(this.getCookie()), timeout: 8000 }
    )
    return {
      id, source: 'qqmusic', name: res?.data?.name || '', artist: res?.data?.singername || '',
      coverUrl: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${id}.jpg`,
      tracks: (res?.data?.list || []).map((s: any) => this.mapTrack(s))
    }
  }

  async getArtist(id: string): Promise<Artist> {
    return { id, source: 'qqmusic', name: '', avatarUrl: `https://y.gtimg.cn/music/photo_new/T001R300x300M000${id}.jpg` }
  }

  async getToplist(topid: number = 26, limit: number = 50): Promise<Track[]> {
    const cookie = this.getCookie() || ''
    const uin = uinFromCookie(cookie)
    const gtk = qqGtkFromCookie(cookie)

    // Try legacy API first (more reliable for toplist)
    try {
      const res = await fetchJson<any>(
        `${LEGACY_API}/v8/fcg-bin/fcg_v8_toplist_cp.fcg?tpl=3&page=detail&date=2024-01-01&topid=${topid}&type=top&song_begin=0&song_num=${limit}&g_tk=${gtk}&loginUin=${uin}&format=json`,
        { headers: qqHeaders(cookie), timeout: 10000 }
      )

      const songList = res?.songlist || []
      if (songList.length > 0) {
        console.log(`[QQMusic] legacy toplist (${topid}): ${songList.length} songs`)
        return songList.map((s: any) => this.mapTrack(s.songinfo || s.data || s))
      }
    } catch (err) {
      console.log('[QQMusic] legacy toplist error:', err)
    }

    // Try modern API
    try {
      const res = await fetchJson<any>(API, {
        method: 'POST',
        headers: qqHeaders(cookie),
        body: {
          req_0: {
            module: 'music.srfToplist.Toplist',
            method: 'GetDetail',
            param: { topid, offset: 0, num: limit, period: '' }
          },
          comm: { uin, format: 'json', ct: 24, cv: 0, g_tk: gtk }
        },
        timeout: 10000
      })

      const songList = res?.req_0?.data?.songInfoList || []
      if (songList.length > 0) {
        console.log(`[QQMusic] modern toplist (${topid}): ${songList.length} songs`)
        return songList.map((s: any) => this.mapTrack(s))
      }
    } catch (err) {
      console.log('[QQMusic] modern toplist error:', err)
    }

    return []
  }
}
