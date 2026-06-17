import React from 'react'
import { motion } from 'framer-motion'
import { Home, Search, Library, ListMusic, Settings, User, Moon, Sun, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useAccountStore } from '../../stores/accountStore'

interface SidebarProps {
  onNavigate: (page: string) => void
  activePage: string
}

export function Sidebar({ onNavigate, activePage }: SidebarProps) {
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useUIStore()
  const accounts = useAccountStore((s) => s.accounts)

  const navItems = [
    { id: 'home', icon: Home, label: '首页' },
    { id: 'search', icon: Search, label: '搜索' },
    { id: 'library', icon: Library, label: '音乐库' },
    { id: 'playlists', icon: ListMusic, label: '歌单' },
    { id: 'history', icon: Clock, label: '播放历史' },
    { id: 'account', icon: User, label: '账号' },
    { id: 'settings', icon: Settings, label: '设置' }
  ]

  return (
    <motion.aside
      className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="sidebar-logo">
        <img src="./icon.ico" alt="Yachiyo" className="logo-icon-img" style={{ width: 32, height: 32, borderRadius: 8 }} />
        {!sidebarCollapsed && <span className="logo-text">Yachiyo</span>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'nav-item-active' : ''}`}
            onClick={() => onNavigate(item.id)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <item.icon size={20} />
            {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
          </motion.button>
        ))}
      </nav>

      {!sidebarCollapsed && (
        <div className="sidebar-accounts">
          <div className="account-status">
            <div className={`account-dot ${accounts.netease ? 'account-dot-active netease' : ''}`} />
            <span>网易云</span>
          </div>
          <div className="account-status">
            <div className={`account-dot ${accounts.qqmusic ? 'account-dot-active qqmusic' : ''}`} />
            <span>QQ音乐</span>
          </div>
        </div>
      )}

      <div className="sidebar-bottom">
        <button className="sidebar-btn" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="sidebar-btn sidebar-collapse-btn" onClick={toggleSidebar}>
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  )
}
