'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseSwipeReturn {
  currentIndex: number
  isComplete: boolean
  submitSwipe: (roomId: string, deviceId: string, movieId: number, liked: boolean) => Promise<void>
}

export function useSwipe(deckSize: number): UseSwipeReturn {
  const [currentIndex, setCurrentIndex] = useState(0)

  const submitSwipe = useCallback(
    async (roomId: string, deviceId: string, movieId: number, liked: boolean) => {
      const supabase = createClient()

      // Insert swipe; ignore if already recorded (idempotent)
      const { error } = await supabase
        .from('swipes')
        .upsert(
          { room_id: roomId, device_id: deviceId, movie_id: movieId, liked },
          { onConflict: 'room_id,device_id,movie_id' }
        )

      if (error) {
        console.error('Failed to record swipe:', error.message)
        // Don't throw — swipe UX should continue even if the write fails momentarily
      }

      setCurrentIndex((prev) => prev + 1)
    },
    []
  )

  return {
    currentIndex,
    isComplete: currentIndex >= deckSize,
    submitSwipe,
  }
}
