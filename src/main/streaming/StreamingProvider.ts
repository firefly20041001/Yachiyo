import {
  MusicSource,
  QualityLevel,
  Track,
  Album,
  Artist,
  Playlist,
  SearchResult,
  SearchRequest,
  PlaybackInfo,
  StreamingProviderInterface
} from '@shared/types/streaming'
import { accountService } from '../accounts/AccountService'

export abstract class StreamingProvider implements StreamingProviderInterface {
  abstract source: MusicSource

  abstract search(request: SearchRequest): Promise<SearchResult>
  abstract getTrack(id: string): Promise<Track>
  abstract resolvePlayback(id: string, quality: QualityLevel): Promise<PlaybackInfo>
  abstract getPlaylist(id: string): Promise<Playlist>
  abstract getUserPlaylists(userId: string): Promise<Playlist[]>
  abstract getLikedSongs(userId: string): Promise<Track[]>
  abstract getAlbum(id: string): Promise<Album>
  abstract getArtist(id: string): Promise<Artist>

  protected getCookie(): string | null {
    return accountService.getCookie(this.source as any)
  }
}
