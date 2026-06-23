import { usePlaybackStore } from '../stores/playbackStore'
import { Track } from '@shared/types/streaming'

const audio = new Audio()
audio.preload = 'auto'

let initialized = false
let lastLyricIndex = -1

function showVipAlert(trackName?: string, source?: string) {
  const name = trackName || '未知歌曲'
  const src = source || 'netease'
  const sourceName = src === 'netease' ? '网易云音乐' : 'QQ音乐'
  document.querySelectorAll('.vip-alert-overlay').forEach(el => el.remove())
  const overlay = document.createElement('div')
  overlay.className = 'vip-alert-overlay'
  overlay.innerHTML = `
    <div class="vip-alert-modal">
      <div class="vip-alert-icon">🎵</div>
      <h3>VIP歌曲</h3>
      <p>歌曲「${name}」需要VIP权限才能播放</p>
      <p class="vip-alert-hint">请在${sourceName}中登录VIP账号后再试</p>
      <button class="btn btn-primary vip-alert-btn" onclick="this.closest('.vip-alert-overlay').remove()">知道了</button>
    </div>
  `
  document.body.appendChild(overlay)
}

async function loadAndPlay(track: Track) {
  const info = await window.api.streaming.resolvePlayback(track.source, track.id, 'standard')
  usePlaybackStore.getState().setCurrentTrack(track)
  usePlaybackStore.getState().setPlaybackInfo(info)

  audio.src = info.url
  audio.volume = usePlaybackStore.getState().isMuted ? 0 : usePlaybackStore.getState().volume

  await new Promise<void>((resolve) => {
    const onCanPlay = () => { audio.removeEventListener('canplay', onCanPlay); audio.removeEventListener('error', onError); resolve() }
    const onError = () => { audio.removeEventListener('canplay', onCanPlay); audio.removeEventListener('error', onError); resolve() }
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('error', onError)
    setTimeout(() => { audio.removeEventListener('canplay', onCanPlay); audio.removeEventListener('error', onError); resolve() }, 8000)
  })

  await audio.play()

  // Load lyrics
  try {
    const lyrics = await window.api.lyrics.getLyrics({
      trackId: track.id, trackName: track.name, artistName: track.artists.join(', '), source: track.source
    })
    if (lyrics) usePlaybackStore.getState().setLyrics(lyrics)
  } catch {}
}

export function restoreLastTrack() {
  const state = usePlaybackStore.getState()
  if (state.currentTrack) {
    // Load the track metadata without playing
    usePlaybackStore.getState().setCurrentTime(0)
    // Load lyrics for the track
    window.api.lyrics.getLyrics({
      trackId: state.currentTrack.id,
      trackName: state.currentTrack.name,
      artistName: state.currentTrack.artists.join(', '),
      source: state.currentTrack.source
    }).then((lyrics) => {
      if (lyrics) usePlaybackStore.getState().setLyrics(lyrics)
    }).catch(() => {})
  }
}

export function initAudio() {
  if (initialized) return
  initialized = true

  audio.addEventListener('timeupdate', () => {
    usePlaybackStore.getState().setCurrentTime(audio.currentTime)

    const { lyrics } = usePlaybackStore.getState()
    if (lyrics?.lines.length) {
      let index = -1
      for (let i = 0; i < lyrics.lines.length; i++) {
        if (lyrics.lines[i].time <= audio.currentTime * 1000) index = i
      }
      if (index !== usePlaybackStore.getState().currentLyricIndex) {
        usePlaybackStore.getState().setCurrentLyricIndex(index)
      }
    }

    // Update floating lyrics
    const { lyrics: l, currentLyricIndex } = usePlaybackStore.getState()
    if (l && currentLyricIndex >= 0) {
      if (currentLyricIndex !== lastLyricIndex) {
        lastLyricIndex = currentLyricIndex
      }
      const line = l.lines[currentLyricIndex]
      if (line) {
        try { window.api.lyricsWindow.updateLine(line.text, line.translation) } catch {}
      }
    }
  })

  audio.addEventListener('loadedmetadata', () => {
    usePlaybackStore.getState().setDuration(audio.duration)
  })

  audio.addEventListener('play', () => usePlaybackStore.getState().setIsPlaying(true))
  audio.addEventListener('pause', () => usePlaybackStore.getState().setIsPlaying(false))

  audio.addEventListener('ended', () => {
    const store = usePlaybackStore.getState()
    const nextTrack = store.advanceToNext()
    if (nextTrack) {
      loadAndPlay(nextTrack).catch(() => {
        // VIP or error, try next
        const next = usePlaybackStore.getState().advanceToNext()
        if (next) loadAndPlay(next).catch(() => {})
      })
    }
  })

  audio.addEventListener('error', () => {
    const track = usePlaybackStore.getState().currentTrack
    // Try next track silently
    const store = usePlaybackStore.getState()
    const next = store.advanceToNext()
    if (next) {
      loadAndPlay(next).catch(() => {})
    } else if (track) {
      showVipAlert(track.name, track.source)
    }
  })

  usePlaybackStore.subscribe((state) => {
    audio.volume = state.isMuted ? 0 : state.volume
  })
}

export function playSingleTrack(track: Track) {
  const store = usePlaybackStore.getState()
  // Set as current playlist context
  if (store.playlist.length === 0) {
    store.setPlaylist([track], 0)
  }
  store.setCurrentTrack(track)
  loadAndPlay(track).catch((err) => {
    console.error('[Playback] Failed:', err.message)
    showVipAlert(track.name, track.source)
  })
}

export function playFromList(tracks: Track[], startIndex = 0) {
  const store = usePlaybackStore.getState()
  store.setPlaylist(tracks, startIndex)
  loadAndPlay(tracks[startIndex]).catch((err) => {
    console.error('[Playback] Failed:', err.message)
    showVipAlert(tracks[startIndex].name, tracks[startIndex].source)
  })
}

export function playQueue(tracks: Track[], startIndex = 0) {
  // "Play All" - skip VIP silently
  const store = usePlaybackStore.getState()
  store.setPlaylist(tracks, startIndex)
  loadAndPlay(tracks[startIndex]).catch(() => {
    const next = usePlaybackStore.getState().advanceToNext()
    if (next) loadAndPlay(next).catch(() => {})
  })
}

export function togglePlay() {
  const state = usePlaybackStore.getState()
  if (state.isPlaying) {
    audio.pause()
  } else if (audio.src) {
    audio.play()
  } else if (state.currentTrack) {
    loadAndPlay(state.currentTrack).catch(() => {})
  }
}

export function pause() { audio.pause() }

export function seek(time: number) { audio.currentTime = time }

export function setVolume(volume: number) {
  usePlaybackStore.getState().setVolume(volume)
}

export function nextTrack() {
  const store = usePlaybackStore.getState()
  const next = store.advanceToNext()
  if (next) {
    loadAndPlay(next).catch(() => {})
  }
}

export function prevTrack() {
  const store = usePlaybackStore.getState()
  const prev = store.advanceToPrev()
  if (prev) {
    loadAndPlay(prev).catch(() => {})
  }
}

export function addToPlayQueue(track: Track) {
  usePlaybackStore.getState().addToPlayQueue(track)
}

export function stopAndClear() {
  audio.pause()
  audio.removeAttribute('src')
  audio.load()
  usePlaybackStore.getState().stopAndClear()
}
