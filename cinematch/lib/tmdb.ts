/**
 * TMDB API helpers — server-side only.
 * The TMDB_API_KEY env var must never reach the browser.
 */

const BASE = 'https://api.themoviedb.org/3'
const KEY = process.env.TMDB_API_KEY!

/**
 * Generic typed fetch against the TMDB API.
 * Uses Next.js fetch caching (`revalidate`) for ISR-style caching.
 */
export async function tmdb<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate: number | false = 3600
): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  })

  if (!res.ok) {
    throw new Error(`TMDB error ${res.status} on ${path}`)
  }

  return res.json() as Promise<T>
}

/**
 * Build a full TMDB poster/backdrop image URL.
 * @param path   - The path from TMDB (e.g. "/abc123.jpg")
 * @param size   - TMDB image size token (default "w500")
 */
export const posterUrl = (path: string, size = 'w500') =>
  `https://image.tmdb.org/t/p/${size}${path}`
