import { useCallback } from 'react'
import { usePlaybackStore } from '../stores/playbackStore'
import { Track } from '@shared/types/streaming'
import { playTrack, playQueue, togglePlay as toggle, pause as pauseAudio, seek as seekAudio, setVolume as setVol, nextTrack as next, prevTrack as prev } from '../utils/audio'

export function usePlayback() {
  const store = usePlaybackStore()

  const playTrackFn = useCallback(async (track: Track) => {
    await playTrack(track)
  }, [])

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
    playQueue: playQueueFn,
    togglePlay,
    pause,
    seek,
    setVolume,
    nextTrack,
    prevTrack
  }
}
