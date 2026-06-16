import React, { useCallback, useRef, useState } from 'react'

interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!barRef.current || !duration) return 0
      const rect = barRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      return (x / rect.width) * duration
    },
    [duration]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      const time = getTimeFromPosition(e.clientX)
      setDragTime(time)
    },
    [getTimeFromPosition]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      const time = getTimeFromPosition(e.clientX)
      setDragTime(time)
    },
    [isDragging, getTimeFromPosition]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      setIsDragging(false)
      const time = getTimeFromPosition(e.clientX)
      onSeek(time)
    },
    [isDragging, getTimeFromPosition, onSeek]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return
      const time = getTimeFromPosition(e.clientX)
      onSeek(time)
    },
    [isDragging, getTimeFromPosition, onSeek]
  )

  const displayTime = isDragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  return (
    <div className="progress-bar-container">
      <span className="progress-time">{formatTime(displayTime)}</span>
      <div
        className="progress-bar"
        ref={barRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => isDragging && setIsDragging(false)}
        onClick={handleClick}
      >
        <div className="progress-bar-bg" />
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        <div className="progress-bar-thumb" style={{ left: `${progress}%` }} />
      </div>
      <span className="progress-time">{formatTime(duration)}</span>
    </div>
  )
}
