/**
 * Genre blending + deck assembly logic.
 * Called from POST /api/deck — server-side only.
 */
import { tmdb } from './tmdb'
import type {
  DeckMovie,
  TMDBDiscoverResponse,
  TMDBMovieResult,
  TMDBVideosResponse,
} from '@/types'

const DECK_SIZE = 15
const TRAILER_CONCURRENCY = 5   // max parallel TMDB /videos requests (rate-limit courtesy)

/** Fisher-Yates shuffle (in-place) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Run an array of async tasks with a maximum concurrency cap.
 */
async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const task of tasks) {
    const p = task().then((r) => {
      results.push(r)
    })
    executing.push(p)

    if (executing.length >= limit) {
      await Promise.race(executing)
      // Remove settled promises
      executing.splice(
        0,
        executing.length,
        ...executing.filter((e) => {
          let settled = false
          e.then(() => { settled = true }).catch(() => { settled = true })
          return !settled
        })
      )
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * Fetch the YouTube trailer key for a movie.
 * Returns null if no official YouTube trailer is found.
 */
async function fetchTrailerKey(movieId: number): Promise<string | null> {
  try {
    const data = await tmdb<TMDBVideosResponse>(
      `/movie/${movieId}/videos`,
      {},
      false  // don't cache — per-movie, short-lived
    )
    const trailer = data.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
    ) ?? data.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    )
    return trailer?.key ?? null
  } catch {
    return null
  }
}

/**
 * Blend two genre ID arrays and assemble a 15-movie deck with trailers.
 *
 * Strategy:
 * 1. Merge + deduplicate genre IDs from both participants
 * 2. Call TMDB /discover/movie with pipe-separated genre IDs (OR logic)
 *    so movies matching ANY selected genre are included
 * 3. Fisher-Yates shuffle
 * 4. Take first 15
 * 5. Fetch trailer key per movie (max 5 concurrent requests)
 * 6. Return enriched DeckMovie[]
 */
export async function buildDeck(
  genresA: string[],
  genresB: string[]
): Promise<DeckMovie[]> {
  // 1. Merge and deduplicate
  const merged = Array.from(new Set([...genresA, ...genresB]))
  const withGenres = merged.join('|')  // pipe = OR logic in TMDB discover

  // 2. Discover movies
  const discovered = await tmdb<TMDBDiscoverResponse>(
    '/discover/movie',
    {
      with_genres: withGenres,
      sort_by: 'popularity.desc',
      'vote_average.gte': '6.5',
      'vote_count.gte': '200',
      page: '1',
    },
    false  // no ISR cache — each room needs a fresh deck
  )

  if (!discovered.results.length) {
    throw new Error('TMDB returned no movies for the selected genres')
  }

  // 3. Shuffle, take first DECK_SIZE
  const pool: TMDBMovieResult[] = shuffle([...discovered.results])
  const selected = pool.slice(0, DECK_SIZE)

  // 4. Fetch trailers with concurrency limit
  const trailerTasks = selected.map(
    (movie) => () => fetchTrailerKey(movie.id)
  )
  const trailerKeys = await withConcurrency(trailerTasks, TRAILER_CONCURRENCY)

  // 5. Assemble enriched DeckMovie objects
  const deck: DeckMovie[] = selected.map((movie, i) => ({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path ?? '',
    backdrop_path: movie.backdrop_path ?? '',
    overview: movie.overview,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    genre_ids: movie.genre_ids,
    trailer_key: trailerKeys[i] ?? null,
  }))

  return deck
}

/** Generate a unique 6-char room code (no ambiguous characters) */
export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}
