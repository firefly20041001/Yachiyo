import { useCallback } from 'react'
import { usePlaybackStore } from '../stores/playbackStore'
import { Track } from '@shared/types/streaming'
import { playTrack, playSingleTrack, playQueue, playFromList, togglePlay as toggle, pause as pauseAudio, seek as seekAudio, setVolume as setVol, nextTrack as next, prevTrack as prev } from '../utils/audio'

export function usePlayback() {
  const store = usePlaybackStore()

  // Single track click - shows VIP alert
  const playTrackFn = useCallback(async (track: Track) => {
    await playSingleTrack(track)
  }, [])

  // Click a track in a list - shows VIP alert
  const playFromListFn = useCallback(async (tracks: Track[], startIndex = 0) => {
    await playFromList(tracks, startIndex)
  }, [])

  // Play all button - skips VIP silently
  const playQueueFn = useCallback(async (tracks: Track[], startIndex = 0) => {
    await playQueue(tracks, startIndex)
  }, [])

  const togglePlay = useCallback(() => { toggle() }, [])
  const pause = useCallback(() => { pauseAudio() }, [])
  const seek = useCallback((time: number) => { seekAudio(time) }, [])
  const setVolume = useCallback((v: number) => { setVol(v) }, [])
  const nextTrack = useCallback(() => { next() }, [])
  const prevTrack = useCallback(() => { prev() }, [])

  return {
    ...store,
    playTrack: playTrackFn,
    playQueue: playFromListFn, // Default for list clicks
    playAll: playQueueFn,      // For "play all" buttons
    togglePlay,
    pause,
    seek,
    setVolume,
    nextTrack,
    prevTrack
  }
}
