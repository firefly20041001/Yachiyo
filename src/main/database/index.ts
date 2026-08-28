import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface AccountRecord {
  cookie: string
  userId?: string
  displayName?: string
  avatarUrl?: string
  lastLoginAt?: number
  updatedAt?: number
}

interface PlaylistTrack {
  trackId: string
  trackSource: string
  trackName: string
  trackArtists: string
  trackAlbum: string
  trackCover: string
  trackDuration: number
  origin: 'import' | 'manual' // Track origin: imported or manually added
  matchedTrackId?: string
  matchedTrackSource?: string
  matchConfidence?: number
  addedAt: number
}

interface PlaylistRecord {
  id: string
  name: string
  description: string
  coverUrl: string
  source: string
  sourcePlaylistId: string
  sourceType: 'local' | 'import'
  sourceUrl?: string
  tracks: PlaylistTrack[]
  lastSyncedAt: number
  createdAt: number
}

interface StoreSchema {
  accounts: Record<string, AccountRecord>
  playlists: Record<string, PlaylistRecord>
}

let dataDir: string = ''
let storeCache: StoreSchema | null = null

function getDataDir(): string {
  if (!dataDir) {
    dataDir = join(app.getPath('userData'), 'yachiyo-data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }
  return dataDir
}

function getStorePath(): string {
  return join(getDataDir(), 'store.json')
}

function loadStore(): StoreSchema {
  if (storeCache) return storeCache

  const storePath = getStorePath()
  if (existsSync(storePath)) {
    try {
      storeCache = JSON.parse(readFileSync(storePath, 'utf-8'))
    } catch {
      storeCache = { accounts: {}, playlists: {} }
    }
  } else {
    storeCache = { accounts: {}, playlists: {} }
  }

  return storeCache!
}

function saveStore(): void {
  if (!storeCache) return
  writeFileSync(getStorePath(), JSON.stringify(storeCache, null, 2), 'utf-8')
}

// Account operations
export const accountDB = {
  get(provider: string): AccountRecord | undefined {
    const store = loadStore()
    return store.accounts[provider]
  },

  set(provider: string, record: AccountRecord): void {
    const store = loadStore()
    store.accounts[provider] = record
    saveStore()
  },

  delete(provider: string): void {
    const store = loadStore()
    delete store.accounts[provider]
    saveStore()
  },

  getAll(): Record<string, AccountRecord> {
    return loadStore().accounts
  }
}

// Playlist operations
export const playlistDB = {
  get(id: string): PlaylistRecord | undefined {
    const store = loadStore()
    return store.playlists[id]
  },

  set(id: string, record: PlaylistRecord): void {
    const store = loadStore()
    store.playlists[id] = record
    saveStore()
  },

  delete(id: string): void {
    const store = loadStore()
    delete store.playlists[id]
    saveStore()
  },

  getAll(): PlaylistRecord[] {
    const store = loadStore()
    return Object.values(store.playlists).sort((a, b) => b.createdAt - a.createdAt)
  },

  findBySource(source: string, sourcePlaylistId: string): PlaylistRecord | undefined {
    const store = loadStore()
    return Object.values(store.playlists).find(
      (p) => p.source === source && p.sourcePlaylistId === sourcePlaylistId
    )
  }
}

// Simple key-value store for settings
const settingsCache: Record<string, any> = {}
const settingsPath = (): string => join(getDataDir(), 'settings.json')

function loadSettings(): Record<string, any> {
  if (Object.keys(settingsCache).length > 0) return settingsCache
  const p = settingsPath()
  if (existsSync(p)) {
    try {
      const data = JSON.parse(readFileSync(p, 'utf-8'))
      Object.assign(settingsCache, data)
    } catch {}
  }
  return settingsCache
}

function saveSettings(): void {
  writeFileSync(settingsPath(), JSON.stringify(settingsCache, null, 2), 'utf-8')
}

export const settingsDB = {
  get(key: string, defaultValue?: any): any {
    const settings = loadSettings()
    return settings[key] !== undefined ? settings[key] : defaultValue
  },
  set(key: string, value: any): void {
    settingsCache[key] = value
    saveSettings()
  }
}
