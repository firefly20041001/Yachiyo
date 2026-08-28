import { MusicSource } from '@shared/types/streaming'
import { StreamingProvider } from './StreamingProvider'
import { NeteaseStreamingProvider } from './providers/NeteaseStreamingProvider'
import { QQMusicStreamingProvider } from './providers/QQMusicStreamingProvider'

export class StreamingProviderRegistry {
  private providers: Map<MusicSource, StreamingProvider> = new Map()

  constructor() {
    this.providers.set('netease', new NeteaseStreamingProvider())
    this.providers.set('qqmusic', new QQMusicStreamingProvider())
  }

  getProvider(source: MusicSource): StreamingProvider {
    const provider = this.providers.get(source)
    if (!provider) throw new Error(`Unknown streaming provider: ${source}`)
    return provider
  }

  getAllSources(): MusicSource[] {
    return Array.from(this.providers.keys())
  }
}

export const streamingRegistry = new StreamingProviderRegistry()
