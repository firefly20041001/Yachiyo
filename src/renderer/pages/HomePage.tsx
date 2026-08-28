import React from 'react'
import { motion } from 'framer-motion'
import { Search, Disc3, ListMusic, User, Clock, Music2, Radio, Mic2, Repeat } from 'lucide-react'
import { GlassPanel } from '../components/common/GlassPanel'

interface HomePageProps {
  onNavigate: (page: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="page home-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>首页</h1>
      </motion.div>

      <div className="home-section">
        <h2 className="section-title">快速访问</h2>
        <div className="quick-access-grid">
          <GlassPanel intensity="light" hover className="quick-access-card" onClick={() => onNavigate('search')}>
            <Search size={32} />
            <span>搜索音乐</span>
          </GlassPanel>
          <GlassPanel intensity="light" hover className="quick-access-card" onClick={() => onNavigate('library')}>
            <Radio size={32} />
            <span>推荐歌单</span>
          </GlassPanel>
          <GlassPanel intensity="light" hover className="quick-access-card" onClick={() => onNavigate('playlists')}>
            <ListMusic size={32} />
            <span>歌单管理</span>
          </GlassPanel>
        </div>
      </div>

      <div className="home-section">
        <h2 className="section-title">功能特色</h2>
        <div className="feature-grid">
          <GlassPanel intensity="light" className="feature-card">
            <div className="feature-icon" style={{ color: '#e60026' }}><Disc3 size={28} /></div>
            <h3>网易云音乐</h3>
            <p>支持网易云音乐全量曲库搜索与播放</p>
          </GlassPanel>
          <GlassPanel intensity="light" className="feature-card">
            <div className="feature-icon" style={{ color: '#31c27c' }}><Music2 size={28} /></div>
            <h3>QQ音乐</h3>
            <p>支持QQ音乐全量曲库搜索与播放</p>
          </GlassPanel>
          <GlassPanel intensity="light" className="feature-card">
            <div className="feature-icon" style={{ color: '#0a84ff' }}><Repeat size={28} /></div>
            <h3>歌单同步</h3>
            <p>跨平台歌单导入与同步</p>
          </GlassPanel>
          <GlassPanel intensity="light" className="feature-card">
            <div className="feature-icon" style={{ color: '#bf5af2' }}><Mic2 size={28} /></div>
            <h3>歌词显示</h3>
            <p>实时滚动歌词与桌面悬浮歌词</p>
          </GlassPanel>
        </div>
      </div>

      <div className="home-section">
        <h2 className="section-title">账号</h2>
        <div className="quick-access-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <GlassPanel intensity="light" hover className="quick-access-card" onClick={() => onNavigate('account')}>
            <User size={32} />
            <span>管理账号</span>
          </GlassPanel>
          <GlassPanel intensity="light" hover className="quick-access-card" onClick={() => onNavigate('history')}>
            <Clock size={32} />
            <span>播放历史</span>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
