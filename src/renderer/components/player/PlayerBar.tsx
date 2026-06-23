import React, { useState, useRef, useEffect } from 'react'
import { ListMusic, Music, X, ListPlus, Check, Trash2 } from 'lucide-react'
import { stopAndClear } from '../../utils/audio'
import { usePlaybackStore } from '../../stores/playbackStore'
import { usePlaylistStore } from '../../stores/playlistStore'
import { PlayerControls } from './PlayerControls'
import { ProgressBar } from './ProgressBar'
import { VolumeControl } from './VolumeControl'
import { usePlayback } from '../../hooks/usePlayback'
import { FullScreenLyrics } from '../lyrics/FullScreenLyrics'
import { Track } from '@shared/types/streaming'

export function PlayerBar() {
  const currentTrack = usePlaybackStore((s) => s.currentTrack)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const duration = usePlaybackStore((s) => s.duration)
  const volume = usePlaybackStore((s) => s.volume)
  const isMuted = usePlaybackStore((s) => s.isMuted)
  const playlist = usePlaybackStore((s) => s.playlist)
  const currentIndex = usePlaybackStore((s) => s.currentIndex)
  const playQueue = usePlaybackStore((s) => s.playQueue)
  const playlists = usePlaylistStore((s) => s.playlists)
  const { togglePlay, nextTrack, prevTrack, seek, setVolume, toggleMute, playTrack } = usePlayback()
  const [showLyrics, setShowLyrics] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [menuTrack, setMenuTrack] = useState<Track | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)
  const queueListRef = useRef<HTMLDivElement>(null)

  // Combine playQueue + playlist for display
  const displayQueue = [...playQueue, ...playlist]
  const activeIndex = playQueue.length > 0 ? 0 : currentIndex

  useEffect(() => {
    if (showQueue && queueListRef.current) {
      const activeItem = queueListRef.current.querySelector('.queue-item-active')
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [showQueue])

  const handlePlayQueueTrack = async (index: number) => {
    const track = displayQueue[index]
    if (track) {
      await playTrack(track)
    }
  }

  const handleAddToPlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!menuTrack) return
    await window.api.playlist.addTrack(playlistId, menuTrack)
    setAddedId(playlistId)
    setTimeout(() => { setAddedId(null); setMenuTrack(null) }, 600)
  }

  return (
    <>
      <div className="player-bar">
        <div className="player-bar-glass" />
        <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
        <div className="player-bar-content">
          <div className="player-track-info" onClick={() => setShowLyrics(true)} style={{ cursor: 'pointer' }}>
            <div className="player-track-cover">
              {currentTrack?.albumCoverUrl ? (
                <img src={currentTrack.albumCoverUrl} alt="" />
              ) : (
                <div className="player-cover-placeholder"><Music size={20} /></div>
              )}
            </div>
            <div className="player-track-text">
              <div className="player-track-name">{currentTrack?.name || '未播放'}</div>
              <div className="player-track-artist">{currentTrack?.artists?.join(', ') || ''}</div>
            </div>
          </div>

          <PlayerControls onTogglePlay={togglePlay} onNext={nextTrack} onPrev={prevTrack} />

          <div className="player-right">
            <VolumeControl volume={volume} isMuted={isMuted} onVolumeChange={setVolume} onToggleMute={toggleMute} />
            <button className="player-action-btn player-lyrics-btn" onClick={() => window.api.lyricsWindow.toggle()}>词</button>
            <button className="player-action-btn" onClick={() => setShowQueue(!showQueue)}><ListMusic size={18} /></button>
          </div>
        </div>
      </div>

      <FullScreenLyrics isOpen={showLyrics} onClose={() => setShowLyrics(false)} />

      {/* Queue panel */}
      {showQueue && (
        <div className="queue-panel" onClick={() => { setShowQueue(false); setMenuTrack(null) }}>
          <div className="queue-panel-content" onClick={(e) => e.stopPropagation()}>
            <div className="queue-header">
              <h3>播放队列 ({displayQueue.length})</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => stopAndClear()}>
                  <Trash2 size={14} /> 清空
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowQueue(false)}>关闭</button>
              </div>
            </div>

            {/* Play Queue section */}
            {playQueue.length > 0 && (
              <>
                <div className="add-menu-title" style={{ padding: '8px 20px' }}>下一首播放</div>
                <div className="queue-list">
                  {playQueue.map((track, index) => (
                    <div
                      key={`pq-${track.source}-${track.id}-${index}`}
                      className="queue-item queue-item-active"
                      onClick={() => handlePlayQueueTrack(index)}
                    >
                      <span className="queue-index">{index + 1}</span>
                      <div className="queue-info">
                        <div className="queue-name">{track.name}</div>
                        <div className="queue-artist">{track.artists.join(', ')}</div>
                      </div>
                      <button
                        className="queue-remove-btn"
                        style={{ opacity: 1 }}
                        onClick={(e) => { e.stopPropagation(); usePlaybackStore.getState().removeFromPlayQueue(index) }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Playlist section */}
            {playlist.length > 0 && (
              <>
                <div className="add-menu-title" style={{ padding: '8px 20px' }}>
                  歌单 ({playlist.length})
                </div>
                <div className="queue-list" ref={queueListRef}>
                  {playlist.map((track, index) => (
                    <div
                      key={`pl-${track.source}-${track.id}-${index}`}
                      className={`queue-item ${index === currentIndex ? 'queue-item-active' : ''}`}
                      onClick={() => {
                        usePlaybackStore.getState().setPlaylist(playlist, index)
                        playTrack(track)
                      }}
                    >
                      <span className="queue-index">{index + 1}</span>
                      <div className="queue-info">
                        <div className="queue-name">{track.name}</div>
                        <div className="queue-artist">{track.artists.join(', ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {displayQueue.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <Music size={32} />
                <p>播放队列为空</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
