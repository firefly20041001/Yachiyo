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
  const queue = usePlaybackStore((s) => s.queue)
  const queueIndex = usePlaybackStore((s) => s.queueIndex)
  const playlists = usePlaylistStore((s) => s.playlists)
  const { togglePlay, nextTrack, prevTrack, seek, setVolume, toggleMute, playTrack } = usePlayback()
  const [showLyrics, setShowLyrics] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [menuTrack, setMenuTrack] = useState<Track | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)
  const queueListRef = useRef<HTMLDivElement>(null)

  // Scroll to current track when queue opens
  useEffect(() => {
    if (showQueue && queueListRef.current) {
      const activeItem = queueListRef.current.querySelector('.queue-item-active')
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [showQueue])

  const handlePlayQueueTrack = async (index: number) => {
    const track = queue[index]
    if (track) {
      usePlaybackStore.getState().setQueue(queue, index)
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
              <h3>播放队列 ({queue.length})</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                {queue.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => stopAndClear()}>
                    <Trash2 size={14} /> 清空
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setShowQueue(false)}>关闭</button>
              </div>
            </div>
            <div className="queue-list" ref={queueListRef}>
              {queue.map((track, index) => (
                <div
                  key={`${track.source}-${track.id}-${index}`}
                  className={`queue-item ${index === queueIndex ? 'queue-item-active' : ''}`}
                  onClick={() => handlePlayQueueTrack(index)}
                >
                  <span className="queue-index">{index + 1}</span>
                  <div className="queue-info">
                    <div className="queue-name">{track.name}</div>
                    <div className="queue-artist">{track.artists.join(', ')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center', position: 'relative' }}>
                    <button
                      className="queue-remove-btn"
                      style={{ opacity: 1 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuTrack(menuTrack?.id === track.id ? null : track)
                      }}
                    >
                      <ListPlus size={14} />
                    </button>
                    <button
                      className="queue-remove-btn"
                      onClick={(e) => { e.stopPropagation(); usePlaybackStore.getState().removeFromQueue(index) }}
                    >
                      <X size={14} />
                    </button>
                    {/* Inline add-to-playlist menu */}
                    {menuTrack?.id === track.id && menuTrack?.source === track.source && (
                      <div className="add-to-playlist-menu" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100 }}
                        onClick={(ev) => ev.stopPropagation()}>
                        <div className="add-menu-title">添加到歌单</div>
                        {playlists.length === 0 ? (
                          <div className="add-menu-empty">暂无歌单</div>
                        ) : (
                          playlists.map((p) => (
                            <button key={p.id} className="add-menu-item" onClick={(e) => handleAddToPlaylist(p.id, e)}>
                              {addedId === p.id ? <><Check size={14} /> 已添加</> : p.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
