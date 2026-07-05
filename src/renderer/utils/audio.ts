import { usePlaybackStore } from '../stores/playbackStore'
import { Track } from '@shared/types/streaming'
import { createListeningEvent, saveListeningEvent } from './listeningBehavior'

const audio = new Audio()
audio.preload = 'auto'

// Expose globally for device switching IPC
;(window as any).__audioElement = audio

// Apply device to audio element (non-blocking, best-effort)
function applyAudioDevice() {
  if (typeof audio.setSinkId !== 'function') return

  const device = localStorage.getItem('audioOutputDevice') || 'default'
  const targetDevice = device === 'default' ? 'default' : device

  console.log('[Audio] Applying device:', targetDevice)
  audio.setSinkId(targetDevice).then(() => {
    console.log('[Audio] Device applied:', audio.sinkId)
  }).catch((err) => {
    console.log('[Audio] Device apply failed:', err.message)
  })
}

let initialized = false
let lastLyricIndex = -1

// ---- Media Session ----

function updateMediaSession(track: Track) {
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artists.join(', '),
      album: track.albumName || '',
      artwork: track.albumCoverUrl ? [{ src: track.albumCoverUrl, sizes: '300x300', type: 'image/jpeg' }] : []
    })
  } catch {}
}

function setupMediaSessionHandlers() {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.setActionHandler('play', () => audio.play().catch(() => {}))
  navigator.mediaSession.setActionHandler('pause', () => audio.pause())
  navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack())
  navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack())
  navigator.mediaSession.setActionHandler('seekto', (d) => { if (d.seekTime != null) audio.currentTime = d.seekTime })
}

function updatePlaybackState() {
  if (!('mediaSession' in navigator)) return
  try { navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing' } catch {}
}

// ---- VIP Alert ----

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

// ---- Core Playback ----

async function playTrackDirect(track: Track) {
  try {
    console.log('[Playback] Playing:', track.name, track.source, track.id)

    audio.pause()
    audio.removeAttribute('src')
    audio.load()

    // Reset lyrics
    usePlaybackStore.getState().setLyrics(null)
    lastLyricIndex = -1
    try { window.api.lyricsWindow.updateLine('', '') } catch {}

    usePlaybackStore.getState().setCurrentTrack(track)

    const info = await window.api.streaming.resolvePlayback(track.source, track.id, 'standard')
    console.log('[Playback] URL:', info.url.substring(0, 100))
    usePlaybackStore.getState().setPlaybackInfo(info)

    audio.src = info.url
    audio.volume = usePlaybackStore.getState().isMuted ? 0 : usePlaybackStore.getState().volume

    // Apply audio output device (non-blocking)
    applyAudioDevice()

    await new Promise<void>((resolve) => {
      const onCanPlay = () => { audio.removeEventListener('canplay', onCanPlay); audio.removeEventListener('error', onError); resolve() }
      const onError = () => { audio.removeEventListener('canplay', onCanPlay); audio.removeEventListener('error', onError); resolve() }
      audio.addEventListener('canplay', onCanPlay)
      audio.addEventListener('error', onError)
      setTimeout(() => { audio.removeEventListener('canplay', onCanPlay); audio.removeEventListener('error', onError); resolve() }, 8000)
    })

    await audio.play()
    console.log('[Playback] Playing!')

    updateMediaSession(track)

    // Load lyrics
    try {
      const lyrics = await window.api.lyrics.getLyrics({
        trackId: track.id, trackName: track.name, artistName: track.artists.join(', '), source: track.source
      })
      if (lyrics && lyrics.lines.length > 0) {
        usePlaybackStore.getState().setLyrics(lyrics)
      } else {
        usePlaybackStore.getState().setLyrics(null)
      }
    } catch {
      usePlaybackStore.getState().setLyrics(null)
    }
  } catch (err: any) {
    console.error('[Playback] Failed:', err.message)
    showVipAlert(track.name, track.source)
  }
}

function skipToNextSilent() {
  const store = usePlaybackStore.getState()
  const next = store.advanceToNext()
  if (next) {
    playTrackDirect(next).catch(() => {
      const next2 = usePlaybackStore.getState().advanceToNext()
      if (next2) playTrackDirect(next2).catch(() => {})
    })
  }
}

// ---- Initialization ----

export function initAudio() {
  if (initialized) return
  initialized = true

  setupMediaSessionHandlers()

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

    const { lyrics: l, currentLyricIndex } = usePlaybackStore.getState()
    if (l && currentLyricIndex >= 0 && currentLyricIndex !== lastLyricIndex) {
      lastLyricIndex = currentLyricIndex
      const line = l.lines[currentLyricIndex]
      if (line) {
        try { window.api.lyricsWindow.updateLine(line.text, line.translation) } catch {}
      }
    }
  })

  audio.addEventListener('loadedmetadata', () => {
    usePlaybackStore.getState().setDuration(audio.duration)
  })

  audio.addEventListener('play', () => {
    usePlaybackStore.getState().setIsPlaying(true)
    updatePlaybackState()
    try { window.api.tray.updatePlayingState(true) } catch {}
  })

  audio.addEventListener('pause', () => {
    usePlaybackStore.getState().setIsPlaying(false)
    updatePlaybackState()
    try { window.api.tray.updatePlayingState(false) } catch {}
  })

  audio.addEventListener('ended', () => {
    const track = usePlaybackStore.getState().currentTrack
    if (track) saveListeningEvent(createListeningEvent(track, true, false, track.duration))
    skipToNextSilent()
  })

  audio.addEventListener('error', () => {
    const track = usePlaybackStore.getState().currentTrack
    if (track) saveListeningEvent(createListeningEvent(track, false, true, audio.currentTime * 1000))
    skipToNextSilent()
  })

  usePlaybackStore.subscribe((state) => {
    audio.volume = state.isMuted ? 0 : state.volume
  })
}

