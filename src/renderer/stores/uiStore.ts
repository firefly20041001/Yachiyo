import { create } from 'zustand'
import { MusicSource } from '@shared/types/streaming'

export type Theme = 'dark' | 'light'
export type ViewMode = 'full' | 'mini'

interface UIState {
  theme: Theme
  viewMode: ViewMode
  sidebarCollapsed: boolean
  showLyrics: boolean
  showNowPlaying: false
  activePage: string
  searchQuery: string
  searchSource: MusicSource | null

  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setViewMode: (mode: ViewMode) => void
  toggleSidebar: () => void
  toggleLyrics: () => void
  setActivePage: (page: string) => void
  setSearchQuery: (query: string, source?: MusicSource) => void
  clearSearchQuery: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: (localStorage.getItem('theme') as Theme) || 'dark',
  viewMode: 'full',
  sidebarCollapsed: false,
  showLyrics: false,
  showNowPlaying: false,
  activePage: 'home',
  searchQuery: '',
  searchSource: null,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },

  toggleTheme: () => {
    const { theme } = get()
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    set({ theme: newTheme })
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
  setActivePage: (page) => set({ activePage: page }),
  setSearchQuery: (query, source) => set({ searchQuery: query, searchSource: source || null }),
  clearSearchQuery: () => set({ searchQuery: '', searchSource: null })
}))
