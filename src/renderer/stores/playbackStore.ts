import { create } from 'zustand'
import { Track, PlaybackInfo } from '@shared/types/streaming'
import { Lyrics } from '@shared/types/lyrics'

export type PlayMode = 'sequence' | 'loop' | 'shuffle' | 'single'

interface PlaybackState {
  // Current playback
  currentTrack: Track | null
  playbackInfo: PlaybackInfo | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playMode: PlayMode

  // Playlist (source of truth for the list)
  playlist: Track[]
  currentIndex: number

  // Play queue (priority queue, consumed first)
  playQueue: Track[]

  // Track which page/context the song was played from
  playSource: { page: string; id?: string } | null

  // Lyrics
  lyrics: Lyrics | null
  currentLyricIndex: number

  // Actions
  setCurrentTrack: (track: Track | null) => void
  setPlaySource: (source: { page: string; id?: string } | null) => void
  setPlaybackInfo: (info: PlaybackInfo) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setPlayMode: (mode: PlayMode) => void
  cyclePlayMode: () => void

  setPlaylist: (tracks: Track[], startIndex?: number) => void
  addToPlayQueue: (track: Track) => void
  clearPlayQueue: () => void
  removeFromPlayQueue: (index: number) => void

  getNextTrack: () => Track | null
  getPrevTrack: () => Track | null
  advanceToNext: () => Track | null
  advanceToPrev: () => Track | null

  setLyrics: (lyrics: Lyrics | null) => void
  setCurrentLyricIndex: (index: number) => void

  stopAndClear: () => void
}

// Persistence
function loadSaved() {
  try {
    const s = localStorage.getItem('playbackState')
    if (s) return JSON.parse(s)
  } catch {}
  return null
}

function saveState(data: Record<string, any>) {
  try {
    localStorage.setItem('playbackState', JSON.stringify(data))
  } catch {}
}

function loadPlayMode(): PlayMode {
  try {
    return (localStorage.getItem('playMode') as PlayMode) || 'sequence'
  } catch {
    return 'sequence'
  }
}

