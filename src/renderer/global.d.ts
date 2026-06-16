import { ElectronAPI } from '../preload/apiTypes'

declare global {
  interface Window {
    api: ElectronAPI
  }
}
