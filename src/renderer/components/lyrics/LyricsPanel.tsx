import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { usePlaybackStore } from '../../stores/playbackStore'
import { useUIStore } from '../../stores/uiStore'

export function LyricsPanel() {
  const lyrics = usePlaybackStore((s) => s.lyrics)
  const currentTrack = usePlaybackStore((s) => s.currentTrack)
  const currentLyricIndex = usePlaybackStore((s) => s.currentLyricIndex)
  const { showLyrics, toggleLyrics } = useUIStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current lyric
  useEffect(() => {
    if (!containerRef.current || currentLyricIndex < 0) return

    const lineEl = containerRef.current.children[currentLyricIndex] as HTMLElement
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentLyricIndex])

  return (
    <AnimatePresence>
      {showLyrics && (
        <motion.div
          className="lyrics-panel"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="lyrics-panel-glass" />
          <div className="lyrics-header">
            <h3>歌词</h3>
            <button className="lyrics-close" onClick={toggleLyrics}>
              <X size={20} />
            </button>
          </div>

          {currentTrack && (
            <div className="lyrics-track-info">
              <div className="lyrics-track-name">{currentTrack.name}</div>
              <div className="lyrics-track-artist">{currentTrack.artists.join(', ')}</div>
            </div>
          )}

          <div className="lyrics-content" ref={containerRef}>
            {lyrics?.lines.length ? (
              lyrics.lines.map((line, index) => (
                <motion.div
                  key={index}
                  className={`lyrics-line ${index === currentLyricIndex ? 'lyrics-line-active' : ''}`}
                  initial={{ opacity: 0.4 }}
                  animate={{
                    opacity: index === currentLyricIndex ? 1 : 0.4,
                    scale: index === currentLyricIndex ? 1.05 : 1
                  }}
                >
                  <div className="lyrics-text">{line.text}</div>
                  {line.translation && <div className="lyrics-translation">{line.translation}</div>}
                </motion.div>
              ))
            ) : (
              <div className="lyrics-empty">
                <p>暂无歌词</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
