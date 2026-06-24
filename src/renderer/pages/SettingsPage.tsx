import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Monitor, Info, X, Type, Eye, EyeOff, Lock, Unlock, Keyboard, RotateCcw, Palette } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import { GlassPanel } from '../components/common/GlassPanel'
import { ColorWheel } from '../components/common/ColorWheel'

const ACTION_LABELS: Record<string, string> = {
  togglePlay: '播放/暂停',
  next: '下一首',
  prev: '上一首',
  volumeUp: '增大音量',
  volumeDown: '减小音量',
  toggleLyrics: '显示/隐藏歌词'
}

export function SettingsPage() {
  const { theme, setTheme } = useUIStore()
  const [closeAction, setCloseAction] = useState('minimize')
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateStatus, setUpdateStatus] = useState('')
  const [themeColor, setThemeColor] = useState('#DE89A8')
  const [showColorWheel, setShowColorWheel] = useState(false)
  const [lyrics, setLyrics] = useState({
    enabled: false, fontSize: 28, fontFamily: 'PingFang SC', color: '#ffffff',
    bgColor: 'rgba(0,0,0,0.3)', opacity: 0.9, translationEnabled: true,
    locked: false, bold: true, borderRadius: 16, textShadow: true
  })

  useEffect(() => {
    window.api.settings.get('settings.closeAction', 'minimize').then((v) => setCloseAction(v))
    window.api.settings.get('settings.themeColor', '#DE89A8').then((v) => setThemeColor(v))
    window.api.lyricsWindow.getSettings().then((s) => setLyrics(prev => ({ ...prev, ...s })))
    window.api.shortcuts.get().then((s) => setShortcuts(s))

    window.api.lyricsWindow.onSettingsChanged((s) => setLyrics(prev => ({ ...prev, ...s })))
  }, [])

  useEffect(() => {
    if (!editingKey) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const parts: string[] = []
      if (e.ctrlKey) parts.push('CommandOrControl')
      if (e.altKey) parts.push('Alt')
      if (e.shiftKey) parts.push('Shift')
      if (e.metaKey) parts.push('Super')

      const key = e.key
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        // Map special keys
        const keyMap: Record<string, string> = {
          'ArrowRight': 'Right', 'ArrowLeft': 'Left', 'ArrowUp': 'Up', 'ArrowDown': 'Down',
          ' ': 'Space', 'Enter': 'Return', 'Escape': 'Escape', 'Backspace': 'Backspace',
          'Delete': 'Delete', 'Tab': 'Tab', 'Home': 'Home', 'End': 'End',
          'PageUp': 'PageUp', 'PageDown': 'PageDown',
          'F1':'F1','F2':'F2','F3':'F3','F4':'F4','F5':'F5','F6':'F6',
          'F7':'F7','F8':'F8','F9':'F9','F10':'F10','F11':'F11','F12':'F12'
        }
        parts.push(keyMap[key] || key.toUpperCase())

        const combo = parts.join('+')
        setShortcuts(prev => ({ ...prev, [editingKey]: combo }))
        window.api.shortcuts.set({ [editingKey]: combo })
        setEditingKey(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingKey])

  const handleThemeColorChange = async (color: string) => {
    setThemeColor(color)
    await window.api.settings.set('settings.themeColor', color)
    // Apply to CSS variables
    document.documentElement.style.setProperty('--accent-primary', color)
    // Darken for pressed state
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    const darker = '#' + [r, g, b].map(c => Math.max(0, c - 30).toString(16).padStart(2, '0')).join('')
    document.documentElement.style.setProperty('--accent-pressed', darker)
    // Lighten for hover
    const lighter = '#' + [r, g, b].map(c => Math.min(255, c + 20).toString(16).padStart(2, '0')).join('')
    document.documentElement.style.setProperty('--accent-hover', lighter)
  }

  const handleResetShortcuts = async () => {
    const defaults = await window.api.shortcuts.reset()
    setShortcuts(defaults)
  }

  const CURRENT_VERSION = '1.0.5'

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true)
    setUpdateStatus('检查中...')
    try {
      const res = await fetch('https://api.github.com/repos/firefly20041001/yachiyo/releases/latest')
      const data = await res.json()
      const latestVersion = (data.tag_name || '').replace('v', '').replace('V', '')

      if (latestVersion && latestVersion !== CURRENT_VERSION) {
        setUpdateStatus(`发现新版本 v${latestVersion}`)
        window.open(data.html_url)
      } else {
        setUpdateStatus('已是最新版本')
      }
    } catch {
      setUpdateStatus('检查失败，请稍后重试')
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleCloseActionChange = async (action: string) => {
    setCloseAction(action)
    await window.api.settings.set('settings.closeAction', action)
  }

  const handleLyricsToggle = async () => {
    const newVal = !lyrics.enabled
    setLyrics(prev => ({ ...prev, enabled: newVal }))
    await window.api.lyricsWindow.setSetting('enabled', newVal)
    if (newVal) await window.api.lyricsWindow.show()
    else await window.api.lyricsWindow.hide()
  }

  const updateLyrics = async (key: string, value: any) => {
    setLyrics(prev => ({ ...prev, [key]: value }))
    await window.api.lyricsWindow.setSetting(key, value)
  }

  return (
    <div className="page settings-page">
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>设置</h1>
      </motion.div>

      <div className="settings-sections">
        {/* Appearance */}
        <GlassPanel intensity="medium" className="settings-section">
          <h2 className="settings-section-title"><Monitor size={20} /> 外观</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-label"><span>主题</span><span className="setting-desc">选择深色或浅色主题</span></div>
              <div className="theme-selector">
                <button className={`theme-btn ${theme === 'dark' ? 'theme-btn-active' : ''}`} onClick={() => setTheme('dark')}><Moon size={16} /> 深色</button>
                <button className={`theme-btn ${theme === 'light' ? 'theme-btn-active' : ''}`} onClick={() => setTheme('light')}><Sun size={16} /> 浅色</button>
              </div>
            </div>
            <div className="setting-item">
              <div className="setting-label">
                <span><Palette size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />主题色</span>
                <span className="setting-desc">点击颜色打开取色轮盘</span>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                onClick={() => setShowColorWheel(true)}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: themeColor, border: '2px solid var(--border-color)' }} />
                <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{themeColor}</span>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Global Shortcuts */}
        <GlassPanel intensity="medium" className="settings-section">
          <h2 className="settings-section-title"><Keyboard size={20} /> 全局快捷键</h2>
          <div className="settings-group">
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <div className="setting-item" key={key}>
                <div className="setting-label"><span>{label}</span></div>
                <div className="shortcut-input-row">
                  <button
                    className={`shortcut-btn ${editingKey === key ? 'shortcut-btn-editing' : ''}`}
                    onClick={() => setEditingKey(editingKey === key ? null : key)}
                  >
                    {editingKey === key ? '按下快捷键...' : (shortcuts[key] || '未设置')}
                  </button>
                </div>
              </div>
            ))}
            <div className="setting-item">
              <div className="setting-label"><span></span></div>
              <button className="btn btn-ghost" onClick={handleResetShortcuts}>
                <RotateCcw size={16} /> 恢复默认
              </button>
            </div>
          </div>
        </GlassPanel>

        {/* Floating Lyrics */}
        <GlassPanel intensity="medium" className="settings-section">
          <h2 className="settings-section-title"><Type size={20} /> 桌面悬浮歌词</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-label"><span>悬浮歌词</span><span className="setting-desc">在桌面显示浮动歌词窗口</span></div>
              <button className={`theme-btn ${lyrics.enabled ? 'theme-btn-active' : ''}`} onClick={handleLyricsToggle}>
                {lyrics.enabled ? <><Eye size={16} /> 已开启</> : <><EyeOff size={16} /> 已关闭</>}
              </button>
            </div>

            {lyrics.enabled && (
              <>
                <div className="setting-item">
                  <div className="setting-label"><span>锁定位置</span></div>
                  <button className={`theme-btn ${lyrics.locked ? 'theme-btn-active' : ''}`} onClick={() => updateLyrics('locked', !lyrics.locked)}>
                    {lyrics.locked ? <><Lock size={16} /> 已锁定</> : <><Unlock size={16} /> 未锁定</>}
                  </button>
                </div>
                <div className="setting-item">
                  <div className="setting-label"><span>字体大小</span></div>
                  <div className="theme-selector">
                    {[20, 24, 28, 32, 36, 40].map((s) => (
                      <button key={s} className={`theme-btn ${lyrics.fontSize === s ? 'theme-btn-active' : ''}`} onClick={() => updateLyrics('fontSize', s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-label"><span>字体粗细</span></div>
                  <button className={`theme-btn ${lyrics.bold ? 'theme-btn-active' : ''}`} onClick={() => updateLyrics('bold', !lyrics.bold)}>
                    {lyrics.bold ? '粗体' : '常规'}
                  </button>
                </div>
                <div className="setting-item">
                  <div className="setting-label"><span>歌词颜色</span></div>
                  <div className="theme-selector">
                    {['#ffffff', '#000000', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9a9e', '#a18cd1', '#fbc2eb'].map((c) => (
                      <button key={c} className={`theme-btn ${lyrics.color === c ? 'theme-btn-active' : ''}`}
                        onClick={() => updateLyrics('color', c)}
                        style={{ width: 28, height: 28, background: c, borderRadius: '50%', border: lyrics.color === c ? '2px solid var(--accent-primary)' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-label"><span>背景</span></div>
                  <div className="theme-selector">
                    {[
                      { label: '半透明黑', value: 'rgba(0,0,0,0.3)' },
                      { label: '深黑', value: 'rgba(0,0,0,0.6)' },
                      { label: '半透明白', value: 'rgba(255,255,255,0.2)' },
                      { label: '无', value: 'transparent' }
                    ].map((i) => (
                      <button key={i.value} className={`theme-btn ${lyrics.bgColor === i.value ? 'theme-btn-active' : ''}`}
                        onClick={() => updateLyrics('bgColor', i.value)}>{i.label}</button>
                    ))}
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-label"><span>圆角</span><span className="setting-desc">{lyrics.borderRadius}px</span></div>
                  <input type="range" min="0" max="32" step="2" value={lyrics.borderRadius}
                    onChange={(e) => updateLyrics('borderRadius', parseInt(e.target.value))} style={{ width: 160 }} />
                </div>
                <div className="setting-item">
                  <div className="setting-label"><span>透明度</span><span className="setting-desc">{Math.round(lyrics.opacity * 100)}%</span></div>
                  <input type="range" min="0.3" max="1" step="0.05" value={lyrics.opacity}
                    onChange={(e) => updateLyrics('opacity', parseFloat(e.target.value))} style={{ width: 160 }} />
                </div>
                <div className="setting-item">
                  <div className="setting-label"><span>文字阴影</span></div>
                  <button className={`theme-btn ${lyrics.textShadow ? 'theme-btn-active' : ''}`} onClick={() => updateLyrics('textShadow', !lyrics.textShadow)}>
                    {lyrics.textShadow ? '开启' : '关闭'}
                  </button>
                </div>
              </>
            )}
          </div>
        </GlassPanel>

        {/* Window */}
        <GlassPanel intensity="medium" className="settings-section">
          <h2 className="settings-section-title"><X size={20} /> 窗口</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-label"><span>关闭按钮行为</span><span className="setting-desc">点击关闭按钮时的操作</span></div>
              <div className="theme-selector">
                <button className={`theme-btn ${closeAction === 'minimize' ? 'theme-btn-active' : ''}`} onClick={() => handleCloseActionChange('minimize')}>最小化到托盘</button>
                <button className={`theme-btn ${closeAction === 'exit' ? 'theme-btn-active' : ''}`} onClick={() => handleCloseActionChange('exit')}>退出应用</button>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* About */}
        <GlassPanel intensity="medium" className="settings-section">
          <h2 className="settings-section-title"><Info size={20} /> 关于</h2>
          <div className="settings-group">
            <div className="setting-item"><div className="setting-label"><span>版本</span></div><span className="setting-value">1.0.5</span></div>
            <div className="setting-item"><div className="setting-label"><span>技术栈</span></div><span className="setting-value">Electron + React + TypeScript</span></div>
            <div className="setting-item">
              <div className="setting-label">
                <span>检查更新</span>
                <span className="setting-desc">{updateStatus}</span>
              </div>
              <button className="btn btn-primary" onClick={handleCheckUpdate} disabled={checkingUpdate}>
                {checkingUpdate ? '检查中...' : '检查更新'}
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Color Wheel Modal */}
      {showColorWheel && (
        <div className="modal-overlay" onClick={() => setShowColorWheel(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <GlassPanel intensity="heavy" className="color-wheel-modal">
              <h3 style={{ marginBottom: 16, textAlign: 'center' }}>选择主题色</h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <ColorWheel color={themeColor} onChange={handleThemeColorChange} size={220} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: themeColor, border: '2px solid var(--border-color)' }} />
                <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{themeColor}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowColorWheel(false)}>确定</button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => handleThemeColorChange('#DE89A8')}>恢复默认</button>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}
    </div>
  )
}
