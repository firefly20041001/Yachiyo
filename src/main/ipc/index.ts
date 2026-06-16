import { registerAccountIPC } from './accounts'
import { registerStreamingIPC } from './streaming'
import { registerLyricsIPC } from './lyrics'
import { registerPlaylistIPC } from './playlist'

export function registerAllIPC(): void {
  registerAccountIPC()
  registerStreamingIPC()
  registerLyricsIPC()
  registerPlaylistIPC()
}
