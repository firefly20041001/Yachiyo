import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Trash2, Music } from 'lucide-react'
import { Track } from '@shared/types/streaming'
import { GlassPanel } from '../components/common/GlassPanel'
import { TrackList } from '../components/common/TrackList'
import { usePlayback } from '../hooks/usePlayback'

interface HistoryEntry {
  track: Track
  playedAt: number
}

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const { playQueue } = usePlayback()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('playHistory') || '[]') as HistoryEntry[]
      // Deduplicate: keep only the latest play for each track
      const seen = new Map<string, HistoryEntry>()
      for (const entry of saved) {
        const key = `${entry.track.source}-${entry.track.id}`
        if (!seen.has(key)) {
          seen.set(key, entry)
        }
      }
      const deduped = Array.from(seen.values()).sort((a, b) => b.playedAt - a.playedAt)
      setHistory(deduped)
    } catch {
      setHistory([])
    }
  }

  const clearHistory = () => {
    localStorage.removeItem('playHistory')
    setHistory([])
  }

  const tracks = history.map((h) => h.track)

  return (
    <div className="page history-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>播放历史</h1>
        <div className="page-header-actions">
          {history.length > 0 && (
            <button className="btn btn-ghost" onClick={clearHistory}>
              <Trash2 size={16} />
              清空历史
            </button>
          )}
        </div>
      </motion.div>

      {history.length === 0 ? (
        <GlassPanel intensity="light" className="empty-state">
          <Clock size={48} />
          <h3>暂无播放历史</h3>
          <p>播放歌曲后会自动记录在这里</p>
        </GlassPanel>
      ) : (
        <div>
          <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
            共 {history.length} 首歌曲
          </p>
          <TrackList
            tracks={tracks}
            onPlay={(track, index) => playQueue(tracks, index)}
          />
        </div>
      )}
    </div>
  )
}
