import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in Server Components, API Routes,
 * and Server Actions. Reads/writes cookies for session management.
 *
 * CineMatch is auth-free (anonymous device_id), but we still need a
 * server client to talk to Supabase from API routes.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // set() can throw in read-only contexts (e.g. Server Components)
            // Safe to ignore — no auth session to maintain
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Same — safe to ignore in read-only contexts
          }
        },
      },
    }
  )
}
