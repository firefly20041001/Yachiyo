export interface ListeningEvent {
  songId: string
  source: string
  songName: string
  artists: string[]
  completed: boolean
  skipped: boolean
  duration: number
  totalDuration: number
  timestamp: number
}

export interface UserProfile {
  artistWeights: Record<string, number>
  totalEvents: number
  lastUpdated: number
}