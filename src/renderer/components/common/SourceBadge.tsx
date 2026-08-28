import React from 'react'
import { MusicSource } from '@shared/types/streaming'

interface SourceBadgeProps {
  source: MusicSource
  size?: 'sm' | 'md'
}

export function SourceBadge({ source, size = 'sm' }: SourceBadgeProps) {
  const config = {
    netease: {
      label: '网易云',
      color: '#e60026',
      bgColor: 'rgba(230, 0, 38, 0.15)'
    },
    qqmusic: {
      label: 'QQ音乐',
      color: '#31c27c',
      bgColor: 'rgba(49, 194, 124, 0.15)'
    }
  }

  const { label, color, bgColor } = config[source]
  const sizeClass = size === 'sm' ? 'source-badge-sm' : 'source-badge-md'

  return (
    <span
      className={`source-badge ${sizeClass}`}
      style={{
        color,
        backgroundColor: bgColor,
        border: `1px solid ${color}30`
      }}
    >
      {label}
    </span>
  )
}
