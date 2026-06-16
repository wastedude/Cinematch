'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRoom } from '@/hooks/useRoom'
import { useMatches } from '@/hooks/useMatches'
import { GenrePicker } from '@/components/GenrePicker'
import { WaitingRoom } from '@/components/WaitingRoom'
import { CardStack } from '@/components/CardStack'
import { MatchesList } from '@/components/MatchesList'

export default function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const { room, loading, error, deviceId, slot, submitGenres, triggerDeckBuild, setPhaseLocally } =
    useRoom(code)
  const { matches } = useMatches(room?.id ?? '')

  const deckBuildAttempted = useRef(false)
  const [genresSubmitted, setGenresSubmitted] = useState(false)

  useEffect(() => {
    if (!room) return
    if (deckBuildAttempted.current) return
    if (!room.genres_a || !room.genres_b) return
    if (room.phase !== 'waiting') return

    deckBuildAttempted.current = true
    triggerDeckBuild(room).catch(console.error)
  }, [room, triggerDeckBuild])

  function handleSwipeComplete() {
    setPhaseLocally('done')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--app-accent)', borderTopColor: 'transparent' }}
          role="status"
          aria-label="Loading room"
        />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-4xl" style={{ color: 'var(--app-text)' }}>
          Oops
        </p>
        <p className="font-body text-sm" style={{ color: 'var(--app-text-2)' }}>
          {error ?? 'Room not found'}
        </p>
        <a
          href="/"
          className="px-6 py-3 rounded-full font-body font-semibold text-sm transition-opacity hover:opacity-80"
          style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)' }}
        >
          Back to home
        </a>
      </div>
    )
  }

  const bothGenresReady = !!(room.genres_a && room.genres_b)

  async function handleGenreSubmit(genreIds: string[]) {
    try {
      await submitGenres(genreIds)
      setGenresSubmitted(true)
    } catch (e) {
      console.error('Failed to submit genres:', e)
    }
  }

  // Show genre picker if this device hasn't submitted yet.
  // Check both local state AND the DB value — handles the case where
  // the partner already submitted and set phase to 'waiting' before this device joined.
  if (!genresSubmitted && slot !== null) {
    const myGenres = slot === 'A' ? room.genres_a : room.genres_b
    if (!myGenres) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <GenrePicker onSubmit={handleGenreSubmit} />
        </div>
      )
    }
  }

  if (room.phase === 'genre_pick' || room.phase === 'waiting') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <WaitingRoom code={code} bothGenresReady={bothGenresReady} />
      </div>
    )
  }

  if (room.phase === 'swiping') {
    if (!deviceId) return null
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <CardStack
          deck={room.deck}
          roomId={room.id}
          deviceId={deviceId}
          onComplete={handleSwipeComplete}
        />
        {/* MatchOverlay removed — matches are shown at the end after the full deck is swiped */}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <MatchesList matches={matches} />
      <div className="flex justify-center pb-8">
        <a
          href="/"
          className="px-6 py-3 rounded-full font-body font-semibold text-sm transition-opacity hover:opacity-80"
          style={{
            background: 'var(--app-surface)',
            color: 'var(--app-text)',
            border: '1px solid var(--app-border)',
          }}
        >
          Start a new room
        </a>
      </div>
    </div>
  )
}
