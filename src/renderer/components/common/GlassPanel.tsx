import React from 'react'
import { motion } from 'framer-motion'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
  intensity?: 'light' | 'medium' | 'heavy'
  hover?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export function GlassPanel({
  children,
  className = '',
  intensity = 'medium',
  hover = false,
  onClick,
  style
}: GlassPanelProps) {
  const intensityMap = {
    light: 'glass-light',
    medium: 'glass-medium',
    heavy: 'glass-heavy'
  }

  return (
    <motion.div
      className={`glass-panel ${intensityMap[intensity]} ${hover ? 'glass-hover' : ''} ${className}`}
      style={style}
      onClick={onClick}
      whileHover={hover ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {children}
    </motion.div>
  )
}
