import { useState, useCallback, useRef } from 'react'
import { MusicSource, SearchResult, SearchRequest } from '@shared/types/streaming'

const PAGE_SIZE = 30

interface UseSearchReturn {
  results: SearchResult | null
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  search: (query: string, source?: MusicSource) => Promise<void>
  loadMore: () => Promise<void>
  clearResults: () => void
}

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastQueryRef = useRef<{ query: string; source: MusicSource } | null>(null)

  const search = useCallback(async (query: string, source: MusicSource = 'netease') => {
    if (!query.trim()) return

    lastQueryRef.current = { query: query.trim(), source }
    setIsLoading(true)
    setError(null)

    try {
      const request: SearchRequest = {
        query: query.trim(),
        source,
        type: ['track'],
        limit: PAGE_SIZE
      }

      const result = await window.api.streaming.search(request)
      setResults(result)
    } catch (err: any) {
      setError(err.message || 'Search failed')
      setResults(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    const last = lastQueryRef.current
    if (!last || isLoadingMore || !results || !results.hasMore) return

    setIsLoadingMore(true)
    setError(null)

    try {
      const request: SearchRequest = {
        query: last.query,
        source: last.source,
        type: ['track'],
        limit: PAGE_SIZE,
        offset: results.tracks.length
      }

      const more = await window.api.streaming.search(request)
      setResults(prev => {
        if (!prev) return more
        // Sources occasionally repeat items across pages
        const seen = new Set(prev.tracks.map(t => `${t.source}:${t.id}`))
        const fresh = more.tracks.filter(t => !seen.has(`${t.source}:${t.id}`))
        return { ...prev, tracks: [...prev.tracks, ...fresh], total: more.total, hasMore: more.hasMore }
      })
    } catch (err: any) {
      setError(err.message || '加载更多失败')
    } finally {
      setIsLoadingMore(false)
    }
  }, [results, isLoadingMore])

  const clearResults = useCallback(() => {
    setResults(null)
    setError(null)
    lastQueryRef.current = null
  }, [])

  const hasMore = !!results && results.tracks.length > 0 && results.hasMore

  return { results, isLoading, isLoadingMore, hasMore, error, search, loadMore, clearResults }
}
