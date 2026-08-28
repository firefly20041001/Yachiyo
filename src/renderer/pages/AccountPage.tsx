import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccountStore } from '../stores/accountStore'
import { AccountCard } from '../components/account/AccountCard'

export function AccountPage() {
  const { accounts, refreshAccounts } = useAccountStore()

  useEffect(() => {
    refreshAccounts()
  }, [])

  return (
    <div className="page account-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>账号管理</h1>
        <p className="page-subtitle">登录音乐平台账号以同步歌单和收藏</p>
      </motion.div>

      <div className="account-cards">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AccountCard provider="netease" account={accounts.netease} onRefresh={refreshAccounts} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AccountCard provider="qqmusic" account={accounts.qqmusic} onRefresh={refreshAccounts} />
        </motion.div>
      </div>
    </div>
  )
}