// ---- Public API ----

export function playSingleTrack(track: Track, source?: { page: string; id?: string }) {
  const store = usePlaybackStore.getState()
  if (store.playlist.length === 0) store.setPlaylist([track], 0)
  if (source) store.setPlaySource(source)
  playTrackDirect(track).catch(() => {
    showVipAlert(track.name, track.source)
    skipToNextSilent()
  })
}

export function playFromList(tracks: Track[], startIndex = 0, source?: { page: string; id?: string }) {
  const store = usePlaybackStore.getState()
  store.setPlaylist(tracks, startIndex)
  if (source) store.setPlaySource(source)
  playTrackDirect(tracks[startIndex]).catch(() => skipToNextSilent())
}

export function playQueue(tracks: Track[], startIndex = 0, source?: { page: string; id?: string }) {
  const store = usePlaybackStore.getState()
  store.setPlaylist(tracks, startIndex)
  if (source) store.setPlaySource(source)
  playTrackDirect(tracks[startIndex]).catch(() => skipToNextSilent())
}

export function togglePlay() {
  const state = usePlaybackStore.getState()
  if (state.isPlaying) {
    audio.pause()
  } else if (audio.src && audio.src !== window.location.href) {
    audio.play().catch(() => {
      if (state.currentTrack) playTrackDirect(state.currentTrack).catch(() => {})
    })
  } else if (state.currentTrack) {
    playTrackDirect(state.currentTrack).catch(() => {})
  }
}

export function pause() { audio.pause() }
export function seek(time: number) { audio.currentTime = time }
export function setVolume(volume: number) { usePlaybackStore.getState().setVolume(volume) }

export function nextTrack() {
  const current = usePlaybackStore.getState().currentTrack
  if (current) saveListeningEvent(createListeningEvent(current, false, true, audio.currentTime * 1000))
  const store = usePlaybackStore.getState()
  const next = store.advanceToNext()
  if (next) playTrackDirect(next).catch(() => skipToNextSilent())
}

export function prevTrack() {
  const store = usePlaybackStore.getState()
  const prev = store.advanceToPrev()
  if (prev) playTrackDirect(prev).catch(() => {})
}

export function addToPlayQueue(track: Track) {
  usePlaybackStore.getState().addToPlayQueue(track)
}

export function stopAndClear() {
  audio.pause()
  audio.removeAttribute('src')
  audio.load()
  usePlaybackStore.getState().stopAndClear()
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.playbackState = 'none'
  }
}

export function restoreLastTrack() {
  const state = usePlaybackStore.getState()
  if (!state.currentTrack) return

  console.log('[Restore] Restoring track:', state.currentTrack.name, 'time:', state.currentTime)

  // Update media session metadata
  updateMediaSession(state.currentTrack)

  // Restore the track (without auto-playing)
  // Set the audio source so the track is ready to play
  window.api.streaming.resolvePlayback(state.currentTrack.source, state.currentTrack.id, 'standard')
    .then((info) => {
      audio.src = info.url
      audio.volume = state.isMuted ? 0 : state.volume

      // Wait for metadata to load, then restore position
      audio.addEventListener('loadedmetadata', function onMeta() {
        audio.removeEventListener('loadedmetadata', onMeta)
        if (state.currentTime > 0 && state.currentTime < audio.duration) {
          audio.currentTime = state.currentTime
          console.log('[Restore] Position restored to:', state.currentTime)
        }
      }, { once: true })

      usePlaybackStore.getState().setPlaybackInfo(info)
    })
    .catch(() => {
      console.log('[Restore] Failed to resolve playback URL')
    })

  // Load lyrics
  window.api.lyrics.getLyrics({
    trackId: state.currentTrack.id,
    trackName: state.currentTrack.name,
    artistName: state.currentTrack.artists.join(', '),
    source: state.currentTrack.source
  }).then((lyrics) => {
    if (lyrics) usePlaybackStore.getState().setLyrics(lyrics)
  }).catch(() => {})
}
