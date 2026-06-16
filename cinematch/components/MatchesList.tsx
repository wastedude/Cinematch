'use client'

import Image from 'next/image'
import { posterUrl } from '@/lib/tmdb'
import type { Match } from '@/types'

interface MatchesListProps {
  matches: Match[]
}

export function MatchesList({ matches }: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
        <p className="font-display text-3xl" style={{ color: 'var(--app-text)' }}>
          No matches this time
        </p>
        <p className="font-body text-sm" style={{ color: 'var(--app-text-2)' }}>
          You and your partner had different tastes — try again!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto px-4 pb-8">
      <h2
        className="font-display text-3xl text-center pt-4"
        style={{ color: 'var(--app-text)' }}
      >
        Your Matches
      </h2>
      <p className="font-body text-sm text-center mb-2" style={{ color: 'var(--app-text-2)' }}>
        {matches.length} movie{matches.length !== 1 ? 's' : ''} you both liked
      </p>

      <ul className="flex flex-col gap-3" role="list" aria-label="Matched movies">
        {matches.map((match) => {
          const movie = match.movie_data
          const year = movie.release_date?.slice(0, 4) ?? '—'
          const rating = movie.vote_average?.toFixed(1) ?? '—'
          const posterSrc = movie.poster_path
            ? posterUrl(movie.poster_path, 'w154')
            : '/icons/icon-192.png'

          return (
            <li
              key={match.id}
              className="flex gap-3 rounded-card overflow-hidden"
              style={{ background: 'var(--app-surface)' }}
            >
              {/* Poster thumbnail */}
              <div className="relative shrink-0" style={{ width: 64, height: 96 }}>
                <Image
                  src={posterSrc}
                  alt={`${movie.title} poster`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center gap-1 py-3 pr-4 min-w-0">
                <p
                  className="font-display text-xl leading-tight truncate"
                  style={{ color: 'var(--app-text)' }}
                >
                  {movie.title}
                </p>
                <p className="font-body text-xs" style={{ color: 'var(--app-text-2)' }}>
                  {year} &middot;{' '}
                  <span style={{ color: 'var(--app-accent)' }}>★ {rating}</span>
                </p>

                {/* Trailer link */}
                {movie.trailer_key && (
                  <a
                    href={`https://www.youtube.com/watch?v=${movie.trailer_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-xs mt-1 inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: 'var(--app-accent)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Watch Trailer
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
