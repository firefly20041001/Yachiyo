import { create } from 'zustand'

export type Theme = 'dark' | 'light'
export type ViewMode = 'full' | 'mini'

interface UIState {
  theme: Theme
  viewMode: ViewMode
  sidebarCollapsed: boolean
  showLyrics: boolean
  showNowPlaying: false
  activePage: string

  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setViewMode: (mode: ViewMode) => void
  toggleSidebar: () => void
  toggleLyrics: () => void
  setActivePage: (page: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: (localStorage.getItem('theme') as Theme) || 'dark',
  viewMode: 'full',
  sidebarCollapsed: false,
  showLyrics: false,
  showNowPlaying: false,
  activePage: 'home',

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
  setActivePage: (page) => set({ activePage: page })
}))
