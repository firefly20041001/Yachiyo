import { Track } from '@shared/types/streaming'
import { ListeningEvent, UserProfile } from '@shared/types/listening'

export { type ListeningEvent, type UserProfile } from '@shared/types/listening'

// ---- Behavior Tracking ----

export async function saveListeningEvent(event: ListeningEvent): Promise<void> {
  await window.api.listening.addEvent(event)
  await rebuildProfile()
}

export async function loadEvents(): Promise<ListeningEvent[]> {
  return window.api.listening.getEvents()
}

// ---- Profile Building ----

export async function loadProfile(): Promise<UserProfile> {
  const profile = await window.api.listening.getProfile()
  return profile || { artistWeights: {}, totalEvents: 0, lastUpdated: 0 }
}

async function rebuildProfile(): Promise<void> {
  const events = await loadEvents()
  if (events.length === 0) return

  const artistWeights: Record<string, number> = {}

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

    for (const artist of event.artists) {
      artistWeights[artist] = (artistWeights[artist] || 0) + weight
    }
  }

  await window.api.listening.setProfile({
    artistWeights,
    totalEvents: events.length,
    lastUpdated: Date.now()
  })
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
    completed,
    skipped,
    duration: durationMs,
    totalDuration: track.duration,
    timestamp: Date.now()
  }
}