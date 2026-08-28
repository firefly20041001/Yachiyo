import { create } from 'zustand'
import { SyncedPlaylist } from '@shared/types/playlist'

interface PlaylistState {
  playlists: SyncedPlaylist[]
  currentPlaylist: SyncedPlaylist | null
  isLoading: boolean

  setPlaylists: (playlists: SyncedPlaylist[]) => void
  setCurrentPlaylist: (playlist: SyncedPlaylist | null) => void
  setLoading: (loading: boolean) => void
  refreshPlaylists: () => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  playlists: [],
  currentPlaylist: null,
  isLoading: false,

  setPlaylists: (playlists) => set({ playlists }),
  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
  setLoading: (loading) => set({ isLoading: loading }),

  refreshPlaylists: async () => {
    set({ isLoading: true })
    try {
      const playlists = await window.api.playlist.getAll()
      set({ playlists })
    } catch (err) {
      console.error('Failed to refresh playlists:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  deletePlaylist: async (id) => {
    try {
      await window.api.playlist.delete(id)
      set((state) => ({
        playlists: state.playlists.filter((p) => p.id !== id)
      }))
    } catch (err) {
      console.error('Failed to delete playlist:', err)
    }
  }
}))
