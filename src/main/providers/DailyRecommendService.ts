import { Track } from '@shared/types/streaming'
import { accountService } from '../accounts/AccountService'
import { fetchJson } from '../network/fetch'

// ---- Shared mappers ----

function mapNeteaseTrack(song: any): Track {
  return {
    id: String(song.id),
    source: 'netease',
    name: song.name || '',
    artists: (song.ar || song.artists || []).map((a: any) => a.name),
    albumName: song.al?.name || song.album?.name || '',
    albumId: String(song.al?.id || song.album?.id || ''),
    albumCoverUrl: song.al?.picUrl || song.album?.picUrl || '',
    duration: song.dt || song.duration || 0
  }
}

function mapQQTrack(song: any): Track {
  // Handle different response formats
  const mid = song.mid || song.songmid || song.song_mid || ''
  const name = song.name || song.songname || song.song_name || song.title || ''
  const artists = (song.singer || []).map((s: any) => s.name || s.singer_name || '')
  const albumMid = song.album?.mid || song.albummid || song.album_mid || ''
  const albumName = song.album?.name || song.albumname || song.album_name || ''
  const interval = song.interval || song.duration || song.play_time || 0

  return {
    id: mid || String(song.id || song.songid || ''),
    source: 'qqmusic',
    name,
    artists,
    albumName,
    albumId: albumMid,
    albumCoverUrl: albumMid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg` : '',
    duration: interval * (interval < 10000 ? 1000 : 1) // Convert to ms if needed
  }
}

// ---- NetEase daily recommend ----

export async function fetchNeteaseDailyRecommend(): Promise<Track[]> {
  const cookie = accountService.getCookie('netease')
  if (!cookie) {
    console.log('[DailyRecommend] NetEase: not logged in')
    return []
  }

  try {
    const res = await fetchJson<any>(
      'https://music.163.com/api/v3/discovery/recommend/songs',
      {
        headers: {
          Referer: 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Cookie: cookie
        },
        timeout: 10000
      }
    )

    const songs = res?.data?.dailySongs || res?.recommend || []
    console.log('[DailyRecommend] NetEase:', songs.length, 'songs')
    return songs.map(mapNeteaseTrack)
  } catch (err) {
    console.error('[DailyRecommend] NetEase error:', err)
    return []
  }
}

// ---- QQ Music daily recommend ----
// Uses the same approach as NetEase: fetch from API with user cookie

export async function fetchQQDailyRecommend(): Promise<Track[]> {
  const cookie = accountService.getCookie('qqmusic')
  if (!cookie) {
    console.log('[DailyRecommend] QQ Music: not logged in')
    return []
  }

  console.log('[DailyRecommend] QQ Music cookie:', cookie.length, 'chars')

  // Method 1: Try to get daily recommend from QQ Music API
  try {
    const uin = extractUin(cookie)
    const gtk = qqGtkFromCookie(cookie)

    // Try the recommend songs API
    const res = await fetchJson<any>(
      'https://u.y.qq.com/cgi-bin/musicu.fcg',
      {
        method: 'POST',
        headers: qqHeaders(cookie),
        body: {
          comm: {
            ct: 24, cv: 0, uin: `o${uin}`, g_tk: gtk,
            format: 'json', inCharset: 'utf-8', outCharset: 'utf-8',
            notice: 0, platform: 'h5', needNewCode: 1
          },
          req_0: {
            module: 'music.musichallComm.PlayLogicComm',
            method: 'GetDailyRecommend',
            param: { uin: `o${uin}` }
          }
        },
        timeout: 10000
      }
    )

    const songs = res?.req_0?.data?.songlist || res?.req_0?.data?.songs || []
    if (songs.length > 0) {
      console.log('[DailyRecommend] QQ Music via API:', songs.length, 'songs')
      return songs.map(mapQQTrack)
    }
  } catch (err) {
    console.log('[DailyRecommend] QQ Music API failed:', err)
  }

  // Method 2: Fallback - use a popular playlist as daily recommend
  try {
    const res = await fetchJson<any>(
      'https://c.y.qq.com/v8/fcg-bin/fcg_v8_playlist_cp.fcg?disstid=888888&format=json&song_num=30&song_begin=0&g_tk=5381',
      {
        headers: qqHeaders(cookie),
        timeout: 10000
      }
    )

    const songs = res?.cdlist?.[0]?.songlist || []
    if (songs.length > 0) {
      console.log('[DailyRecommend] QQ Music via playlist:', songs.length, 'songs')
      return songs.map(mapQQTrack)
    }
  } catch {}

  // Method 3: Use toplist as fallback
  try {
    const res = await fetchJson<any>(
      'https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg?tpl=3&page=detail&date=2024-01-01&topid=26&type=top&song_begin=0&song_num=30&g_tk=5381&loginUin=0&format=json',
      {
        headers: qqHeaders(cookie),
        timeout: 10000
      }
    )

    const rawSongs = res?.songlist || []
    console.log('[DailyRecommend] QQ Music toplist raw:', rawSongs.length, 'songs')
    // Toplist songs have data.songinfo structure
    const songs = rawSongs
      .map((s: any) => s.data?.songinfo || s.songinfo || s.data || s)
      .filter((s: any) => s.mid || s.songmid)
    console.log('[DailyRecommend] QQ Music via toplist:', songs.length, 'songs')
    if (songs.length > 0) {
      return songs.map(mapQQTrack)
    }
  } catch (err) {
    console.error('[DailyRecommend] QQ Music toplist failed:', err)
  }

  return []
}

// ---- QQ Music helpers ----

function extractUin(cookie: string): string {
  for (const name of ['uin', 'qqmusic_uin', 'p_uin', 'pt2gguin', 'loginUin', 'wxuin']) {
    const match = cookie.match(new RegExp(`${name}=o?(\\d+)`, 'i'))
    if (match) return match[1]
  }
  return '0'
}

function qqGtkFromCookie(cookie: string): number {
  const skey = cookie.match(/(?:qqmusic_key|qm_keyst|music_key|p_skey|skey)=([^;]+)/)?.[1] ?? ''
  let hash = 5381
  for (const char of skey) {
    hash += (hash << 5) + char.charCodeAt(0)
  }
  return hash & 0x7fffffff
}

function qqHeaders(cookie?: string): Record<string, string> {
  return {
    Referer: 'https://y.qq.com/',
    Origin: 'https://y.qq.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ...(cookie ? { Cookie: cookie } : {})
  }
}
