import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music, RefreshCw, Play, ArrowLeft } from 'lucide-react'
import { Track, MusicSource } from '@shared/types/streaming'
import { GlassPanel } from '../components/common/GlassPanel'
import { TrackList } from '../components/common/TrackList'
import { SourceBadge } from '../components/common/SourceBadge'
import { usePlayback } from '../hooks/usePlayback'
import { generateRecommendations } from '../utils/recommendEngine'

interface DailyRecommendPageProps {
  source: MusicSource
  onBack: () => void
}

function getCacheKey(source: MusicSource): string {
  const today = new Date().toISOString().split('T')[0]
  return `daily_recommend_v2_${source}_${today}`
}

function loadCachedTracks(source: MusicSource): Track[] | null {
  try {
    const key = getCacheKey(source)
    const cached = localStorage.getItem(key)
    if (cached) {
      const data = JSON.parse(cached)
      const today = new Date().toISOString().split('T')[0]
      if (data.date === today && data.tracks?.length > 0) {
        return data.tracks
      }
    }
  } catch {}
  return null
}

function saveCachedTracks(source: MusicSource, tracks: Track[]) {
  try {
    const key = getCacheKey(source)
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(key, JSON.stringify({ date: today, tracks }))
  } catch {}
}

export function DailyRecommendPage({ source, onBack }: DailyRecommendPageProps) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { playAll, playQueue } = usePlayback()

  const sourceName = source === 'netease' ? '网易云音乐' : 'QQ音乐'

  useEffect(() => {
    loadTracks()
  }, [source])

  const loadTracks = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    // Check cache first
    if (!forceRefresh) {
      const cached = loadCachedTracks(source)
      if (cached && cached.length > 0) {
        console.log('[DailyRecommend] Using cached tracks for', source, cached.length, 'songs')
        setTracks(cached)
        setLoading(false)
        return
      }
    }

    try {
      console.log('[DailyRecommend] Fetching fresh tracks for', source)
      // Fetch a larger pool of candidate songs
      const candidates = await window.api.streaming.getDailyRecommend(source)

      if (candidates.length === 0) {
        setError(`请先登录${sourceName}账号`)
        setTracks([])
      } else {
        // Apply recommendation engine
        const recommended = generateRecommendations(candidates, 30)
        console.log('[DailyRecommend] Generated', recommended.length, 'recommendations from', candidates.length, 'candidates')
        saveCachedTracks(source, recommended)
        setTracks(recommended)
      }
    } catch (err) {
      console.error('[DailyRecommend] Failed:', err)
      setError('加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page daily-recommend-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <h1>{sourceName}日推</h1>
          <SourceBadge source={source} size="md" />
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost" onClick={() => loadTracks(true)} disabled={loading}>
            <RefreshCw size={16} />
          </button>
          {tracks.length > 0 && (
            <button className="btn btn-primary" onClick={() => playAll(tracks)}>
              <Play size={16} /> 全部播放
            </button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>根据你的听歌偏好生成推荐...</p>
        </div>
      ) : error ? (
        <GlassPanel intensity="light" className="empty-state">
          <Music size={48} />
          <h3>{error}</h3>
          <button className="btn btn-primary" onClick={() => loadTracks(true)}>重试</button>
        </GlassPanel>
      ) : tracks.length > 0 ? (
        <TrackList
          tracks={tracks}
          onPlay={(track, index) => playQueue(tracks, index, { page: 'daily', id: source })}
        />
      ) : (
        <GlassPanel intensity="light" className="empty-state">
          <Music size={48} />
          <h3>暂无推荐</h3>
          <p>多听几首歌，系统会根据你的喜好生成推荐</p>
        </GlassPanel>
      )}
    </div>
  )
}
