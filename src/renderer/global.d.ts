declare const __APP_VERSION__: string

import { ElectronAPI } from '../preload/apiTypes'

declare global {
  interface Window {
    api: ElectronAPI
  }
}
