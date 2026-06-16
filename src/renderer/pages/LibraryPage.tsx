import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Music, RefreshCw, TrendingUp, Headphones } from 'lucide-react'
import { usePlayback } from '../hooks/usePlayback'
import { Track } from '@shared/types/streaming'
import { GlassPanel } from '../components/common/GlassPanel'
import { TrackList } from '../components/common/TrackList'
import { SourceBadge } from '../components/common/SourceBadge'

// Curated playlist IDs
const RECOMMENDED_PLAYLISTS = {
  netease: [
    { id: '3778678', name: '飙升榜', desc: '网易云音乐飙升榜' },
    { id: '2884035', name: '新歌榜', desc: '网易云音乐新歌榜' },
    { id: '3779629', name: '热歌榜', desc: '网易云音乐热歌榜' },
    { id: '19723756', name: '流行榜', desc: '网易云音乐流行榜' },
    { id: '71385702', name: '电音榜', desc: '网易云音乐电音榜' },
  ],
  qqmusic: [
    { id: '26', name: '飙升榜', desc: 'QQ音乐飙升榜' },
    { id: '4', name: '流行指数榜', desc: 'QQ音乐流行指数榜' },
    { id: '27', name: '热歌榜', desc: 'QQ音乐热歌榜' },
    { id: '62', name: '新歌榜', desc: 'QQ音乐新歌榜' },
    { id: '67', name: '抖音排行榜', desc: 'QQ音乐抖音排行榜' },
  ]
}

export function LibraryPage() {
  const { playQueue } = usePlayback()
  const [activeSource, setActiveSource] = useState<'netease' | 'qqmusic'>('qqmusic')
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ id: string; name: string; desc: string } | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)

  const playlists = RECOMMENDED_PLAYLISTS[activeSource]

  const handleSelectPlaylist = async (playlist: { id: string; name: string; desc: string }) => {
    setSelectedPlaylist(playlist)
    setLoadingTracks(true)
    try {
      const fullPlaylist = await window.api.streaming.getPlaylist(activeSource, playlist.id)
      setPlaylistTracks(fullPlaylist.tracks || [])
    } catch (err) {
      console.error('Failed to load playlist:', err)
      setPlaylistTracks([])
    } finally {
      setLoadingTracks(false)
    }
  }

  const handleBack = () => {
    setSelectedPlaylist(null)
    setPlaylistTracks([])
  }

  return (
    <div className="page library-page">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>{selectedPlaylist ? selectedPlaylist.name : '推荐歌单'}</h1>
        <div className="page-header-actions">
          {selectedPlaylist && <button className="btn btn-ghost" onClick={handleBack}>返回</button>}
        </div>
      </motion.div>

      {!selectedPlaylist && (
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
      )}

      {selectedPlaylist ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlassPanel intensity="medium" className="playlist-detail-header">
            <div className="playlist-detail-cover">
              <div className="cover-placeholder large" style={{ background: `linear-gradient(135deg, ${activeSource === 'qqmusic' ? '#31c27c' : '#e60026'}60, ${activeSource === 'qqmusic' ? '#31c27c' : '#e60026'}20)` }}>
                <Headphones size={48} />
              </div>
            </div>
            <div className="playlist-detail-info">
              <h2>{selectedPlaylist.name}</h2>
              <p>{selectedPlaylist.desc}</p>
              <div className="playlist-detail-meta">
                <SourceBadge source={activeSource} size="md" />
                <span>{playlistTracks.length} 首歌曲</span>
              </div>
              <button className="btn btn-primary" onClick={() => playlistTracks.length > 0 && playQueue(playlistTracks)} disabled={playlistTracks.length === 0}>播放全部</button>
            </div>
          </GlassPanel>

          {loadingTracks ? (
            <div className="loading-container"><div className="loading-spinner" /><p>加载歌曲...</p></div>
          ) : playlistTracks.length > 0 ? (
            <TrackList tracks={playlistTracks} onPlay={(track, index) => playQueue(playlistTracks, index)} />
          ) : (
            <GlassPanel intensity="light" className="empty-state"><Music size={32} /><p>暂无数据</p></GlassPanel>
          )}
        </motion.div>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectPlaylist(playlist)}
            >
              <GlassPanel intensity="light" hover className="playlist-card">
                <div className="playlist-card-cover">
                  <div className="cover-placeholder" style={{ background: `linear-gradient(135deg, ${activeSource === 'qqmusic' ? '#31c27c' : '#e60026'}40, ${activeSource === 'qqmusic' ? '#31c27c' : '#e60026'}10)` }}>
                    <TrendingUp size={32} />
                  </div>
                </div>
                <div className="playlist-card-info">
                  <div className="playlist-card-name">{playlist.name}</div>
                  <div className="playlist-card-meta">
                    <SourceBadge source={activeSource} size="sm" />
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
