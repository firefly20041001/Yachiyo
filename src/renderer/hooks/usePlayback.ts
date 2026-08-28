import { useCallback } from 'react'
import { usePlaybackStore } from '../stores/playbackStore'
import { Track } from '@shared/types/streaming'
import { playSingleTrack, playFromList, playQueue, togglePlay, pause, seek, setVolume, nextTrack, prevTrack, addToPlayQueue, stopAndClear } from '../utils/audio'

export function usePlayback() {
  const store = usePlaybackStore()

  const playTrackFn = useCallback(async (track: Track, source?: { page: string; id?: string }) => {
    playSingleTrack(track, source)
  }, [])

  const playFromListFn = useCallback(async (tracks: Track[], startIndex = 0, source?: { page: string; id?: string }) => {
    playFromList(tracks, startIndex, source)
  }, [])

  const playQueueFn = useCallback(async (tracks: Track[], startIndex = 0, source?: { page: string; id?: string }) => {
    playQueue(tracks, startIndex, source)
  }, [])

  const togglePlayFn = useCallback(() => togglePlay(), [])
  const pauseFn = useCallback(() => pause(), [])
  const seekFn = useCallback((time: number) => seek(time), [])
  const setVolumeFn = useCallback((v: number) => setVolume(v), [])
  const nextTrackFn = useCallback(() => nextTrack(), [])
  const prevTrackFn = useCallback(() => prevTrack(), [])
  const addToPlayQueueFn = useCallback((track: Track) => addToPlayQueue(track), [])
  const stopAndClearFn = useCallback(() => stopAndClear(), [])

  return {
    ...store,
    playTrack: playTrackFn,
    playQueue: playFromListFn,
    playAll: playQueueFn,
    togglePlay: togglePlayFn,
    pause: pauseFn,
    seek: seekFn,
    setVolume: setVolumeFn,
    nextTrack: nextTrackFn,
    prevTrack: prevTrackFn,
    addToPlayQueue: addToPlayQueueFn,
    stopAndClear: stopAndClearFn
  }
}
