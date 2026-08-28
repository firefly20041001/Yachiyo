import { ipcMain } from 'electron'
import { playlistService } from '../playlist/PlaylistService'
import { MusicSource, Track, Playlist } from '@shared/types/streaming'
import { PlaylistSyncRequest } from '@shared/types/playlist'

export function registerPlaylistIPC(): void {
  ipcMain.handle('playlist:getAll', async () => playlistService.getAll())
  ipcMain.handle('playlist:getById', async (_event, id: string) => playlistService.getById(id))
  ipcMain.handle('playlist:create', async (_event, name: string) => playlistService.create(name))
  ipcMain.handle('playlist:createFromRemote', async (_event, playlist: Playlist, sourceUrl?: string) => playlistService.createFromRemote(playlist, sourceUrl))
  ipcMain.handle('playlist:delete', async (_event, id: string) => playlistService.delete(id))
  ipcMain.handle('playlist:sync', async (_event, request: PlaylistSyncRequest) => playlistService.syncPlaylist(request))
  ipcMain.handle('playlist:refresh', async (_event, id: string) => playlistService.refreshPlaylist(id))
  ipcMain.handle('playlist:addTrack', async (_event, playlistId: string, track: Track) => playlistService.addTrack(playlistId, track))
  ipcMain.handle('playlist:removeTrack', async (_event, playlistId: string, trackId: string) => playlistService.removeTrack(playlistId, trackId))
}
