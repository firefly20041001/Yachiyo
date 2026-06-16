import React from 'react'
import { Sidebar } from '../components/sidebar/Sidebar'
import { PlayerBar } from '../components/player/PlayerBar'
import { useUIStore } from '../stores/uiStore'

interface LayoutProps {
  children: React.ReactNode
  activePage: string
  onNavigate: (page: string) => void
}

export function Layout({ children, activePage, onNavigate }: LayoutProps) {
  return (
    <div className="app-layout">
      <div className="app-background" />

      <div className="title-bar">
        <div className="title-bar-drag" />
        <div className="title-bar-controls">
          <button className="title-btn" onClick={() => window.api.window.minimize()}>
            <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="2" fill="currentColor" /></svg>
          </button>
          <button className="title-btn" onClick={() => window.api.window.maximize()}>
            <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" stroke="currentColor" fill="none" strokeWidth="1.5" /></svg>
          </button>
          <button className="title-btn title-btn-close" onClick={() => window.api.window.close()}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        </div>
      </div>

      <div className="app-content">
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <main className="main-content">
          {children}
        </main>
      </div>

      <PlayerBar />
    </div>
  )
}
