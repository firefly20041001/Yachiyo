import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Music } from 'lucide-react'
import { usePlaybackStore } from '../../stores/playbackStore'
import { usePlayback } from '../../hooks/usePlayback'
import { PlayerControls } from '../player/PlayerControls'
import { ProgressBar } from '../player/ProgressBar'

interface FullScreenLyricsProps {
  isOpen: boolean
  onClose: () => void
}

export function FullScreenLyrics({ isOpen, onClose }: FullScreenLyricsProps) {
  const currentTrack = usePlaybackStore((s) => s.currentTrack)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const duration = usePlaybackStore((s) => s.duration)
  const lyrics = usePlaybackStore((s) => s.lyrics)
  const currentLyricIndex = usePlaybackStore((s) => s.currentLyricIndex)
  const { togglePlay, nextTrack, prevTrack, seek } = usePlayback()
  const lyricsRef = useRef<HTMLDivElement>(null)
  const lastScrollIndex = useRef(-1)

  // Auto-scroll only when index changes
  useEffect(() => {
    if (!lyricsRef.current || currentLyricIndex < 0 || currentLyricIndex === lastScrollIndex.current) return
    lastScrollIndex.current = currentLyricIndex

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const hasLyrics = lyrics && lyrics.lines.length > 0

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
          <div className="fullscreen-lyrics-bg">
            {currentTrack?.albumCoverUrl && (
              <img src={currentTrack.albumCoverUrl} alt="" className="fullscreen-lyrics-bg-img" />
            )}
            <div className="fullscreen-lyrics-bg-overlay" />
          </div>

          <button className="fullscreen-lyrics-close" onClick={onClose}>
            <ChevronDown size={28} />
          </button>

          <div className="fullscreen-lyrics-content">
            {/* Left: Album cover */}
            <div className="fullscreen-lyrics-left">
              <div
                className={`fullscreen-lyrics-cover ${isPlaying ? 'spinning' : ''}`}
              >
                {currentTrack?.albumCoverUrl ? (
                  <img src={currentTrack.albumCoverUrl} alt={currentTrack.albumName} />
                ) : (
                  <div className="fullscreen-lyrics-cover-placeholder"><Music size={64} /></div>
                )}
              </div>
              <div className="fullscreen-lyrics-track-info">
                <h2>{currentTrack?.name || '未播放'}</h2>
                <p>{currentTrack?.artists?.join(', ') || ''}</p>
              </div>
            </div>

            {/* Right: Lyrics or track info */}
            <div className="fullscreen-lyrics-right">
              {hasLyrics ? (
                <div className="fullscreen-lyrics-lines" ref={lyricsRef}>
                  {lyrics.lines.map((line, index) => (
                    <div
                      key={index}
                      className={`fullscreen-lyric-line ${index === currentLyricIndex ? 'fullscreen-lyric-active' : ''}`}
                      style={{
                        opacity: index === currentLyricIndex ? 1 : 0.3,
                        cursor: 'pointer'
                      }}
                      onClick={() => seek(line.time / 1000)}
                    >
                      <div className="fullscreen-lyric-text">{line.text}</div>
                      {line.translation && <div className="fullscreen-lyric-translation">{line.translation}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fullscreen-lyrics-empty">
                  <Music size={48} />
                  <p>{currentTrack?.name || '暂无歌词'}</p>
                  <span style={{ fontSize: 14, opacity: 0.5 }}>{currentTrack?.artists?.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="fullscreen-lyrics-bottom">
            <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
            <PlayerControls onTogglePlay={togglePlay} onNext={nextTrack} onPrev={prevTrack} variant="light" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
