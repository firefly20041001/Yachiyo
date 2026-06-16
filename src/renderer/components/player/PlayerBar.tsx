import React, { useState } from 'react'
import { ListMusic, Music, X } from 'lucide-react'
import { usePlaybackStore } from '../../stores/playbackStore'
import { PlayerControls } from './PlayerControls'
import { ProgressBar } from './ProgressBar'
import { VolumeControl } from './VolumeControl'
import { usePlayback } from '../../hooks/usePlayback'
import { FullScreenLyrics } from '../lyrics/FullScreenLyrics'

export function PlayerBar() {
  const currentTrack = usePlaybackStore((s) => s.currentTrack)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const duration = usePlaybackStore((s) => s.duration)
  const volume = usePlaybackStore((s) => s.volume)
  const isMuted = usePlaybackStore((s) => s.isMuted)
  const queue = usePlaybackStore((s) => s.queue)
  const queueIndex = usePlaybackStore((s) => s.queueIndex)
  const { togglePlay, nextTrack, prevTrack, seek, setVolume, toggleMute, playTrack } = usePlayback()
  const [showLyrics, setShowLyrics] = useState(false)
  const [showQueue, setShowQueue] = useState(false)

  const handlePlayQueueTrack = async (index: number) => {
    const track = queue[index]
    if (track) {
      usePlaybackStore.getState().setQueue(queue, index)
      await playTrack(track)
    }
  }

  const handleRemoveFromQueue = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    usePlaybackStore.getState().removeFromQueue(index)
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
                <img src={currentTrack.albumCoverUrl} alt={currentTrack.albumName} />
              ) : (
                <div className="player-cover-placeholder"><Music size={20} /></div>
              )}
            </div>
            <div className="player-track-text">
              <div className="player-track-name">{currentTrack?.name || '未播放'}</div>
              <div className="player-track-artist">{currentTrack?.artists?.join(', ') || '选择一首歌曲'}</div>
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

      {showQueue && (
        <div className="queue-panel" onClick={() => setShowQueue(false)}>
          <div className="queue-panel-content" onClick={(e) => e.stopPropagation()}>
            <div className="queue-header">
              <h3>播放队列 ({queue.length})</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowQueue(false)}>关闭</button>
            </div>
            <div className="queue-list">
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
                  <button className="queue-remove-btn" onClick={(e) => handleRemoveFromQueue(e, index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
