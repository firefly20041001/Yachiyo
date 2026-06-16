import React from 'react'
import { motion } from 'framer-motion'
import { Play, Music } from 'lucide-react'
import { Playlist } from '@shared/types/streaming'
import { SourceBadge } from './SourceBadge'

interface PlaylistCardProps {
  playlist: Playlist
  onClick?: () => void
}

export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  return (
    <motion.div
      className="playlist-card"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="playlist-card-cover">
        {playlist.coverUrl ? (
          <img src={playlist.coverUrl} alt={playlist.name} />
        ) : (
          <div className="cover-placeholder">
            <Music size={32} />
          </div>
        )}
        <div className="playlist-play-btn">
          <Play size={24} fill="white" />
        </div>
      </div>
      <div className="playlist-card-info">
        <div className="playlist-card-name">{playlist.name}</div>
        <div className="playlist-card-meta">
          <SourceBadge source={playlist.source} size="sm" />
          <span className="playlist-track-count">{playlist.trackCount}首</span>
        </div>
      </div>
    </motion.div>
  )
}
