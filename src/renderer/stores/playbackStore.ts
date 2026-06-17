import { create } from 'zustand'
import { Track, PlaybackInfo, QualityLevel } from '@shared/types/streaming'
import { Lyrics } from '@shared/types/lyrics'

export type PlayMode = 'sequence' | 'loop' | 'shuffle' | 'single'

let audioElement: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio()
    audioElement.preload = 'auto'
  }
  return audioElement
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem('playbackState')
    if (saved) {
      const state = JSON.parse(saved)
      return {
        currentTrack: state.currentTrack || null,
        queue: state.queue || [],
        queueIndex: state.queueIndex ?? -1,
        volume: state.volume ?? 0.7,
        playMode: state.playMode || 'sequence'
      }
    }
  } catch {}
  return null
}

function saveState(state: Partial<PlaybackState>) {
  try {
    const toSave = {
      currentTrack: state.currentTrack,
      queue: state.queue,
      queueIndex: state.queueIndex,
      volume: state.volume,
      playMode: state.playMode
    }
    localStorage.setItem('playbackState', JSON.stringify(toSave))
  } catch {}
}

function addToHistory(track: Track) {
  try {
    const history = JSON.parse(localStorage.getItem('playHistory') || '[]') as Array<{ track: Track; playedAt: number }>
    const filtered = history.filter(h => !(h.track.id === track.id && h.track.source === track.source))
    filtered.unshift({ track, playedAt: Date.now() })
    if (filtered.length > 100) filtered.length = 100
    localStorage.setItem('playHistory', JSON.stringify(filtered))
  } catch {}
}

interface PlaybackState {
  currentTrack: Track | null
  playbackInfo: PlaybackInfo | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playMode: PlayMode
  queue: Track[]
  queueIndex: number
  lyrics: Lyrics | null
  currentLyricIndex: number

  setCurrentTrack: (track: Track) => void
  setPlaybackInfo: (info: PlaybackInfo) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setPlayMode: (mode: PlayMode) => void
  cyclePlayMode: () => void
  setQueue: (tracks: Track[], startIndex?: number) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  nextTrack: () => void
  prevTrack: () => void
  setLyrics: (lyrics: Lyrics | null) => void
  setCurrentLyricIndex: (index: number) => void
  getAudio: () => HTMLAudioElement
}

const savedState = loadSavedState()

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  currentTrack: savedState?.currentTrack || null,
  playbackInfo: null,
  isPlaying: false,
  currentTime: 0,
  duration: savedState?.currentTrack ? savedState.currentTrack.duration / 1000 : 0,
  volume: savedState?.volume ?? 0.7,
  isMuted: false,
  playMode: (savedState?.playMode as PlayMode) || 'sequence',
  queue: savedState?.queue || [],
  queueIndex: savedState?.queueIndex ?? -1,
  lyrics: null,
  currentLyricIndex: -1,

  setCurrentTrack: (track) => {
    set({ currentTrack: track, currentTime: 0, duration: track.duration / 1000 })
    addToHistory(track)
    saveState({ ...get(), currentTrack: track })
  },
  setPlaybackInfo: (info) => set({ playbackInfo: info }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => {
    const audio = getAudio()
    audio.volume = volume
    set({ volume, isMuted: volume === 0 })
    saveState({ ...get(), volume })
  },
  toggleMute: () => {
    const { isMuted, volume } = get()
    const audio = getAudio()
    if (isMuted) {
      audio.volume = volume
      set({ isMuted: false })
    } else {
      audio.volume = 0
      set({ isMuted: true })
    }
  },
  setPlayMode: (mode) => {
    set({ playMode: mode })
    saveState({ ...get(), playMode: mode })
  },
  cyclePlayMode: () => {
    const modes: PlayMode[] = ['sequence', 'loop', 'single', 'shuffle']
    const { playMode } = get()
    const currentIndex = modes.indexOf(playMode)
    const newMode = modes[(currentIndex + 1) % modes.length]
    set({ playMode: newMode })
    saveState({ ...get(), playMode: newMode })
  },
  setQueue: (tracks, startIndex = 0) => {
    set({ queue: tracks, queueIndex: startIndex })
    saveState({ ...get(), queue: tracks, queueIndex: startIndex })
  },
  addToQueue: (track) => {
    const newQueue = [...get().queue, track]
    set({ queue: newQueue })
    saveState({ ...get(), queue: newQueue })
  },
  removeFromQueue: (index) => {
    const { queue, queueIndex } = get()
    const newQueue = queue.filter((_, i) => i !== index)
    const newIndex = queueIndex > index ? queueIndex - 1 : queueIndex
    set({ queue: newQueue, queueIndex: newIndex })
    saveState({ ...get(), queue: newQueue, queueIndex: newIndex })
  },
  nextTrack: () => {
    const { queue, queueIndex, playMode } = get()
    if (queue.length === 0) return

    let nextIndex: number
    if (playMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else if (playMode === 'single') {
      nextIndex = queueIndex
    } else {
      nextIndex = (queueIndex + 1) % queue.length
    }

    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      currentTime: 0,
      duration: queue[nextIndex].duration / 1000
    })
    addToHistory(queue[nextIndex])
    saveState({ ...get(), queueIndex: nextIndex, currentTrack: queue[nextIndex] })
  },
  prevTrack: () => {
    const { queue, queueIndex } = get()
    if (queue.length === 0) return

    const prevIndex = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1
    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      currentTime: 0,
      duration: queue[prevIndex].duration / 1000
    })
    addToHistory(queue[prevIndex])
    saveState({ ...get(), queueIndex: prevIndex, currentTrack: queue[prevIndex] })
  },
  setLyrics: (lyrics) => set({ lyrics, currentLyricIndex: -1 }),
  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),
  getAudio: () => getAudio()
}))
