import React from 'react'
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle } from 'lucide-react'
import { usePlaybackStore, PlayMode } from '../../stores/playbackStore'

interface PlayerControlsProps {
  onTogglePlay: () => void
  onNext: () => void
  onPrev: () => void
  variant?: 'default' | 'light'
}

export function PlayerControls({ onTogglePlay, onNext, onPrev, variant = 'default' }: PlayerControlsProps) {
  const { isPlaying, playMode, cyclePlayMode } = usePlaybackStore()

  const playModeIcons: Record<PlayMode, typeof Repeat> = {
    sequence: Repeat,
    loop: Repeat,
    single: Repeat1,
    shuffle: Shuffle
  }

  const ModeIcon = playModeIcons[playMode]
  const isLight = variant === 'light'

  return (
    <div className={`player-controls ${isLight ? 'player-controls-light' : ''}`}>
      <button
        className={`control-btn mode-btn ${playMode !== 'sequence' ? 'mode-btn-active' : ''}`}
        onClick={cyclePlayMode}
        title={playMode}
      >
        <ModeIcon size={18} />
      </button>

      <button className="control-btn" onClick={() => { console.log('[Controls] prev clicked'); onPrev() }}>
        <SkipBack size={20} fill="currentColor" />
      </button>

      <button
        className="control-btn play-btn"
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
      </button>

      <button className="control-btn" onClick={() => { console.log('[Controls] next clicked'); onNext() }}>
        <SkipForward size={20} fill="currentColor" />
      </button>
    </div>
  )
}
