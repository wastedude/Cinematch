'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Cast to EventListener so TypeScript accepts the non-standard event type
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const nav = window.navigator as Navigator & { standalone?: boolean }
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || nav.standalone
    if (isStandalone) setIsInstalled(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  if (isInstalled || !deferredPrompt) return null

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body font-semibold transition-opacity hover:opacity-80"
      style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)' }}
      aria-label="Install FlixMatch app"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Install App
    </button>
  )
}
