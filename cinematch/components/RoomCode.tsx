'use client'

import { useState } from 'react'

interface RoomCodeProps {
  code: string
}

export function RoomCode({ code }: RoomCodeProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${code}`
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://cinematch.vercel.app'}/room/${code}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers that block clipboard
      prompt('Copy this link:', shareUrl)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-body" style={{ color: 'var(--app-text-2)' }}>
        Share this code with your movie partner
      </p>

      {/* Large display code */}
      <div
        className="font-display tracking-widest text-5xl px-6 py-3 rounded-card"
        style={{
          background: 'var(--app-surface)',
          color: 'var(--app-accent)',
          letterSpacing: '0.2em',
        }}
        aria-label={`Room code: ${code.split('').join(' ')}`}
      >
        {code}
      </div>

      {/* Copy button */}
      <button
        onClick={copyLink}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body transition-opacity hover:opacity-80"
        style={{
          background: 'var(--app-surface)',
          color: copied ? 'var(--app-accent)' : 'var(--app-text)',
          border: '1px solid var(--app-border)',
        }}
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy link
          </>
        )}
      </button>
    </div>
  )
}
