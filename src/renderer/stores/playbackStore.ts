import { create } from 'zustand'
import { Track, PlaybackInfo, QualityLevel } from '@shared/types/streaming'
import { Lyrics } from '@shared/types/lyrics'

export type PlayMode = 'sequence' | 'loop' | 'shuffle' | 'single'

export interface SessionData {
  currentTrack: Track | null
  playlist: Track[]
  currentIndex: number
  playQueue: Track[]
  currentTime: number
  volume: number
  playMode: PlayMode
  outputDevice: string
  quality: QualityLevel
  timestamp: number
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
  playlist: Track[]
  currentIndex: number
  playQueue: Track[]
  playSource: { page: string; id?: string } | null
  lyrics: Lyrics | null
  currentLyricIndex: number
  quality: QualityLevel

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
  setQuality: (quality: QualityLevel) => void
  stopAndClear: () => void
  saveSession: () => void
}

// ---- Session Persistence ----

const SESSION_KEY = 'yachiyo_session'
const HISTORY_KEY = 'playHistory'
let sessionDirty = false

function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SessionData
    if (!data.currentTrack) return null
    if (Date.now() - (data.timestamp || 0) > 7 * 24 * 60 * 60 * 1000) return null
    return data
  } catch {
    return null
  }
}

function saveSessionData(data: Partial<SessionData>) {
  try {
    const existing = loadSession() || {} as SessionData
    const merged: SessionData = {
      currentTrack: data.currentTrack !== undefined ? data.currentTrack : existing.currentTrack,
      playlist: data.playlist !== undefined ? data.playlist : (existing.playlist || []),
      currentIndex: data.currentIndex !== undefined ? data.currentIndex : (existing.currentIndex ?? -1),
      playQueue: data.playQueue !== undefined ? data.playQueue : (existing.playQueue || []),
      currentTime: data.currentTime !== undefined ? data.currentTime : (existing.currentTime || 0),
      volume: data.volume !== undefined ? data.volume : (existing.volume ?? 0.7),
      playMode: data.playMode !== undefined ? data.playMode : (existing.playMode || 'sequence'),
      outputDevice: data.outputDevice !== undefined ? data.outputDevice : (existing.outputDevice || 'default'),
      quality: data.quality !== undefined ? data.quality : (existing.quality || 'standard'),
      timestamp: Date.now()
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(merged))
    sessionDirty = false
  } catch {}
}

function saveCurrentSession(get: () => PlaybackState) {
  const s = get()
  saveSessionData({
    currentTrack: s.currentTrack,
    playlist: s.playlist,
    currentIndex: s.currentIndex,
    playQueue: s.playQueue,
    currentTime: s.currentTime,
    volume: s.volume,
    playMode: s.playMode,
    quality: s.quality
  })
}

function markDirty() {
  sessionDirty = true
}

function addToHistory(track: Track) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as Array<{ track: Track; playedAt: number }>
    const filtered = history.filter(h => !(h.track.id === track.id && h.track.source === track.source))
    filtered.unshift({ track, playedAt: Date.now() })
    if (filtered.length > 100) filtered.length = 100
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
  } catch {}
}

// ---- Auto-save (only when dirty) ----

let autoSaveTimer: ReturnType<typeof setInterval> | null = null

function startAutoSave() {
  if (autoSaveTimer) return
  autoSaveTimer = setInterval(() => {
    if (!sessionDirty) return
    saveCurrentSession(usePlaybackStore.getState)
  }, 10000)
}

function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// ---- Store ----

