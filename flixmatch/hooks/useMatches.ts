'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match } from '@/types'

interface UseMatchesReturn {
  matches: Match[]
  latestMatch: Match | null
  clearLatest: () => void
}

export function useMatches(roomId: string): UseMatchesReturn {
  const [matches, setMatches] = useState<Match[]>([])
  const [latestMatch, setLatestMatch] = useState<Match | null>(null)

  useEffect(() => {
    if (!roomId) return

    const supabase = createClient()

    // Fetch existing matches on mount
    supabase
      .from('matches')
      .select('*')
      .eq('room_id', roomId)
      .order('matched_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMatches(data as Match[])
      })

    // Subscribe to new matches in real-time via Supabase Realtime
    // Requires the `matches` table to have Realtime enabled in Supabase Dashboard
    const channel = supabase
      .channel(`matches:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const match = payload.new as Match
          setMatches((prev) => [...prev, match])
          setLatestMatch(match) // triggers <MatchOverlay>
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const clearLatest = useCallback(() => setLatestMatch(null), [])

  return { matches, latestMatch, clearLatest }
}
