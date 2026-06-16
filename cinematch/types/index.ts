// ============================================================
// Shared TypeScript types for CineMatch
// ============================================================

/** Phase of a room's lifecycle */
export type RoomPhase = 'genre_pick' | 'waiting' | 'swiping' | 'done'

/** A movie stored in rooms.deck — enriched TMDB object */
export interface DeckMovie {
  id: number
  title: string
  poster_path: string
  backdrop_path: string
  overview: string
  release_date: string        // "YYYY-MM-DD"
  vote_average: number
  genre_ids: number[]
  trailer_key: string | null  // YouTube video key, null if not found
}

/** Row from the `rooms` table */
export interface Room {
  id: string
  code: string
  deck: DeckMovie[]
  phase: RoomPhase
  genres_a: string[] | null
  genres_b: string[] | null
  created_at: string
}

/** Row from the `participants` table */
export interface Participant {
  id: string
  room_id: string
  device_id: string
  joined_at: string
}

/** Row from the `swipes` table */
export interface Swipe {
  id: string
  room_id: string
  device_id: string
  movie_id: number
  liked: boolean
  created_at: string
}

/** Row from the `matches` table */
export interface Match {
  id: string
  room_id: string
  movie_id: number
  movie_data: DeckMovie
  matched_at: string
}

/** TMDB genre object */
export interface Genre {
  id: number
  name: string
}

/** TMDB /genre/movie/list response */
export interface TMDBGenreListResponse {
  genres: Genre[]
}

/** TMDB /discover/movie response */
export interface TMDBDiscoverResponse {
  page: number
  results: TMDBMovieResult[]
  total_pages: number
  total_results: number
}

export interface TMDBMovieResult {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
}

/** TMDB /movie/{id}/videos response */
export interface TMDBVideosResponse {
  id: number
  results: TMDBVideoResult[]
}

export interface TMDBVideoResult {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

/** POST /api/rooms response */
export interface CreateRoomResponse {
  id: string
  code: string
}

/** POST /api/deck request body */
export interface BuildDeckBody {
  roomId: string
  genresA: string[]
  genresB: string[]
}
