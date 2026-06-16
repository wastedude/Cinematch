'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Create a new room ──────────────────────────────────────────────────────
  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/rooms', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create room')
      const { code } = await res.json()
      router.push(`/room/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setCreating(false)
    }
  }

  // ── Join an existing room ──────────────────────────────────────────────────
  function handleJoin(e: FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Room codes are 6 characters')
      return
    }
    router.push(`/room/${code}`)
  }

  return (
    <div
      className="flex flex-col items-center justify-center flex-1 gap-10 px-6 py-16 text-center"
      style={{ background: 'var(--app-bg)' }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center gap-3">
        <h1
          className="font-display text-7xl leading-none"
          style={{ color: 'var(--app-accent)' }}
        >
          FlixMatch
        </h1>
        <p className="font-body text-base max-w-xs" style={{ color: 'var(--app-text-2)' }}>
          Swipe movies with a friend. When you both like the same film — it&apos;s a match.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Create room */}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full py-4 rounded-full font-body font-semibold text-base transition-opacity hover:opacity-90 active:scale-95"
          style={{
            background: 'var(--app-accent)',
            color: 'var(--app-on-accent)',
            opacity: creating ? 0.6 : 1,
          }}
          aria-busy={creating}
        >
          {creating ? 'Creating room…' : 'Create a room'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <hr className="flex-1" style={{ borderColor: 'var(--app-border)' }} />
          <span className="font-body text-xs" style={{ color: 'var(--app-text-2)' }}>
            or
          </span>
          <hr className="flex-1" style={{ borderColor: 'var(--app-border)' }} />
        </div>

        {/* Join room */}
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase().slice(0, 6))
              setError(null)
            }}
            placeholder="Enter room code"
            maxLength={6}
            className="w-full px-4 py-3 rounded-full font-display text-xl text-center tracking-widest outline-none transition-shadow focus:ring-2"
            style={{
              background: 'var(--app-surface)',
              color: 'var(--app-text)',
              border: '1px solid var(--app-border)',
              letterSpacing: '0.2em',
            }}
            aria-label="Room code"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="w-full py-4 rounded-full font-body font-semibold text-base transition-opacity hover:opacity-90 active:scale-95"
            style={{
              background: 'var(--app-surface)',
              color: 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            Join room
          </button>
        </form>

        {/* Error */}
        {error && (
          <p
            className="font-body text-sm text-center"
            style={{ color: 'var(--app-pass)' }}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
