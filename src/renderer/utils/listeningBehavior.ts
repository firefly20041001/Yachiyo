// User listening behavior tracking and profile building

import { Track } from '@shared/types/streaming'

export interface ListeningEvent {
  songId: string
  source: string
  songName: string
  artists: string[]
  genre: string // extracted or empty
  completed: boolean // played to end
  skipped: boolean // user skipped
  duration: number // ms played
  totalDuration: number // total track duration
  timestamp: number
}

export interface UserProfile {
  artistWeights: Record<string, number> // artist name -> weight
  genreWeights: Record<string, number> // genre -> weight
  totalEvents: number
  lastUpdated: number
}

const STORAGE_KEY = 'yachiyo_listening_data'
const PROFILE_KEY = 'yachiyo_user_profile'

// ---- Behavior Tracking ----

export function saveListeningEvent(event: ListeningEvent): void {
  try {
    const events = loadEvents()
    events.push(event)
    // Keep last 2000 events
    if (events.length > 2000) events.splice(0, events.length - 2000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    // Rebuild profile after each event
    rebuildProfile()
  } catch {}
}

export function loadEvents(): ListeningEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ---- Profile Building ----

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { artistWeights: {}, genreWeights: {}, totalEvents: 0, lastUpdated: 0 }
}

function rebuildProfile(): void {
  const events = loadEvents()
  if (events.length === 0) return

  const artistWeights: Record<string, number> = {}
  const genreWeights: Record<string, number> = {}

  for (const event of events) {
    // Weight calculation:
    // - Completed play: weight 3
    // - Partial play (>50%): weight 1
    // - Skipped: weight -1
    let weight = 0
    if (event.completed) {
      weight = 3
    } else if (event.skipped) {
      weight = -1
    } else if (event.totalDuration > 0 && event.duration / event.totalDuration > 0.5) {
      weight = 1
    }

    // Artist weights
    for (const artist of event.artists) {
      artistWeights[artist] = (artistWeights[artist] || 0) + weight
    }

    // Genre weight
    if (event.genre) {
      genreWeights[event.genre] = (genreWeights[event.genre] || 0) + weight
    }
  }

  const profile: UserProfile = {
    artistWeights,
    genreWeights,
    totalEvents: events.length,
    lastUpdated: Date.now()
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

// ---- Helpers ----

export function createListeningEvent(
  track: Track,
  completed: boolean,
  skipped: boolean,
  durationMs: number
): ListeningEvent {
  return {
    songId: track.id,
    source: track.source,
    songName: track.name,
    artists: track.artists,
    genre: '', // We don't have genre data from the API, can be extended
    completed,
    skipped,
    duration: durationMs,
    totalDuration: track.duration,
    timestamp: Date.now()
  }
}
