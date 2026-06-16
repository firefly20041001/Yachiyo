import React, { useState } from 'react'
import { Play, Trash2, ListPlus, Check } from 'lucide-react'
import { Track } from '@shared/types/streaming'
import { SourceBadge } from './SourceBadge'
import { usePlaybackStore } from '../../stores/playbackStore'
import { usePlaylistStore } from '../../stores/playlistStore'

interface TrackItemProps {
  track: Track
  index: number
  onPlay: (track: Track) => void
  onDelete?: (track: Track) => void
  showIndex?: boolean
  showSource?: boolean
}

export function TrackItem({ track, index, onPlay, onDelete, showIndex = true, showSource = true }: TrackItemProps) {
  const currentTrack = usePlaybackStore((s) => s.currentTrack)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const isActive = currentTrack?.id === track.id && currentTrack?.source === track.source
  const playlists = usePlaylistStore((s) => s.playlists)
  const [menuOpen, setMenuOpen] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  }

  const handleAdd = async (playlistId: string) => {
    await window.api.playlist.addTrack(playlistId, track)
    setAddedId(playlistId)
    setTimeout(() => { setAddedId(null); setMenuOpen(false) }, 800)
  }

  return (
    <div className={`track-item ${isActive ? 'track-item-active' : ''}`} onClick={() => onPlay(track)}>
      <div className="track-item-index">
        {isActive && isPlaying ? (
          <div className="playing-indicator"><span /><span /><span /></div>
        ) : showIndex ? (
          <span className="track-index">{index + 1}</span>
        ) : null}
      </div>

      <div className="track-item-cover">
        {track.albumCoverUrl ? <img src={track.albumCoverUrl} alt="" /> : <div className="track-cover-placeholder" />}
        <div className="track-play-overlay"><Play size={16} fill="white" /></div>
      </div>

      <div className="track-item-info">
        <div className="track-name">{track.name}</div>
        <div className="track-artist">{track.artists.join(', ')}</div>
      </div>

      {showSource && <div className="track-item-source"><SourceBadge source={track.source} /></div>}

      <div className="track-item-album">{track.albumName}</div>
      <div className="track-item-duration">{formatDuration(track.duration)}</div>

      <div className="track-item-actions">
        <div style={{ position: 'relative' }}>
          <button
            className="track-action-btn"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
          >
            <ListPlus size={14} />
          </button>
          {menuOpen && (
            <div
              className="add-to-playlist-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="add-menu-title">添加到歌单</div>
              {playlists.length === 0 ? (
                <div className="add-menu-empty">暂无歌单，请先导入</div>
              ) : (
                playlists.map((p) => (
                  <button
                    key={p.id}
                    className="add-menu-item"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAdd(p.id)
                    }}
                  >
                    {addedId === p.id ? <><Check size={14} /> 已添加</> : p.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {onDelete && (
          <button
            className="track-action-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(track) }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
