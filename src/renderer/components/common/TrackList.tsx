import React from 'react'
import { Track } from '@shared/types/streaming'
import { TrackItem } from './TrackItem'

interface TrackListProps {
  tracks: Track[]
  onPlay: (track: Track, index: number) => void
  onDelete?: (track: Track, index: number) => void
  showIndex?: boolean
  showSource?: boolean
  showHeader?: boolean
}

export function TrackList({ tracks, onPlay, onDelete, showIndex = true, showSource = true, showHeader = true }: TrackListProps) {
  return (
    <div className="track-list">
      {showHeader && (
        <div className="track-list-header">
          {showIndex && <div className="track-header-index">#</div>}
          <div className="track-header-cover" />
          <div className="track-header-title">标题</div>
          {showSource && <div className="track-header-source">音源</div>}
          <div className="track-header-album">专辑</div>
          <div className="track-header-duration">时长</div>
          <div className="track-header-actions" />
        </div>
      )}
      <div className="track-list-body">
        {tracks.map((track, index) => (
          <TrackItem
            key={`${track.source}-${track.id}`}
            track={track}
            index={index}
            onPlay={() => onPlay(track, index)}
            onDelete={onDelete ? () => onDelete(track, index) : undefined}
            showIndex={showIndex}
            showSource={showSource}
          />
        ))}
      </div>
    </div>
  )
}
