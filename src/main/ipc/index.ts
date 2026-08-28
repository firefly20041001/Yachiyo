import { registerAccountIPC } from './accounts'
import { registerStreamingIPC } from './streaming'
import { registerLyricsIPC } from './lyrics'
import { registerPlaylistIPC } from './playlist'
import { registerDevicesIPC } from './devices'
import { registerListeningIPC } from './listening'

export function registerAllIPC(): void {
  registerAccountIPC()
  registerStreamingIPC()
  registerLyricsIPC()
  registerPlaylistIPC()
  registerDevicesIPC()
  registerListeningIPC()
}