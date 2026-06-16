import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { AccountProvider, LoginQRCode } from '@shared/types/accounts'
import { GlassPanel } from '../common/GlassPanel'

interface QRCodeLoginModalProps {
  provider: AccountProvider
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function QRCodeLoginModal({ provider, isOpen, onClose, onSuccess }: QRCodeLoginModalProps) {
  const [qrCode, setQrCode] = useState<LoginQRCode | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  const providerNames: Record<AccountProvider, string> = {
    netease: '网易云音乐',
    qqmusic: 'QQ音乐'
  }

  const generateQR = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const qr = await window.api.accounts.generateQRCode(provider)
      setQrCode(qr)
      setStatus('ready')
    } catch (err: any) {
      setError(err.message || '生成二维码失败')
      setStatus('error')
    }
  }, [provider])

  useEffect(() => {
    if (isOpen) {
      generateQR()
    }
  }, [isOpen, generateQR])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel intensity="heavy" className="login-modal">
            <div className="login-modal-header">
              <h2>登录 {providerNames[provider]}</h2>
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="login-modal-body">
              {status === 'loading' && (
                <div className="qr-loading">
                  <Loader2 size={48} className="spin" />
                  <p>正在生成二维码...</p>
                </div>
              )}

              {status === 'ready' && qrCode && (
                <div className="qr-display">
                  <div className="qr-image-container">
                    <img src={qrCode.qrurl} alt="QR Code" className="qr-image" />
                  </div>
                  <p className="qr-tip">请使用 {providerNames[provider]} App 扫码登录</p>
                  <p className="qr-tip" style={{ fontSize: 12, opacity: 0.6 }}>扫码后请在手机上确认登录</p>
                </div>
              )}

              {status === 'error' && (
                <div className="qr-error">
                  <AlertCircle size={48} className="warning-icon" />
                  <p>{error || '生成二维码失败'}</p>
                  <p style={{ fontSize: 12, opacity: 0.6 }}>请检查网络连接后重试</p>
                  <button className="btn btn-primary" onClick={generateQR} style={{ marginTop: 12 }}>
                    <RefreshCw size={16} />
                    重试
                  </button>
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
