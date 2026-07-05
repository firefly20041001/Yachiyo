import { contextBridge, ipcRenderer } from 'electron'
import { ElectronAPI } from './apiTypes'

const api: ElectronAPI = {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },

  tray: {
    onTogglePlay: (cb) => { ipcRenderer.removeAllListeners('tray:togglePlay'); ipcRenderer.on('tray:togglePlay', () => cb()) },
    onNext: (cb) => { ipcRenderer.removeAllListeners('tray:next'); ipcRenderer.on('tray:next', () => cb()) },
    onPrev: (cb) => { ipcRenderer.removeAllListeners('tray:prev'); ipcRenderer.on('tray:prev', () => cb()) },
    updateTrack: (trackName, artist) => ipcRenderer.send('tray:updateTrack', trackName, artist),
    updatePlayingState: (isPlaying) => ipcRenderer.send('playback:stateChanged', isPlaying),
    updateCover: (coverUrl) => ipcRenderer.send('thumbnailbar:updateCover', coverUrl)
  },

  lyricsWindow: {
    show: () => ipcRenderer.invoke('lyrics-window:show'),
    hide: () => ipcRenderer.invoke('lyrics-window:hide'),
    toggle: () => ipcRenderer.invoke('lyrics-window:toggle'),
    isVisible: () => ipcRenderer.invoke('lyrics-window:isVisible'),
    getSettings: () => ipcRenderer.invoke('lyrics-settings:get'),
    setSetting: (key, value) => ipcRenderer.invoke('lyrics-settings:set', key, value),
    onUpdate: (cb) => { ipcRenderer.removeAllListeners('lyrics:update'); ipcRenderer.on('lyrics:update', (_e, data) => cb(data)) },
    onSettings: (cb) => { ipcRenderer.removeAllListeners('lyrics:settings'); ipcRenderer.on('lyrics:settings', (_e, s) => cb(s)) },
    onSettingsChanged: (cb) => { ipcRenderer.removeAllListeners('lyrics-settings:changed'); ipcRenderer.on('lyrics-settings:changed', (_e, s) => cb(s)) },
    updateLine: (line, translation) => ipcRenderer.send('lyrics:updateLine', line, translation)
  },

  settings: {
    get: (key, defaultValue) => ipcRenderer.invoke('settings:get', key, defaultValue),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value)
  },

  shortcuts: {
    get: () => ipcRenderer.invoke('shortcuts:get'),
    set: (config) => ipcRenderer.invoke('shortcuts:set', config),
    reset: () => ipcRenderer.invoke('shortcuts:reset'),
    onTogglePlay: (cb) => { ipcRenderer.removeAllListeners('shortcut:togglePlay'); ipcRenderer.on('shortcut:togglePlay', () => cb()) },
    onNext: (cb) => { ipcRenderer.removeAllListeners('shortcut:next'); ipcRenderer.on('shortcut:next', () => cb()) },
    onPrev: (cb) => { ipcRenderer.removeAllListeners('shortcut:prev'); ipcRenderer.on('shortcut:prev', () => cb()) },
    onVolumeUp: (cb) => { ipcRenderer.removeAllListeners('shortcut:volumeUp'); ipcRenderer.on('shortcut:volumeUp', () => cb()) },
    onVolumeDown: (cb) => { ipcRenderer.removeAllListeners('shortcut:volumeDown'); ipcRenderer.on('shortcut:volumeDown', () => cb()) },
    onToggleLyrics: (cb) => { ipcRenderer.removeAllListeners('shortcut:toggleLyrics'); ipcRenderer.on('shortcut:toggleLyrics', () => cb()) }
  },

  devices: {
    getAudioOutput: () => ipcRenderer.invoke('devices:getAudioOutput'),
    getCurrentOutput: () => ipcRenderer.invoke('devices:getCurrentOutput'),
    setAudioOutput: (deviceId) => ipcRenderer.invoke('devices:setAudioOutput', deviceId),
    startListening: () => ipcRenderer.invoke('devices:startListening'),
    onChanged: (cb) => { ipcRenderer.removeAllListeners('devices:changed'); ipcRenderer.on('devices:changed', () => cb()) }
  },

  accounts: {
    openLogin: (provider) => ipcRenderer.invoke('accounts:openLogin', provider),
    getAll: () => ipcRenderer.invoke('accounts:getAll'),
    getInfo: (provider) => ipcRenderer.invoke('accounts:getInfo', provider),
    logout: (provider) => ipcRenderer.invoke('accounts:logout', provider),
    closeLogin: () => ipcRenderer.invoke('accounts:closeLogin')
  },

  streaming: {
    search: (request) => ipcRenderer.invoke('streaming:search', request),
    getTrack: (source, id) => ipcRenderer.invoke('streaming:getTrack', source, id),
    resolvePlayback: (source, id, quality) =>
      ipcRenderer.invoke('streaming:resolvePlayback', source, id, quality),
    getPlaylist: (source, id) => ipcRenderer.invoke('streaming:getPlaylist', source, id),
    getUserPlaylists: (source, userId) =>
      ipcRenderer.invoke('streaming:getUserPlaylists', source, userId),
    getLikedSongs: (source, userId) =>
      ipcRenderer.invoke('streaming:getLikedSongs', source, userId),
    getAlbum: (source, id) => ipcRenderer.invoke('streaming:getAlbum', source, id),
    getToplist: (topid, limit) => ipcRenderer.invoke('streaming:getToplist', topid, limit),
    getDailyRecommend: (source) => ipcRenderer.invoke('streaming:getDailyRecommend', source)
  },

  lyrics: {
    getLyrics: (request) => ipcRenderer.invoke('lyrics:getLyrics', request)
  },

  playlist: {
    getAll: () => ipcRenderer.invoke('playlist:getAll'),
    getById: (id) => ipcRenderer.invoke('playlist:getById', id),
    createFromRemote: (playlist, sourceUrl) => ipcRenderer.invoke('playlist:createFromRemote', playlist, sourceUrl),
    create: (name) => ipcRenderer.invoke('playlist:create', name),
    delete: (id) => ipcRenderer.invoke('playlist:delete', id),
    sync: (request) => ipcRenderer.invoke('playlist:sync', request),
    refresh: (id) => ipcRenderer.invoke('playlist:refresh', id),
    addTrack: (playlistId, track) => ipcRenderer.invoke('playlist:addTrack', playlistId, track),
    removeTrack: (playlistId, trackId) =>
      ipcRenderer.invoke('playlist:removeTrack', playlistId, trackId)
  }
}

contextBridge.exposeInMainWorld('api', api)
