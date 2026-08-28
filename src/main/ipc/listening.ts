import { ipcMain } from 'electron'
import { listeningDB } from '../database'
import { ListeningEvent, UserProfile } from '@shared/types/listening'

export function registerListeningIPC(): void {
  ipcMain.handle('listening:addEvent', (_event, event: ListeningEvent) => {
    listeningDB.addEvent(event)
  })

  ipcMain.handle('listening:getEvents', (): ListeningEvent[] => {
    return listeningDB.getEvents()
  })

  ipcMain.handle('listening:getProfile', (): UserProfile | null => {
    return listeningDB.getProfile()
  })

  ipcMain.handle('listening:setProfile', (_event, profile: UserProfile) => {
    listeningDB.setProfile(profile)
  })

  ipcMain.handle('listening:clear', () => {
    listeningDB.clear()
  })
}