'use client'

import { useEffect, useState } from 'react'
import type { Genre } from '@/types'

interface GenrePickerProps {
  onSubmit: (selectedGenreIds: string[]) => void
  disabled?: boolean
}

const MAX_GENRES = 3

export function GenrePicker({ onSubmit, disabled = false }: GenrePickerProps) {
  const [genres, setGenres] = useState<Genre[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/genres')
      .then((r) => r.json())
      .then((data) => {
        setGenres(data.genres ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load genres')
        setLoading(false)
      })
  }, [])

  function toggle(id: number) {
    if (disabled) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_GENRES) {
        next.add(id)
      }
      return next
    })
  }

  function handleSubmit() {
    if (selected.size === 0 || disabled) return
    onSubmit(Array.from(selected).map(String))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12" aria-label="Loading genres">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--app-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-center font-body text-sm py-8" style={{ color: 'var(--app-pass)' }}>
        {error}
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div className="text-center">
        <h2 className="font-display text-3xl" style={{ color: 'var(--app-text)' }}>
          Pick your genres
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--app-text-2)' }}>
          Choose up to {MAX_GENRES} — we&apos;ll blend yours with your partner&apos;s
        </p>
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {genres.map((genre) => {
          const isSelected = selected.has(genre.id)
          const isDisabled = !isSelected && selected.size >= MAX_GENRES
          return (
            <button
              key={genre.id}
              onClick={() => toggle(genre.id)}
              disabled={isDisabled || disabled}
              aria-pressed={isSelected}
              className="px-4 py-2 rounded-full text-sm font-body transition-all"
              style={{
                background: isSelected ? 'var(--app-accent)' : 'var(--app-surface)',
                color: isSelected ? 'var(--app-on-accent)' : 'var(--app-text)',
                border: '1px solid var(--app-border)',
                opacity: isDisabled ? 0.4 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {genre.name}
            </button>
          )
        })}
      </div>

      {/* Selected count */}
      <p className="font-body text-xs" style={{ color: 'var(--app-text-2)' }}>
        {selected.size} / {MAX_GENRES} selected
      </p>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={selected.size === 0 || disabled}
        className="px-8 py-3 rounded-full font-body font-semibold text-sm transition-opacity"
        style={{
          background: 'var(--app-accent)',
          color: 'var(--app-on-accent)',
          opacity: selected.size === 0 || disabled ? 0.4 : 1,
          cursor: selected.size === 0 || disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Let&apos;s go →
      </button>
    </div>
  )
}
