import React, { useCallback, useRef, useState } from 'react'
import { Volume2, Volume1, VolumeX } from 'lucide-react'

interface VolumeControlProps {
  volume: number
  isMuted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
}

export function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute }: VolumeControlProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const effectiveVolume = isMuted ? 0 : volume
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2

  const getVolumeFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!barRef.current) return volume
    const rect = barRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    return Math.max(0, Math.min(1, x / rect.width))
  }, [volume])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const newVol = getVolumeFromEvent(e)
    onVolumeChange(newVol)

    const handleMouseMove = (ev: MouseEvent) => {
      const newVol = getVolumeFromEvent(ev)
      onVolumeChange(newVol)
    }
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [getVolumeFromEvent, onVolumeChange])

  return (
    <div className="volume-control">
      <button className="volume-btn" onClick={onToggleMute}>
        <VolumeIcon size={18} />
      </button>
      <div className="volume-bar" ref={barRef} onMouseDown={handleMouseDown}>
        <div className="volume-bar-bg" />
        <div className="volume-bar-fill" style={{ width: `${effectiveVolume * 100}%` }} />
        <div className="volume-bar-thumb" style={{ left: `${effectiveVolume * 100}%`, opacity: isDragging ? 1 : 0 }} />
      </div>
    </div>
  )
}
