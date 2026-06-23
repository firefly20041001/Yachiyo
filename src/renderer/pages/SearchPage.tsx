import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Music } from 'lucide-react'
import { MusicSource, Track } from '@shared/types/streaming'
import { useSearch } from '../hooks/useSearch'
import { usePlayback } from '../hooks/usePlayback'
import { SearchBar } from '../components/common/SearchBar'
import { TrackList } from '../components/common/TrackList'
import { GlassPanel } from '../components/common/GlassPanel'

export function SearchPage() {
  const { results, isLoading, error, search } = useSearch()
  const { playTrack, playQueue } = usePlayback()
  const [activeSource, setActiveSource] = useState<MusicSource>('qqmusic')
  const [toplist, setToplist] = useState<Track[]>([])
  const [toplistLoading, setToplistLoading] = useState(false)
  const [showToplist, setShowToplist] = useState(true)

  const handleSearch = (query: string) => {
    setShowToplist(false)
    search(query, activeSource)
  }

  const handlePlayTrack = (track: any, index: number) => {
    if (results?.tracks) playQueue(results.tracks, index, { page: 'search' })
  }

  const handlePlayToplist = (track: Track, index: number) => {
    playQueue(toplist, index)
  }

  // Load toplist when source changes
  useEffect(() => {
    if (showToplist) loadToplist()
  }, [activeSource, showToplist])

  const loadToplist = async () => {
    setToplistLoading(true)
    try {
      if (activeSource === 'qqmusic') {
        const tracks = await window.api.streaming.getToplist(26, 50)
        setToplist(tracks)
      } else {
        // NetEase: use search with empty query to get hot songs
        const res = await window.api.streaming.search({ query: '热歌', source: 'netease', limit: 50 })
        setToplist(res.tracks)
      }
    } catch (err) {
      console.error('Failed to load toplist:', err)
    } finally {
      setToplistLoading(false)
    }
  }

  const handleSourceChange = (source: MusicSource) => {
    setActiveSource(source)
    setShowToplist(true)
  }

  return (
    <div className="page search-page">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>搜索</h1>
      </motion.div>

      <div className="search-section">
        <SearchBar onSearch={handleSearch} />
        <div className="source-filter">
          <GlassPanel
            intensity={activeSource === 'netease' ? 'medium' : 'light'}
            hover
            className={`source-filter-btn ${activeSource === 'netease' ? 'source-filter-active' : ''}`}
            onClick={() => handleSourceChange('netease')}
          >
            <span style={{ color: '#e60026' }}>网易云音乐</span>
          </GlassPanel>
          <GlassPanel
            intensity={activeSource === 'qqmusic' ? 'medium' : 'light'}
            hover
            className={`source-filter-btn ${activeSource === 'qqmusic' ? 'source-filter-active' : ''}`}
            onClick={() => handleSourceChange('qqmusic')}
          >
            <span style={{ color: '#31c27c' }}>QQ音乐</span>
          </GlassPanel>
          {!showToplist && (
            <GlassPanel intensity="light" hover className="source-filter-btn" onClick={() => setShowToplist(true)}>
              <TrendingUp size={14} /><span>返回榜单</span>
            </GlassPanel>
          )}
        </div>
      </div>

      {isLoading && <div className="search-loading"><div className="loading-spinner" /><p>搜索中...</p></div>}
      {error && <GlassPanel intensity="light" className="search-error"><p>{error}</p></GlassPanel>}

      {/* Toplist */}
      {showToplist && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="search-results">
          <div className="results-section">
            <h2 className="section-title">
              <TrendingUp size={20} />
              {activeSource === 'qqmusic' ? 'QQ音乐飙升榜' : '网易云热歌榜'}
              <button className="btn btn-ghost btn-sm" onClick={loadToplist}>刷新</button>
            </h2>
            {toplistLoading ? (
              <div className="search-loading"><div className="loading-spinner" /><p>加载中...</p></div>
            ) : toplist.length > 0 ? (
              <TrackList tracks={toplist} onPlay={handlePlayToplist} />
            ) : (
              <GlassPanel intensity="light" className="empty-state"><Music size={32} /><p>暂无榜单数据</p></GlassPanel>
            )}
          </div>
        </motion.div>
      )}

      {/* Search Results */}
      {results && !isLoading && !showToplist && (
        <motion.div className="search-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {results.tracks.length > 0 ? (
            <div className="results-section">
              <h2 className="section-title">歌曲 ({results.total})</h2>
              <TrackList tracks={results.tracks} onPlay={handlePlayTrack} />
            </div>
          ) : (
            <div className="search-empty"><Search size={48} /><p>没有找到相关结果</p></div>
          )}
        </motion.div>
      )}
    </div>
  )
}
