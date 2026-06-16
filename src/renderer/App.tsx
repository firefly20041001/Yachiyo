import React, { useState, useEffect } from 'react'
import { Layout } from './app/Layout'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { LibraryPage } from './pages/LibraryPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { AccountPage } from './pages/AccountPage'
import { SettingsPage } from './pages/SettingsPage'
import { HistoryPage } from './pages/HistoryPage'
import { useAccountStore } from './stores/accountStore'
import { useUIStore } from './stores/uiStore'
import { usePlaybackStore } from './stores/playbackStore'
import { initAudio, togglePlay, nextTrack, prevTrack, setVolume } from './utils/audio'

function TrayAndShortcutHandler() {
  const currentTrack = usePlaybackStore((s) => s.currentTrack)

  useEffect(() => {
    initAudio()
  }, [])

  useEffect(() => {
    window.api.tray.onTogglePlay(() => togglePlay())
    window.api.tray.onNext(() => nextTrack())
    window.api.tray.onPrev(() => prevTrack())

    window.api.shortcuts.onTogglePlay(() => togglePlay())
    window.api.shortcuts.onNext(() => nextTrack())
    window.api.shortcuts.onPrev(() => prevTrack())
    window.api.shortcuts.onVolumeUp(() => {
      const { volume } = usePlaybackStore.getState()
      setVolume(Math.min(1, volume + 0.05))
    })
    window.api.shortcuts.onVolumeDown(() => {
      const { volume } = usePlaybackStore.getState()
      setVolume(Math.max(0, volume - 0.05))
    })
    window.api.shortcuts.onToggleLyrics(() => {
      window.api.lyricsWindow.toggle()
    })
  }, [])

  useEffect(() => {
    if (currentTrack) {
      window.api.tray.updateTrack(currentTrack.name, currentTrack.artists?.join(', ') || '')
    } else {
      window.api.tray.updateTrack('未播放', '')
    }
  }, [currentTrack])

  return null
}

export default function App() {
  const [activePage, setActivePage] = useState('home')
  const { refreshAccounts } = useAccountStore()
  const { theme } = useUIStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => { refreshAccounts() }, [])

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage onNavigate={setActivePage} />
      case 'search': return <SearchPage />
      case 'library': return <LibraryPage />
      case 'playlists': return <PlaylistPage />
      case 'history': return <HistoryPage />
      case 'account': return <AccountPage />
      case 'settings': return <SettingsPage />
      default: return <HomePage onNavigate={setActivePage} />
    }
  }

  return (
    <>
      <TrayAndShortcutHandler />
      <Layout activePage={activePage} onNavigate={setActivePage}>
        {renderPage()}
      </Layout>
    </>
  )
}
