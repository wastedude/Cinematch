'use client'

import { RoomCode } from './RoomCode'

interface WaitingRoomProps {
  code: string
  bothGenresReady: boolean
}

export function WaitingRoom({ code, bothGenresReady }: WaitingRoomProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-12 px-4 text-center">
      <RoomCode code={code} />

      <div className="flex flex-col items-center gap-3">
        {bothGenresReady ? (
          <>
            {/* Spinner while deck is building */}
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--app-accent)', borderTopColor: 'transparent' }}
              role="status"
              aria-label="Generating deck"
            />
            <p className="font-body text-sm" style={{ color: 'var(--app-text-2)' }}>
              Generating your deck…
            </p>
          </>
        ) : (
          <>
            {/* Waiting dots */}
            <div className="flex gap-1" aria-label="Waiting for partner">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: 'var(--app-accent)',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <p className="font-body text-sm" style={{ color: 'var(--app-text-2)' }}>
              Waiting for your movie partner…
            </p>
          </>
        )}
      </div>
    </div>
  )
}
