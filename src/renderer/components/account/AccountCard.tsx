import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, LogOut, User, RefreshCw, Loader2 } from 'lucide-react'
import { AccountProvider, AccountInfo } from '@shared/types/accounts'
import { GlassPanel } from '../common/GlassPanel'

interface AccountCardProps {
  provider: AccountProvider
  account: AccountInfo | null
  onRefresh: () => void
}

export function AccountCard({ provider, account, onRefresh }: AccountCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const providerNames: Record<AccountProvider, string> = {
    netease: '网易云音乐',
    qqmusic: 'QQ音乐'
  }

  const providerColors: Record<AccountProvider, string> = {
    netease: '#e60026',
    qqmusic: '#31c27c'
  }

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const success = await window.api.accounts.openLogin(provider)
      if (success) {
        onRefresh()
      }
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await window.api.accounts.logout(provider)
    onRefresh()
  }

  return (
    <GlassPanel intensity="medium" className="account-card">
      <div className="account-card-header">
        <div
          className="account-provider-icon"
          style={{ backgroundColor: providerColors[provider] + '20', color: providerColors[provider] }}
        >
          {provider === 'netease' ? '网' : 'Q'}
        </div>
        <h3>{providerNames[provider]}</h3>
      </div>

      {account ? (
        <div className="account-card-body">
          <div className="account-avatar">
            {account.avatarUrl ? (
              <img src={account.avatarUrl} alt={account.displayName} />
            ) : (
              <User size={32} />
            )}
          </div>
          <div className="account-info">
            <div className="account-name">{account.displayName}</div>
            <div className="account-id">ID: {account.userId}</div>
          </div>
          <div className="account-actions">
            <button className="btn btn-ghost" onClick={onRefresh}>
              <RefreshCw size={16} />
            </button>
            <button className="btn btn-danger" onClick={handleLogout}>
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </div>
      ) : (
        <div className="account-card-body account-card-empty">
          <p>未登录</p>
          <button className="btn btn-primary" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
            {isLoading ? '正在打开登录页面...' : '打开登录页面'}
          </button>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
            将打开{providerNames[provider]}官网，请在网页中登录
          </p>
        </div>
      )}
    </GlassPanel>
  )
}
