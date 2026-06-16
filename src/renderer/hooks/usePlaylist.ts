import { usePlaylistStore } from '../stores/playlistStore'

export function usePlaylist() {
  const store = usePlaylistStore()

  return {
    ...store
  }
}
