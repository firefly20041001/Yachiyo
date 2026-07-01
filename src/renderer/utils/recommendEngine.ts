// Recommendation engine based on user listening behavior

import { Track } from '@shared/types/streaming'
import { UserProfile, loadProfile, loadEvents } from './listeningBehavior'

interface ScoredTrack {
  track: Track
  score: number
}

// Score a track based on user profile
function scoreTrack(track: Track, profile: UserProfile): number {
  let score = 0

  // Artist match scoring
  for (const artist of track.artists) {
    const weight = profile.artistWeights[artist] || 0
    if (weight > 0) {
      score += weight * 2 // Positive weight = liked artist
    }
  }

  // Add small random factor for exploration (0-10)
  score += Math.random() * 10

  return score
}

// Filter out recently played tracks (avoid repetition)
function filterRecentTracks(tracks: Track[], count: number): Track[] {
  const events = loadEvents()
  const recentIds = new Set(
    events
      .slice(-100) // Last 100 plays
      .map(e => e.songId)
  )

  // Prefer tracks not recently played
  const notRecent = tracks.filter(t => !recentIds.has(t.id))
  const recent = tracks.filter(t => recentIds.has(t.id))

  // If we have enough non-recent tracks, use those
  if (notRecent.length >= count) {
    return notRecent
  }

  // Otherwise mix in some recent ones
  return [...notRecent, ...recent.slice(0, count - notRecent.length)]
}

// Main recommendation function
export function generateRecommendations(
  candidateTracks: Track[],
  limit: number = 30
): Track[] {
  const profile = loadProfile()

  if (candidateTracks.length === 0) return []

  // If user has no listening history, return random selection
  if (profile.totalEvents < 5) {
    const shuffled = [...candidateTracks].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, limit)
  }

  // Filter out recently played
  const filtered = filterRecentTracks(candidateTracks, limit * 2)

  // Score each track
  const scored: ScoredTrack[] = filtered.map(track => ({
    track,
    score: scoreTrack(track, profile)
  }))

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Take top N
  const recommended = scored.slice(0, limit).map(s => s.track)

  // Shuffle slightly to avoid same order every time
  for (let i = recommended.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [recommended[i], recommended[j]] = [recommended[j], recommended[i]]
  }

  return recommended
}
