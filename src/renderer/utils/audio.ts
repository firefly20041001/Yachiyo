import { usePlaybackStore } from '../stores/playbackStore'
import { Track } from '@shared/types/streaming'

const audio = new Audio()
audio.preload = 'auto'

let initialized = false
let isQueuePlay = false
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

export async function playTrack(track: Track) {
  try {
    audio.pause()

    // Clear old lyrics
    usePlaybackStore.getState().setLyrics(null)
    lastLyricIndex = -1
    try { window.api.lyricsWindow.updateLine('', '') } catch {}

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
  } catch {
    if (isQueuePlay) {
      // Skip to next silently
      const { queue, queueIndex } = usePlaybackStore.getState()
      if (queue.length > 1) {
        const nextIndex = (queueIndex + 1) % queue.length
        if (nextIndex !== queueIndex) {
          usePlaybackStore.getState().setQueue(queue, nextIndex)
          playTrack(queue[nextIndex])
          return
        }
      }
    } else {
      showVipAlert(track.name, track.source)
    }
  }
}

export function initAudio() {
  if (initialized) return
  initialized = true

  audio.addEventListener('timeupdate', () => {
    usePlaybackStore.getState().setCurrentTime(audio.currentTime)

    // Update lyric index
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
  })

  audio.addEventListener('pause', () => {
    usePlaybackStore.getState().setIsPlaying(false)
  })

  audio.addEventListener('ended', () => {
    const state = usePlaybackStore.getState()
    state.nextTrack()
    const newState = usePlaybackStore.getState()
    if (newState.currentTrack) {
      isQueuePlay = true
      playTrack(newState.currentTrack)
    }
  })

  audio.addEventListener('error', () => {
    if (isQueuePlay) {
      const state = usePlaybackStore.getState()
      state.nextTrack()
      const newState = usePlaybackStore.getState()
      if (newState.currentTrack) {
        playTrack(newState.currentTrack)
      }
    } else {
      const track = usePlaybackStore.getState().currentTrack
      if (track) showVipAlert(track.name, track.source)
    }
  })

  usePlaybackStore.subscribe((state) => {
    audio.volume = state.isMuted ? 0 : state.volume
  })
}

export function togglePlay() {
  const state = usePlaybackStore.getState()
  if (state.isPlaying) {
    audio.pause()
  } else if (audio.src) {
    audio.play()
  } else if (state.currentTrack) {
    isQueuePlay = false
    playTrack(state.currentTrack)
  }
}

export function pause() {
  audio.pause()
}

export function seek(time: number) {
  audio.currentTime = time
}

export function setVolume(volume: number) {
  usePlaybackStore.getState().setVolume(volume)
}

export function nextTrack() {
  const state = usePlaybackStore.getState()
  state.nextTrack()
  const newState = usePlaybackStore.getState()
  if (newState.currentTrack) {
    isQueuePlay = true
    playTrack(newState.currentTrack)
  }
}

export function prevTrack() {
  const state = usePlaybackStore.getState()
  state.prevTrack()
  const newState = usePlaybackStore.getState()
  if (newState.currentTrack) {
    isQueuePlay = true
    playTrack(newState.currentTrack)
  }
}

export async function playQueue(tracks: Track[], startIndex = 0) {
  isQueuePlay = true
  usePlaybackStore.getState().setQueue(tracks, startIndex)
  await playTrack(tracks[startIndex])
}

export async function playFromList(tracks: Track[], startIndex = 0) {
  isQueuePlay = false
  usePlaybackStore.getState().setQueue(tracks, startIndex)
  await playTrack(tracks[startIndex])
}

export async function playSingleTrack(track: Track) {
  isQueuePlay = false
  await playTrack(track)
}

export function setPriorityNext(track: Track) {
  const { queue, queueIndex } = usePlaybackStore.getState()
  const filtered = queue.filter(t => !(t.id === track.id && t.source === track.source))
  const insertAt = Math.min(queueIndex + 1, filtered.length)
  filtered.splice(insertAt, 0, track)
  usePlaybackStore.getState().setQueue(filtered, queueIndex)
}

export function stopAndClear() {
  audio.pause()
  audio.removeAttribute('src')
  audio.load()
  usePlaybackStore.setState({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    lyrics: null,
    queue: [],
    queueIndex: -1,
    playbackInfo: null,
    currentLyricIndex: -1
  })
  localStorage.removeItem('playbackState')
}
