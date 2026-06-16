import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Monitor, Info, X, Type, Eye, EyeOff, Lock, Unlock, Keyboard, RotateCcw } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import { GlassPanel } from '../components/common/GlassPanel'

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
  const [lyrics, setLyrics] = useState({
    enabled: false, fontSize: 28, fontFamily: 'PingFang SC', color: '#ffffff',
    bgColor: 'rgba(0,0,0,0.3)', opacity: 0.9, translationEnabled: true,
    locked: false, bold: true, borderRadius: 16, textShadow: true
  })

  useEffect(() => {
    window.api.settings.get('settings.closeAction', 'minimize').then((v) => setCloseAction(v))
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

  const handleResetShortcuts = async () => {
    const defaults = await window.api.shortcuts.reset()
    setShortcuts(defaults)
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
                    {['#ffffff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9a9e', '#a18cd1', '#fbc2eb'].map((c) => (
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
                <div className="setting-item">
                  <div className="setting-label"><span>显示翻译</span></div>
                  <button className={`theme-btn ${lyrics.translationEnabled ? 'theme-btn-active' : ''}`} onClick={() => updateLyrics('translationEnabled', !lyrics.translationEnabled)}>
                    {lyrics.translationEnabled ? '开启' : '关闭'}
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
            <div className="setting-item"><div className="setting-label"><span>版本</span></div><span className="setting-value">1.0.1</span></div>
            <div className="setting-item"><div className="setting-label"><span>技术栈</span></div><span className="setting-value">Electron + React + TypeScript</span></div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
