import { useState, useCallback } from 'react'
import { MusicSource, SearchResult, SearchRequest } from '@shared/types/streaming'

interface UseSearchReturn {
  results: SearchResult | null
  isLoading: boolean
  error: string | null
  search: (query: string, source?: MusicSource) => Promise<void>
  clearResults: () => void
}

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string, source: MusicSource = 'netease') => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const request: SearchRequest = {
        query: query.trim(),
        source,
        type: ['track'],
        limit: 30
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

  const clearResults = useCallback(() => {
    setResults(null)
    setError(null)
  }, [])

  return { results, isLoading, error, search, clearResults }
}