const saved = loadSession()

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  currentTrack: saved?.currentTrack || null,
  playbackInfo: null,
  isPlaying: false,
  currentTime: saved?.currentTime || 0,
  duration: saved?.currentTrack ? saved.currentTrack.duration / 1000 : 0,
  volume: saved?.volume ?? 0.7,
  isMuted: false,
  playMode: saved?.playMode || 'sequence',
  playlist: saved?.playlist || [],
  currentIndex: saved?.currentIndex ?? -1,
  playQueue: saved?.playQueue || [],
  playSource: null,
  lyrics: null,
  currentLyricIndex: -1,
  quality: saved?.quality || 'standard',

  setCurrentTrack: (track) => {
    set({ currentTrack: track, currentTime: 0, duration: track ? track.duration / 1000 : 0 })
    if (track) addToHistory(track)
    markDirty()
    saveCurrentSession(get)
  },

  setPlaySource: (source) => set({ playSource: source }),
  setPlaybackInfo: (info) => set({ playbackInfo: info }),
  setIsPlaying: (playing) => {
    set({ isPlaying: playing })
    if (!playing) {
      markDirty()
      saveCurrentSession(get)
    }
  },
  setCurrentTime: (time) => {
    set({ currentTime: time })
  },
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => {
    const audio = getAudio()
    audio.volume = volume
    set({ volume, isMuted: volume === 0 })
    markDirty()
  },
  toggleMute: () => {
    const { isMuted, volume } = get()
    const audio = getAudio()
    if (isMuted) { audio.volume = volume; set({ isMuted: false }) }
    else { audio.volume = 0; set({ isMuted: true }) }
  },
  setPlayMode: (mode) => {
    set({ playMode: mode })
    markDirty()
    saveCurrentSession(get)
  },
  cyclePlayMode: () => {
    const modes: PlayMode[] = ['sequence', 'loop', 'single', 'shuffle']
    const { playMode } = get()
    const newMode = modes[(modes.indexOf(playMode) + 1) % modes.length]
    set({ playMode: newMode })
    markDirty()
    saveCurrentSession(get)
  },
  setPlaylist: (tracks, startIndex = 0) => {
    set({ playlist: tracks, currentIndex: startIndex, playQueue: [] })
    markDirty()
    saveCurrentSession(get)
  },
  addToPlayQueue: (track: Track) => {
    const { playQueue } = get()
    const filtered = playQueue.filter(t => !(t.id === track.id && t.source === track.source))
    filtered.unshift(track)
    set({ playQueue: filtered })
    markDirty()
    saveCurrentSession(get)
  },
  clearPlayQueue: () => {
    set({ playQueue: [] })
    markDirty()
    saveCurrentSession(get)
  },
  removeFromPlayQueue: (index: number) => {
    const { playQueue } = get()
    const newQueue = playQueue.filter((_, i) => i !== index)
    set({ playQueue: newQueue })
    markDirty()
    saveCurrentSession(get)
  },
  getNextTrack: () => {
    const { playQueue, playlist, currentIndex, playMode } = get()
    if (playQueue.length > 0) return playQueue[0]
    if (playlist.length === 0) return null
    if (playMode === 'single') return playlist[currentIndex] || playlist[0]
    if (playMode === 'shuffle') return playlist[Math.floor(Math.random() * playlist.length)]
    return playlist[(currentIndex + 1) % playlist.length]
  },
  getPrevTrack: () => {
    const { playlist, currentIndex, playMode } = get()
    if (playlist.length === 0) return null
    if (playMode === 'single') return playlist[currentIndex] || playlist[0]
    if (playMode === 'shuffle') return playlist[Math.floor(Math.random() * playlist.length)]
    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    return playlist[prevIndex]
  },
  advanceToNext: () => {
    const { playQueue, playlist, currentIndex, playMode } = get()
    if (playQueue.length > 0) {
      const nextTrack = playQueue[0]
      const remaining = playQueue.slice(1)
      set({ playQueue: remaining, currentTrack: nextTrack, currentTime: 0, duration: nextTrack.duration / 1000 })
      addToHistory(nextTrack)
      markDirty()
      saveCurrentSession(get)
      return nextTrack
    }
    if (playlist.length === 0) return null
    let nextIndex: number
    if (playMode === 'single') nextIndex = currentIndex
    else if (playMode === 'shuffle') nextIndex = Math.floor(Math.random() * playlist.length)
    else nextIndex = (currentIndex + 1) % playlist.length
    const nextTrack = playlist[nextIndex]
    set({ currentIndex: nextIndex, currentTrack: nextTrack, currentTime: 0, duration: nextTrack.duration / 1000 })
    addToHistory(nextTrack)
    markDirty()
    saveCurrentSession(get)
    return nextTrack
  },
  advanceToPrev: () => {
    const { playlist, currentIndex, playMode } = get()
    if (playlist.length === 0) return null
    let prevIndex: number
    if (playMode === 'single') prevIndex = currentIndex
    else if (playMode === 'shuffle') prevIndex = Math.floor(Math.random() * playlist.length)
    else prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    const prevTrack = playlist[prevIndex]
    set({ currentIndex: prevIndex, currentTrack: prevTrack, currentTime: 0, duration: prevTrack.duration / 1000 })
    addToHistory(prevTrack)
    markDirty()
    saveCurrentSession(get)
    return prevTrack
  },
  setQuality: (quality) => {
    set({ quality })
    markDirty()
    saveCurrentSession(get)
  },
  setLyrics: (lyrics) => set({ lyrics, currentLyricIndex: -1 }),
  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),
  stopAndClear: () => {
    stopAutoSave()
    set({
      currentTrack: null, playbackInfo: null, isPlaying: false,
      currentTime: 0, duration: 0, playlist: [], currentIndex: -1,
      playQueue: [], lyrics: null, currentLyricIndex: 0
    })
    localStorage.removeItem(SESSION_KEY)
    sessionDirty = false
  },
  saveSession: () => saveCurrentSession(get)
}))

// Start auto-save when store is created
startAutoSave()

// Helper to get audio element
function getAudio() {
  return (window as any).__audioElement || new Audio()
}

// Save on app exit
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    saveCurrentSession(usePlaybackStore.getState)
  })
}
