'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDeviceId } from '@/lib/device'
import type { Room, RoomPhase } from '@/types'

interface UseRoomReturn {
  room: Room | null
  loading: boolean
  error: string | null
  deviceId: string | null
  /** Which slot this device is (A = first joiner, B = second joiner) */
  slot: 'A' | 'B' | null
  submitGenres: (genres: string[]) => Promise<void>
  triggerDeckBuild: () => Promise<void>
  setPhaseLocally: (phase: RoomPhase) => void
}

export function useRoom(code: string): UseRoomReturn {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [slot, setSlot] = useState<'A' | 'B' | null>(null)

  // ── Initial load + realtime subscription ──────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const id = getDeviceId()
    setDeviceId(id)

    async function init() {
      setLoading(true)

      // 1. Fetch room by code
      const res = await fetch(`/api/rooms?code=${code}`)
      if (!res.ok) {
        setError('Room not found')
        setLoading(false)
        return
      }
      const roomData: Room = await res.json()
      setRoom(roomData)

      // 2. Register as a participant (idempotent)
      await supabase
        .from('participants')
        .upsert({ room_id: roomData.id, device_id: id }, { onConflict: 'room_id,device_id' })

      // 3. Determine slot (A = first registered, B = second)
      const { data: participants } = await supabase
        .from('participants')
        .select('device_id, joined_at')
        .eq('room_id', roomData.id)
        .order('joined_at', { ascending: true })

      if (participants) {
        const myIndex = participants.findIndex((p) => p.device_id === id)
        setSlot(myIndex === 0 ? 'A' : 'B')

        // If room is full (3rd+ device), we still allow read-only view
      }

      setLoading(false)
    }

    init().catch((e) => {
      setError(e.message)
      setLoading(false)
    })

    // 4. Subscribe to room updates for real-time phase/genre transitions
    const channel = supabase
      .channel(`room:${code}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        (payload) => {
          setRoom(payload.new as Room)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [code])

  // ── Submit genre selection ─────────────────────────────────────────────────
  const submitGenres = useCallback(
    async (genres: string[]) => {
      if (!room || !slot) return
      const supabase = createClient()

      const field = slot === 'A' ? 'genres_a' : 'genres_b'
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ [field]: genres })
        .eq('id', room.id)

      if (updateError) throw new Error(updateError.message)
    },
    [room, slot]
  )

  // ── Trigger deck build (called when both genres are in) ───────────────────
  const triggerDeckBuild = useCallback(async () => {
    if (!room) return

    const latestRoom = room
    if (!latestRoom.genres_a || !latestRoom.genres_b) return

    const res = await fetch('/api/deck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: latestRoom.id,
        genresA: latestRoom.genres_a,
        genresB: latestRoom.genres_b,
      }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      throw new Error(msg ?? 'Deck build failed')
    }
  }, [room])

  const setPhaseLocally = useCallback((phase: RoomPhase) => {
    setRoom((prev) => (prev ? { ...prev, phase } : prev))
  }, [])

  return { room, loading, error, deviceId, slot, submitGenres, triggerDeckBuild, setPhaseLocally }
}
