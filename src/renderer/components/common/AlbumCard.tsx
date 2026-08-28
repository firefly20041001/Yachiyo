import React from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { Album } from '@shared/types/streaming'
import { SourceBadge } from './SourceBadge'

interface AlbumCardProps {
  album: Album
  onClick?: () => void
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  return (
    <motion.div
      className="album-card"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="album-card-cover">
        {album.coverUrl ? (
          <img src={album.coverUrl} alt={album.name} />
        ) : (
          <div className="cover-placeholder" />
        )}
        <div className="album-play-btn">
          <Play size={24} fill="white" />
        </div>
      </div>
      <div className="album-card-info">
        <div className="album-card-name">{album.name}</div>
        <div className="album-card-artist">{album.artist}</div>
      </div>
      <SourceBadge source={album.source} size="sm" />
    </motion.div>
  )
}
