import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music, Calendar, TrendingUp, Headphones } from 'lucide-react'
import { MusicSource, Track } from '@shared/types/streaming'
import { GlassPanel } from '../components/common/GlassPanel'
import { TrackList } from '../components/common/TrackList'
import { SourceBadge } from '../components/common/SourceBadge'
import { DailyRecommendPage } from './DailyRecommendPage'
import { usePlayback } from '../hooks/usePlayback'

const QQ_TOPLISTS = [
  { id: 26, name: '飙升榜' },
  { id: 4, name: '流行指数榜' },
  { id: 27, name: '热歌榜' },
  { id: 62, name: '新歌榜' },
]

const NETEASE_TOPLISTS = [
  { id: '3778678', name: '飙升榜' },
  { id: '19723756', name: '新歌榜' },
  { id: '3779629', name: '热歌榜' },
]

export function LibraryPage() {
  const [dailySource, setDailySource] = useState<MusicSource | null>(null)
  const [activeSource, setActiveSource] = useState<MusicSource>('qqmusic')
  const [selectedToplist, setSelectedToplist] = useState<{ id: string; name: string } | null>(null)
  const [toplistTracks, setToplistTracks] = useState<Track[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const { playAll, playQueue } = usePlayback()

  if (dailySource) {
    return <DailyRecommendPage source={dailySource} onBack={() => setDailySource(null)} />
  }

  const toplists = activeSource === 'qqmusic' ? QQ_TOPLISTS : NETEASE_TOPLISTS

  const handleSelectToplist = async (toplist: { id: string; name: string }) => {
    setSelectedToplist(toplist)
    setLoadingTracks(true)
    try {
      if (activeSource === 'qqmusic') {
        const tracks = await window.api.streaming.getToplist(Number(toplist.id), 50)
        setToplistTracks(tracks)
      } else {
        const res = await window.api.streaming.getPlaylist('netease', toplist.id)
        setToplistTracks(res.tracks || [])
      }
    } catch (err) {
      console.error('Failed to load toplist:', err)
      setToplistTracks([])
    } finally {
      setLoadingTracks(false)
    }
  }

  const handleBack = () => {
    setSelectedToplist(null)
    setToplistTracks([])
  }

  return (
    <div className="page library-page">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectedToplist && (
            <button className="btn btn-ghost" onClick={handleBack}>返回</button>
          )}
          <h1>{selectedToplist ? selectedToplist.name : '推荐歌单'}</h1>
          {selectedToplist && <SourceBadge source={activeSource} size="md" />}
        </div>
        <div className="page-header-actions">
          {selectedToplist && toplistTracks.length > 0 && (
            <button className="btn btn-primary" onClick={() => playAll(toplistTracks)}>
              播放全部
            </button>
          )}
        </div>
      </motion.div>

      {!selectedToplist ? (
        <>
          {/* Daily Recommend */}
          <div className="home-section">
            <h2 className="section-title">每日推荐</h2>
            <div className="quick-access-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <GlassPanel intensity="light" hover className="quick-access-card" onClick={() => setDailySource('netease')}>
                <div style={{ color: '#e60026' }}><Calendar size={32} /></div>
                <span>网易云日推</span>
              </GlassPanel>
              <GlassPanel intensity="light" hover className="quick-access-card" onClick={() => setDailySource('qqmusic')}>
                <div style={{ color: '#31c27c' }}><Calendar size={32} /></div>
                <span>QQ音乐日推</span>
              </GlassPanel>
            </div>
          </div>

          {/* Source Tabs */}
          <div className="library-tabs">
            <GlassPanel
              intensity={activeSource === 'qqmusic' ? 'medium' : 'light'}
              hover
              className={`tab-btn ${activeSource === 'qqmusic' ? 'tab-active' : ''}`}
              onClick={() => setActiveSource('qqmusic')}
            >
              <span style={{ color: '#31c27c' }}>QQ音乐</span>
            </GlassPanel>
            <GlassPanel
              intensity={activeSource === 'netease' ? 'medium' : 'light'}
              hover
              className={`tab-btn ${activeSource === 'netease' ? 'tab-active' : ''}`}
              onClick={() => setActiveSource('netease')}
            >
              <span style={{ color: '#e60026' }}>网易云音乐</span>
            </GlassPanel>
          </div>

          {/* Toplists */}
          <div className="home-section">
            <h2 className="section-title"><TrendingUp size={20} /> 排行榜</h2>
            <div className="playlist-grid">
              {toplists.map((tl, index) => (
                <motion.div
                  key={tl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectToplist({ id: String(tl.id), name: tl.name })}
                >
                  <GlassPanel intensity="light" hover className="playlist-card">
                    <div className="playlist-card-cover">
                      <div className="cover-placeholder" style={{ background: `linear-gradient(135deg, ${activeSource === 'qqmusic' ? '#31c27c' : '#e60026'}40, ${activeSource === 'qqmusic' ? '#31c27c' : '#e60026'}10)` }}>
                        <TrendingUp size={32} />
                      </div>
                    </div>
                    <div className="playlist-card-info">
                      <div className="playlist-card-name">{tl.name}</div>
                      <div className="playlist-card-meta">
                        <SourceBadge source={activeSource} size="sm" />
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Toplist Detail View */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loadingTracks ? (
            <div className="loading-container"><div className="loading-spinner" /><p>加载中...</p></div>
          ) : toplistTracks.length > 0 ? (
            <TrackList
              tracks={toplistTracks}
              onPlay={(_, index) => playQueue(toplistTracks, index, { page: 'library', id: selectedToplist.id })}
            />
          ) : (
            <GlassPanel intensity="light" className="empty-state"><Music size={32} /><p>暂无数据</p></GlassPanel>
          )}
        </motion.div>
      )}
    </div>
  )
}
