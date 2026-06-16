'use client'

import { useCallback } from 'react'
import { SwipeCard } from './SwipeCard'
import { useSwipe } from '@/hooks/useSwipe'
import type { DeckMovie } from '@/types'

interface CardStackProps {
  deck: DeckMovie[]
  roomId: string
  deviceId: string
  onComplete: () => void
}

export function CardStack({ deck, roomId, deviceId, onComplete }: CardStackProps) {
  const { currentIndex, isComplete, submitSwipe } = useSwipe(deck.length)

  const handleSwipe = useCallback(
    async (liked: boolean) => {
      const movie = deck[currentIndex]
      if (!movie) return

      await submitSwipe(roomId, deviceId, movie.id, liked)

      // Check if this was the last card
      if (currentIndex + 1 >= deck.length) {
        onComplete()
      }
    },
    [deck, currentIndex, submitSwipe, roomId, deviceId, onComplete]
  )

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="font-display text-4xl" style={{ color: 'var(--app-text)' }}>
          All done!
        </p>
        <p className="font-body text-sm" style={{ color: 'var(--app-text-2)' }}>
          Checking matches…
        </p>
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mt-2"
          style={{ borderColor: 'var(--app-accent)', borderTopColor: 'transparent' }}
          role="status"
          aria-label="Checking matches"
        />
      </div>
    )
  }

  // Render top 3 cards for stack-depth illusion
  const visibleCards = deck.slice(currentIndex, currentIndex + 3)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card stack */}
      <div
        className="relative"
        style={{ width: 'min(320px, 90vw)', height: '480px' }}
        aria-label={`Movie card: ${deck[currentIndex]?.title}`}
      >
        {/* Render from bottom-most to top so the top card is on top */}
        {[...visibleCards].reverse().map((movie, reverseIdx) => {
          const stackIndex = visibleCards.length - 1 - reverseIdx
          return (
            <SwipeCard
              key={movie.id}
              movie={movie}
              onSwipe={handleSwipe}
              isTop={stackIndex === 0}
              stackIndex={stackIndex}
            />
          )
        })}
      </div>

      {/* Like / Pass action buttons */}
      <div className="flex items-center gap-6">
        {/* Pass */}
        <button
          onClick={() => handleSwipe(false)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ background: 'var(--app-surface)', color: 'var(--app-pass)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
          aria-label="Pass"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Progress indicator */}
        <span className="font-body text-xs tabular-nums" style={{ color: 'var(--app-text-2)' }}>
          {currentIndex + 1} / {deck.length}
        </span>

        {/* Like */}
        <button
          onClick={() => handleSwipe(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ background: 'var(--app-surface)', color: 'var(--app-accent)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
          aria-label="Like"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