function savePlayMode(mode: PlayMode) {
  try {
    localStorage.setItem('playMode', mode)
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

function persist(state: Partial<PlaybackState>) {
  const current = loadSaved() || {}
  saveState({
    ...current,
    ...(state.playlist !== undefined && { playlist: state.playlist }),
    ...(state.currentIndex !== undefined && { currentIndex: state.currentIndex }),
    ...(state.playQueue !== undefined && { playQueue: state.playQueue }),
    ...(state.volume !== undefined && { volume: state.volume }),
    ...(state.currentTrack !== undefined && { currentTrack: state.currentTrack })
  })
}

const saved = loadSaved()

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  currentTrack: saved?.currentTrack || null,
  playbackInfo: null,
  isPlaying: false,
  currentTime: 0,
  duration: saved?.currentTrack ? saved.currentTrack.duration / 1000 : 0,
  volume: saved?.volume ?? 0.7,
  isMuted: false,
  playMode: loadPlayMode(),

  playlist: saved?.playlist || [],
  currentIndex: saved?.currentIndex ?? -1,
  playQueue: saved?.playQueue || [],

  playSource: saved?.playSource || null,
  lyrics: null,
  currentLyricIndex: -1,

  setCurrentTrack: (track) => {
    set({ currentTrack: track, currentTime: 0, duration: track ? track.duration / 1000 : 0 })
    if (track) addToHistory(track)
    persist({ currentTrack: track })
  },

  setPlaySource: (source) => {
    set({ playSource: source })
    persist({ playSource: source as any })
  },
  setPlaybackInfo: (info) => set({ playbackInfo: info }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => {
    const { isMuted, volume } = get()
    set({ isMuted: !isMuted })
  },
  setPlayMode: (mode) => {
    set({ playMode: mode })
    savePlayMode(mode)
  },
  cyclePlayMode: () => {
    const modes: PlayMode[] = ['sequence', 'loop', 'shuffle', 'single']
    const { playMode } = get()
    const newMode = modes[(modes.indexOf(playMode) + 1) % modes.length]
    set({ playMode: newMode })
    savePlayMode(newMode)
  },

  setPlaylist: (tracks, startIndex = 0) => {
    set({ playlist: tracks, currentIndex: startIndex, playQueue: [] })
    persist({ playlist: tracks, currentIndex: startIndex })
  },

  // "Play Next" - insert at front of playQueue, deduplicate
  addToPlayQueue: (track: Track) => {
    const { playQueue } = get()
    const filtered = playQueue.filter(t => !(t.id === track.id && t.source === track.source))
    filtered.unshift(track)
    set({ playQueue: filtered })
    persist({ playQueue: filtered })
  },

  clearPlayQueue: () => {
    set({ playQueue: [] })
    persist({ playQueue: [] })
  },

  removeFromPlayQueue: (index: number) => {
    const { playQueue } = get()
    const newQueue = playQueue.filter((_, i) => i !== index)
    set({ playQueue: newQueue })
    persist({ playQueue: newQueue })
  },

  // Get next track without advancing
  getNextTrack: () => {
    const { playQueue, playlist, currentIndex, playMode } = get()

    // Priority 1: playQueue
    if (playQueue.length > 0) {
      return playQueue[0]
    }

    // Priority 2: playlist
    if (playlist.length === 0) return null

    if (playMode === 'single') return playlist[currentIndex] || playlist[0]
    if (playMode === 'shuffle') return playlist[Math.floor(Math.random() * playlist.length)]

    const nextIndex = (currentIndex + 1) % playlist.length
    return playlist[nextIndex]
  },

  getPrevTrack: () => {
    const { playlist, currentIndex, playMode } = get()
    if (playlist.length === 0) return null

    if (playMode === 'single') return playlist[currentIndex] || playlist[0]
    if (playMode === 'shuffle') return playlist[Math.floor(Math.random() * playlist.length)]

    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    return playlist[prevIndex]
  },

  // Consume next track (advance state)
  advanceToNext: () => {
    const { playQueue, playlist, currentIndex, playMode } = get()

    // Priority 1: consume from playQueue
    if (playQueue.length > 0) {
      const nextTrack = playQueue[0]
      const remaining = playQueue.slice(1)
      set({ playQueue: remaining, currentTrack: nextTrack, currentTime: 0, duration: nextTrack.duration / 1000 })
      addToHistory(nextTrack)
      persist({ playQueue: remaining })
      return nextTrack
    }

    // Priority 2: advance in playlist
    if (playlist.length === 0) return null

    let nextIndex: number
    if (playMode === 'single') {
      nextIndex = currentIndex
    } else if (playMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else {
      nextIndex = (currentIndex + 1) % playlist.length
    }

    const nextTrack = playlist[nextIndex]
    set({ currentIndex: nextIndex, currentTrack: nextTrack, currentTime: 0, duration: nextTrack.duration / 1000 })
    addToHistory(nextTrack)
    persist({ currentIndex: nextIndex })
    return nextTrack
  },

  advanceToPrev: () => {
    const { playlist, currentIndex, playMode } = get()
    if (playlist.length === 0) return null

    let prevIndex: number
    if (playMode === 'single') {
      prevIndex = currentIndex
    } else if (playMode === 'shuffle') {
      prevIndex = Math.floor(Math.random() * playlist.length)
    } else {
      prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    }

    const prevTrack = playlist[prevIndex]
    set({ currentIndex: prevIndex, currentTrack: prevTrack, currentTime: 0, duration: prevTrack.duration / 1000 })
    addToHistory(prevTrack)
    persist({ currentIndex: prevIndex })
    return prevTrack
  },

  setLyrics: (lyrics) => set({ lyrics, currentLyricIndex: -1 }),
  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),

  stopAndClear: () => {
    set({
      currentTrack: null,
      playbackInfo: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playlist: [],
      currentIndex: -1,
      playQueue: [],
      lyrics: null,
      currentLyricIndex: -1
    })
    localStorage.removeItem('playbackState')
  }
}))
