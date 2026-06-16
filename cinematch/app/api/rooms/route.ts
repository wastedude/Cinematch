import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCode } from '@/lib/deck'
import type { Room } from '@/types'

// ── POST /api/rooms ──────────────────────────────────────────────────────────
// Creates a new room with a unique 6-char code.
// Returns { id, code }
export async function POST() {
  const supabase = createClient()

  // Try up to 5 times to get a unique code (collision is extremely unlikely)
  let code = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode()
    const { data } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', candidate)
      .maybeSingle()

    if (!data) {
      code = candidate
      break
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Failed to generate a unique room code' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert({ code, deck: [], phase: 'genre_pick' })
    .select('id, code')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create room' },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: data.id, code: data.code }, { status: 201 })
}

// ── GET /api/rooms?code=XXXXXX ───────────────────────────────────────────────
// Fetches a full room row by its 6-char code.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()

  if (!code) {
    return NextResponse.json({ error: 'code param required' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  return NextResponse.json(data as Room)
}
