import { useAccountStore } from '../stores/accountStore'
import { AccountProvider } from '@shared/types/accounts'

export function useAccount() {
  const store = useAccountStore()

  const isLoggedIn = (provider: AccountProvider): boolean => {
    return store.accounts[provider] !== null
  }

  const hasAnyAccount = (): boolean => {
    return store.accounts.netease !== null || store.accounts.qqmusic !== null
  }

  return {
    ...store,
    isLoggedIn,
    hasAnyAccount
  }
}
