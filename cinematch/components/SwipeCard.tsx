'use client'

import Image from 'next/image'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { posterUrl } from '@/lib/tmdb'
import type { DeckMovie } from '@/types'

interface SwipeCardProps {
  movie: DeckMovie
  onSwipe: (liked: boolean) => void
  isTop: boolean
  stackIndex: number // 0 = top, 1 = second, 2 = third
}

const SWIPE_THRESHOLD = 80 // px — drag distance that triggers a swipe
const INDICATOR_THRESHOLD = 30 // px — when to show like/pass overlay

export function SwipeCard({ movie, onSwipe, isTop, stackIndex }: SwipeCardProps) {
  const x = useMotionValue(0)

  // Overlay opacities driven by drag position
  const likeOpacity = useTransform(x, [0, INDICATOR_THRESHOLD, SWIPE_THRESHOLD], [0, 0.5, 1])
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -INDICATOR_THRESHOLD, 0], [1, 0.5, 0])
  const cardRotation = useTransform(x, [-200, 200], [-15, 15])

  // Scale + vertical offset for stack depth illusion
  const scale = 1 - stackIndex * 0.04
  const translateY = stackIndex * 12

  const year = movie.release_date?.slice(0, 4) ?? '—'
  const rating = movie.vote_average?.toFixed(1) ?? '—'
  const posterSrc = movie.poster_path
    ? posterUrl(movie.poster_path, 'w500')
    : '/icons/icon-192.png' // fallback placeholder

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (!isTop) return
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe(true)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe(false)
    }
  }

  return (
    <motion.div
      className="absolute"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? cardRotation : 0,
        scale,
        translateY,
        zIndex: 10 - stackIndex,
        touchAction: 'none',
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={{ scale, translateY }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Card container */}
      <div
        className="relative overflow-hidden select-none"
        style={{
          width: 'min(320px, 90vw)',
          height: '480px',
          borderRadius: '20px',
          background: 'var(--app-surface)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Poster — top 75% */}
        <div className="relative" style={{ height: '75%' }}>
          <Image
            src={posterSrc}
            alt={`${movie.title} poster`}
            fill
            sizes="320px"
            className="object-cover"
            priority={stackIndex === 0}
            draggable={false}
          />
        </div>

        {/* Info — bottom 25% */}
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 px-4 py-3"
          style={{ background: 'var(--app-surface)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <h3
              className="font-display text-2xl leading-tight truncate"
              style={{ color: 'var(--app-text)' }}
            >
              {movie.title}
            </h3>
            {/* Rating pill */}
            <span
              className="shrink-0 text-xs font-body font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)' }}
              aria-label={`Rating: ${rating}`}
            >
              ★ {rating}
            </span>
          </div>
          <p className="font-body text-xs" style={{ color: 'var(--app-text-2)' }}>
            {year}
          </p>
        </div>

        {/* Like overlay (drag right) */}
        {isTop && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-card"
            style={{
              opacity: likeOpacity,
              background: 'rgba(34, 197, 94, 0.35)',
              pointerEvents: 'none',
              borderRadius: '20px',
            }}
            aria-hidden="true"
          >
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </motion.div>
        )}

        {/* Pass overlay (drag left) */}
        {isTop && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: passOpacity,
              background: 'rgba(226, 87, 90, 0.35)',
              pointerEvents: 'none',
              borderRadius: '20px',
            }}
            aria-hidden="true"
          >
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
