import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildDeck } from '@/lib/deck'
import type { BuildDeckBody } from '@/types'

// ── POST /api/deck ───────────────────────────────────────────────────────────
// Body: { roomId: string, genresA: string[], genresB: string[] }
//
// 1. Blends genres from both participants
// 2. Fetches a 15-movie deck from TMDB (with trailers)
// 3. Updates rooms.deck and sets phase → 'swiping'
// 4. Returns the deck array
//
// Uses `on conflict do nothing` semantics via upsert to handle the case
// where both clients trigger deck generation simultaneously.
export async function POST(req: NextRequest) {
  let body: BuildDeckBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { roomId, genresA, genresB } = body

  if (!roomId || !Array.isArray(genresA) || !Array.isArray(genresB)) {
    return NextResponse.json(
      { error: 'roomId, genresA, and genresB are required' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  // Guard: if deck already built by the other client, just return existing deck
  const { data: existing } = await supabase
    .from('rooms')
    .select('deck, phase')
    .eq('id', roomId)
    .single()

  if (existing?.phase === 'swiping' && Array.isArray(existing.deck) && existing.deck.length > 0) {
    return NextResponse.json({ deck: existing.deck })
  }

  // Build the deck (TMDB calls happen here)
  let deck
  try {
    deck = await buildDeck(genresA, genresB)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Deck build failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Write deck to Supabase and transition phase to 'swiping'
  const { error } = await supabase
    .from('rooms')
    .update({ deck, phase: 'swiping' })
    .eq('id', roomId)
    // Only update if still in a pre-swiping phase (race-condition safety)
    .neq('phase', 'swiping')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deck })
}
