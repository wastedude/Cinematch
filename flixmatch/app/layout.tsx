import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Manrope } from 'next/font/google'
import { TmdbAttribution } from '@/components/TmdbAttribution'
import { ThemeToggle } from '@/components/ThemeToggle'
import '@/styles/globals.css'

// ── Fonts ──────────────────────────────────────────────────────────────────
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

// ── Metadata ───────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'CineMatch — Swipe movies with a friend',
  description: 'Tinder for movies. Swipe together, find your match.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CineMatch',
  },
}

export const viewport: Viewport = {
  themeColor: '#F2B84B',
}

// ── Root Layout ────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${bebasNeue.variable} ${manrope.variable}`}>
      <head>
        {/*
          Inline script: read localStorage before first paint to prevent
          theme flash. Runs synchronously before React hydrates.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('flixmatch_theme');
                if (t === 'light' || t === 'dark') {
                  document.documentElement.setAttribute('data-theme', t);
                }
              } catch(e) {}
            `,
          }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="flex flex-col min-h-dvh">
        {/* App header */}
        <header
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--app-bg)', borderBottom: '1px solid var(--app-border)' }}
        >
          <a
            href="/"
            className="font-display text-2xl leading-none"
            style={{ color: 'var(--app-accent)', textDecoration: 'none' }}
            aria-label="CineMatch — home"
          >
            CineMatch
          </a>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* REQUIRED: TMDB attribution on every page — TMDB Terms §3 */}
        <TmdbAttribution />
      </body>
    </html>
  )
}
