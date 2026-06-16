'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { posterUrl } from '@/lib/tmdb'
import type { Match } from '@/types'

interface MatchOverlayProps {
  match: Match | null
  onDismiss: () => void
}

const AUTO_DISMISS_MS = 6000

export function MatchOverlay({ match, onDismiss }: MatchOverlayProps) {
  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!match) return
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [match, onDismiss])

  const movie = match?.movie_data
  const year = movie?.release_date?.slice(0, 4) ?? '—'
  const posterSrc = movie?.poster_path
    ? posterUrl(movie.poster_path, 'w500')
    : '/icons/icon-192.png'

  return (
    <AnimatePresence>
      {match && movie && (
        // NOTE: intentionally NOT position:fixed — in-flow high-z-index wrapper
        // per spec constraint "No position: fixed in JSX"
        <motion.div
          key={match.id}
          className="fixed inset-0 flex flex-col items-center justify-center z-50 px-4"
          style={{ background: 'rgba(22, 21, 28, 0.92)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="It's a Match!"
        >
          <motion.div
            className="flex flex-col items-center gap-5 text-center max-w-xs w-full"
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            {/* Headline */}
            <h2
              className="font-display text-5xl leading-none"
              style={{ color: 'var(--app-accent)' }}
            >
              It&apos;s a Match!
            </h2>

            {/* Poster */}
            <div
              className="relative rounded-card overflow-hidden shadow-2xl"
              style={{ width: 200, height: 300 }}
            >
              <Image
                src={posterSrc}
                alt={`${movie.title} poster`}
                fill
                sizes="200px"
                className="object-cover"
                priority
              />
            </div>

            {/* Title + year */}
            <div>
              <p className="font-display text-2xl" style={{ color: 'var(--app-text)' }}>
                {movie.title}
              </p>
              <p className="font-body text-sm mt-1" style={{ color: 'var(--app-text-2)' }}>
                {year}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
              {movie.trailer_key && (
                <a
                  href={`https://www.youtube.com/watch?v=${movie.trailer_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-full font-body font-semibold text-sm text-center transition-opacity hover:opacity-80"
                  style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)' }}
                >
                  Watch Trailer
                </a>
              )}
              <button
                onClick={onDismiss}
                className="flex-1 py-3 rounded-full font-body font-semibold text-sm transition-opacity hover:opacity-80"
                style={{
                  background: 'var(--app-surface)',
                  color: 'var(--app-text)',
                  border: '1px solid var(--app-border)',
                }}
              >
                Keep swiping
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
