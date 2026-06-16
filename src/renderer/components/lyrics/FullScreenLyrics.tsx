import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Music } from 'lucide-react'
import { usePlaybackStore } from '../../stores/playbackStore'
import { usePlayback } from '../../hooks/usePlayback'
import { PlayerControls } from '../player/PlayerControls'
import { ProgressBar } from '../player/ProgressBar'

interface FullScreenLyricsProps {
  isOpen: boolean
  onClose: () => void
}

export function FullScreenLyrics({ isOpen, onClose }: FullScreenLyricsProps) {
  const { currentTrack, isPlaying, currentTime, duration, lyrics, currentLyricIndex } = usePlaybackStore()
  const { togglePlay, nextTrack, prevTrack, seek } = usePlayback()
  const lyricsRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current lyric
  useEffect(() => {
    if (!lyricsRef.current || currentLyricIndex < 0) return
    const container = lyricsRef.current
    const lineEl = container.children[currentLyricIndex] as HTMLElement
    if (lineEl) {
      const containerHeight = container.clientHeight
      const lineTop = lineEl.offsetTop
      const lineHeight = lineEl.offsetHeight
      const scrollTo = lineTop - containerHeight / 2 + lineHeight / 2
      container.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' })
    }
  }, [currentLyricIndex])

  // Find current lyric index based on time
  useEffect(() => {
    if (!lyrics?.lines.length) return
    let index = -1
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (lyrics.lines[i].time <= currentTime * 1000) {
        index = i
      }
    }
    usePlaybackStore.getState().setCurrentLyricIndex(index)
  }, [currentTime, lyrics])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fullscreen-lyrics"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Background blur with album art */}
          <div className="fullscreen-lyrics-bg">
            {currentTrack?.albumCoverUrl && (
              <img src={currentTrack.albumCoverUrl} alt="" className="fullscreen-lyrics-bg-img" />
            )}
            <div className="fullscreen-lyrics-bg-overlay" />
          </div>

          {/* Close button */}
          <button className="fullscreen-lyrics-close" onClick={onClose}>
            <ChevronDown size={28} />
          </button>

          <div className="fullscreen-lyrics-content">
            {/* Left: Album cover */}
            <div className="fullscreen-lyrics-left">
              <motion.div
                className="fullscreen-lyrics-cover"
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                {currentTrack?.albumCoverUrl ? (
                  <img src={currentTrack.albumCoverUrl} alt={currentTrack.albumName} />
                ) : (
                  <div className="fullscreen-lyrics-cover-placeholder">
                    <Music size={64} />
                  </div>
                )}
              </motion.div>
              <div className="fullscreen-lyrics-track-info">
                <h2>{currentTrack?.name || '未播放'}</h2>
                <p>{currentTrack?.artists?.join(', ') || ''}</p>
              </div>
            </div>

            {/* Right: Lyrics */}
            <div className="fullscreen-lyrics-right">
              <div className="fullscreen-lyrics-lines" ref={lyricsRef}>
                {lyrics?.lines.length ? (
                  lyrics.lines.map((line, index) => (
                    <motion.div
                      key={index}
                      className={`fullscreen-lyric-line ${index === currentLyricIndex ? 'fullscreen-lyric-active' : ''}`}
                      animate={{
                        opacity: index === currentLyricIndex ? 1 : 0.3,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{ cursor: 'pointer' }}
                      onClick={() => seek(line.time / 1000)}
                    >
                      <div className="fullscreen-lyric-text">{line.text}</div>
                      {line.translation && (
                        <div className="fullscreen-lyric-translation">{line.translation}</div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="fullscreen-lyrics-empty">
                    <Music size={48} />
                    <p>暂无歌词</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: Player controls */}
          <div className="fullscreen-lyrics-bottom">
            <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
            <PlayerControls onTogglePlay={togglePlay} onNext={nextTrack} onPrev={prevTrack} variant="light" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
