import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = '搜索歌曲、歌手、专辑...' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { searchQuery } = useUIStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  // Sync searchQuery from store to local state
  useEffect(() => {
    if (searchQuery) {
      setQuery(searchQuery)
    }
  }, [searchQuery])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFocused])

  return (
    <form className={`search-bar ${isFocused ? 'search-bar-focused' : ''}`} onSubmit={handleSubmit}>
      <Search size={18} className="search-icon" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="search-input"
      />
      <AnimatePresence>
        {query && (
          <motion.button
            type="button"
            className="search-clear"
            onClick={handleClear}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <X size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </form>
  )
}
