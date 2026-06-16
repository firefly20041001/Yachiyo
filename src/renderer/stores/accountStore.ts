import { create } from 'zustand'
import { AccountProvider, AccountInfo } from '@shared/types/accounts'

interface AccountState {
  accounts: Record<AccountProvider, AccountInfo | null>
  isLoading: boolean

  setAccounts: (accounts: Record<AccountProvider, AccountInfo | null>) => void
  setLoading: (loading: boolean) => void
  refreshAccounts: () => Promise<void>
  logout: (provider: AccountProvider) => Promise<void>
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: { netease: null, qqmusic: null },
  isLoading: false,

  setAccounts: (accounts) => set({ accounts }),
  setLoading: (loading) => set({ isLoading: loading }),

  refreshAccounts: async () => {
    set({ isLoading: true })
    try {
      const accounts = await window.api.accounts.getAll()
      set({ accounts })
    } catch (err) {
      console.error('Failed to refresh accounts:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async (provider) => {
    try {
      await window.api.accounts.logout(provider)
      set((state) => ({
        accounts: { ...state.accounts, [provider]: null }
      }))
    } catch (err) {
      console.error('Failed to logout:', err)
    }
  }
}))
