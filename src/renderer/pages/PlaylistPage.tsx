import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, Trash2, Music, Download, FolderPlus } from 'lucide-react'
import { usePlaylistStore } from '../stores/playlistStore'
import { usePlayback } from '../hooks/usePlayback'
import { GlassPanel } from '../components/common/GlassPanel'
import { TrackList } from '../components/common/TrackList'
import { Track, MusicSource } from '@shared/types/streaming'
import { SyncedPlaylist } from '@shared/types/playlist'

export function PlaylistPage() {
  const { playlists, isLoading, refreshPlaylists, deletePlaylist } = usePlaylistStore()
  const { playAll, playQueue } = usePlayback()
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importSource, setImportSource] = useState<MusicSource>('qqmusic')
  const [importing, setImporting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState<{ added: number; removed: number; kept: number } | null>(null)

  useEffect(() => { refreshPlaylists() }, [])

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId)

  const handleSelectPlaylist = async (playlistId: string) => {
    setSelectedPlaylistId(playlistId)
    setRefreshResult(null)
    setLoadingTracks(true)
    try {
      const playlist = await window.api.playlist.getById(playlistId)
      if (playlist) {
        // Sort: manual tracks first, then imported tracks
        const sorted = [...playlist.tracks].sort((a, b) => {
          if (a.origin === 'manual' && b.origin !== 'manual') return -1
          if (a.origin !== 'manual' && b.origin === 'manual') return 1
          return 0
        })
        setPlaylistTracks(sorted.map(t => t.track))
      }
    } catch {
      setPlaylistTracks([])
    } finally {
      setLoadingTracks(false)
    }
  }

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) playAll(playlistTracks)
  }

  const handleBack = () => {
    setSelectedPlaylistId(null)
    setPlaylistTracks([])
    setRefreshResult(null)
  }

  const handleDeleteTrack = async (track: Track) => {
    if (!selectedPlaylistId) return
    try {
      await window.api.playlist.removeTrack(selectedPlaylistId, track.id)
      setPlaylistTracks(prev => prev.filter(t => t.id !== track.id))
    } catch (err) {
      console.error('Failed to delete track:', err)
    }
  }

  const handleRefresh = async () => {
    if (!selectedPlaylistId) return
    setRefreshing(true)
    setRefreshResult(null)
    try {
      const result = await window.api.playlist.refresh(selectedPlaylistId)
      setRefreshResult(result)
      // Reload tracks
      const playlist = await window.api.playlist.getById(selectedPlaylistId)
      if (playlist) {
        setPlaylistTracks(playlist.tracks.map(t => t.track))
      }
      await refreshPlaylists()
    } catch (err) {
      console.error('Failed to refresh playlist:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return
    try {
      await window.api.playlist.create(newPlaylistName.trim())
      await refreshPlaylists()
      setNewPlaylistName('')
      setShowCreate(false)
    } catch (err) {
      console.error('Failed to create playlist:', err)
    }
  }

  const handleImport = async () => {
    if (!importUrl.trim()) return
    setImporting(true)
    try {
      let playlistId = importUrl.trim()
      const qqMatch = importUrl.match(/(?:disstid|id)=(\d+)/)
      if (qqMatch) playlistId = qqMatch[1]
      const neteaseMatch = importUrl.match(/playlist[?/](\d+)/)
      if (neteaseMatch) playlistId = neteaseMatch[1]

      console.log('[Import] Source:', importSource, 'ID:', playlistId)

      if (/^\d+$/.test(playlistId)) {
        const playlist = await window.api.streaming.getPlaylist(importSource, playlistId)
        console.log('[Import] Got playlist:', playlist?.name, 'tracks:', playlist?.tracks?.length)
        if (playlist) {
          await window.api.playlist.createFromRemote(playlist, importUrl)
          await refreshPlaylists()
          setShowImport(false)
          setImportUrl('')
        } else {
          console.error('[Import] Playlist not found')
        }
      } else {
        console.error('[Import] Invalid playlist ID:', playlistId)
      }
    } catch (err) {
      console.error('[Import] Failed:', err)
    } finally {
      setImporting(false)
    }
  }

  const isImported = selectedPlaylist?.sourceType === 'import'

  return (
    <div className="page playlist-page">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>{selectedPlaylist ? selectedPlaylist.name : '歌单'}</h1>
        <div className="page-header-actions">
          {selectedPlaylist && <button className="btn btn-ghost" onClick={handleBack}>返回</button>}
          {!selectedPlaylist && (
            <>
              <button className="btn btn-ghost" onClick={() => refreshPlaylists()}><RefreshCw size={16} /></button>
              <button className="btn btn-ghost" onClick={() => setShowCreate(!showCreate)}><FolderPlus size={16} /></button>
              <button className="btn btn-primary" onClick={() => { console.log('[Import] Toggle import form'); setShowImport(!showImport) }}><Plus size={16} /> 导入歌单</button>
            </>
          )}
        </div>
      </motion.div>

      {/* Create Playlist */}
      {showCreate && !selectedPlaylist && (
        <GlassPanel intensity="medium" className="import-panel">
          <h3>新建歌单</h3>
          <div className="import-form">
            <div className="import-input-row">
              <input type="text" className="import-input" placeholder="输入歌单名称..." value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }} autoFocus />
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newPlaylistName.trim()}>
                <FolderPlus size={16} /> 创建
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Import Section */}
      {showImport && !selectedPlaylist && (
        <GlassPanel intensity="medium" className="import-panel">
          <h3>导入歌单</h3>
          <div className="import-form">
            <div className="import-source-select">
              <button className={`btn ${importSource === 'qqmusic' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setImportSource('qqmusic')}>QQ音乐</button>
              <button className={`btn ${importSource === 'netease' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setImportSource('netease')}>网易云</button>
            </div>
            <div className="import-input-row">
              <input type="text" className="import-input" placeholder="粘贴歌单链接或ID..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
              <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? <RefreshCw size={16} className="spin" /> : <Download size={16} />}
                {importing ? '导入中...' : '导入'}
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {isLoading && <div className="loading-container"><div className="loading-spinner" /></div>}

      {/* Playlist Detail View */}
      {selectedPlaylist && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlassPanel intensity="medium" className="playlist-detail-header">
            <div className="playlist-detail-cover">
              {selectedPlaylist.coverUrl ? (
                <img src={selectedPlaylist.coverUrl} alt={selectedPlaylist.name} />
              ) : (
                <div className="cover-placeholder large"><Music size={48} /></div>
              )}
            </div>
            <div className="playlist-detail-info">
              <h2>{selectedPlaylist.name}</h2>
              {selectedPlaylist.description && <p>{selectedPlaylist.description}</p>}
              <div className="playlist-detail-meta">
                <span>{playlistTracks.length} 首歌曲</span>
                <span>来源: {selectedPlaylist.source === 'netease' ? '网易云' : 'QQ音乐'}</span>
                {isImported && <span>类型: 导入歌单</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handlePlayAll} disabled={playlistTracks.length === 0}>播放全部</button>
                {isImported && (
                  <button className="btn btn-ghost" onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />}
                    {refreshing ? '刷新中...' : '刷新歌单'}
                  </button>
                )}
              </div>
            </div>
          </GlassPanel>

          {/* Refresh Result */}
          {refreshResult && (
            <GlassPanel intensity="light" className="import-panel" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                <span style={{ color: 'var(--accent-green)' }}>新增 {refreshResult.added} 首</span>
                <span style={{ color: '#ff3b30' }}>移除 {refreshResult.removed} 首</span>
                <span style={{ color: 'var(--text-secondary)' }}>保留 {refreshResult.kept} 首手动添加</span>
              </div>
            </GlassPanel>
          )}

          {loadingTracks ? (
            <div className="loading-container"><div className="loading-spinner" /><p>加载歌曲...</p></div>
          ) : playlistTracks.length > 0 ? (
            <TrackList
              tracks={playlistTracks}
              onPlay={(_, index) => playQueue(playlistTracks, index, { page: 'playlists', id: selectedPlaylistId || undefined })}
              onDelete={handleDeleteTrack}
            />
          ) : (
            <GlassPanel intensity="light" className="empty-state"><Music size={32} /><p>歌单为空</p></GlassPanel>
          )}
        </motion.div>
      )}

      {/* Playlist List View */}
      {!selectedPlaylist && !isLoading && (
        <div className="playlist-list">
          {playlists.length === 0 ? (
            <GlassPanel intensity="light" className="empty-state">
              <Music size={48} /><h3>还没有歌单</h3><p>点击"导入歌单"导入</p>
            </GlassPanel>
          ) : (
            playlists.map((playlist, index) => (
              <motion.div key={playlist.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                <GlassPanel intensity="light" hover className="playlist-item" onClick={() => handleSelectPlaylist(playlist.id)}>
                  <div className="playlist-item-cover">
                    {playlist.coverUrl ? <img src={playlist.coverUrl} alt={playlist.name} /> : <div className="cover-placeholder"><Music size={20} /></div>}
                  </div>
                  <div className="playlist-item-info">
                    <div className="playlist-item-name">{playlist.name}</div>
                    <div className="playlist-item-meta">
                      {playlist.tracks.length} 首歌曲 · {playlist.source === 'netease' ? '网易云' : 'QQ音乐'}
                      {playlist.sourceType === 'import' && ' · 导入'}
                    </div>
                  </div>
                  <div className="playlist-item-actions">
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id) }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </GlassPanel>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
