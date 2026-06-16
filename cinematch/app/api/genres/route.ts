import { NextResponse } from 'next/server'
import { tmdb } from '@/lib/tmdb'
import type { TMDBGenreListResponse } from '@/types'

// ── GET /api/genres ──────────────────────────────────────────────────────────
// Proxies TMDB /genre/movie/list.
// Cached for 24 hours via Next.js ISR — genres rarely change.
export async function GET() {
  try {
    // revalidate: 86400 = 24 hours (set inside tmdb helper call)
    const data = await tmdb<TMDBGenreListResponse>(
      '/genre/movie/list',
      {},
      86400
    )
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
