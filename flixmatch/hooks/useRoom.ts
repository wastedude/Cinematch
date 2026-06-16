'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDeviceId } from '@/lib/device'
import type { Room, RoomPhase } from '@/types'

interface UseRoomReturn {
  room: Room | null
  loading: boolean
  error: string | null
  deviceId: string | null
  slot: 'A' | 'B' | null
  submitGenres: (genres: string[]) => Promise<void>
  triggerDeckBuild: (roomSnapshot: Room) => Promise<void>
  setPhaseLocally: (phase: RoomPhase) => void
}

export function useRoom(code: string): UseRoomReturn {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [slot, setSlot] = useState<'A' | 'B' | null>(null)
  // Keep a ref so callbacks always see the latest room without stale closures
  const roomRef = useRef<Room | null>(null)

  useEffect(() => {
    roomRef.current = room
  }, [room])

  useEffect(() => {
    const supabase = createClient()
    const id = getDeviceId()
    setDeviceId(id)

    async function init() {
      setLoading(true)

      const res = await fetch(`/api/rooms?code=${code}`)
      if (!res.ok) {
        setError('Room not found')
        setLoading(false)
        return
      }
      const roomData: Room = await res.json()
      setRoom(roomData)
      roomRef.current = roomData

      await supabase
        .from('participants')
        .upsert({ room_id: roomData.id, device_id: id }, { onConflict: 'room_id,device_id' })

      const { data: participants } = await supabase
        .from('participants')
        .select('device_id, joined_at')
        .eq('room_id', roomData.id)
        .order('joined_at', { ascending: true })

      if (participants) {
        const myIndex = participants.findIndex((p) => p.device_id === id)
        setSlot(myIndex === 0 ? 'A' : 'B')
      }

      setLoading(false)
    }

    init().catch((e) => {
      setError(e.message)
      setLoading(false)
    })

    const channel = supabase
      .channel(`room:${code}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        async () => {
          // Re-fetch the full room instead of using the realtime payload —
          // without REPLICA IDENTITY FULL the payload has null for unchanged columns.
          const res = await fetch(`/api/rooms?code=${code}`)
          if (!res.ok) return
          const updated: Room = await res.json()
          setRoom(updated)
          roomRef.current = updated
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [code])

  // Submit genres AND transition the room phase to 'waiting' atomically
  const submitGenres = useCallback(
    async (genres: string[]) => {
      const current = roomRef.current
      if (!current || !slot) return
      const supabase = createClient()

      const field = slot === 'A' ? 'genres_a' : 'genres_b'

      // Also set phase to 'waiting' so the realtime listener on the other
      // client can detect that this participant has submitted
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ [field]: genres, phase: 'waiting' })
        .eq('id', current.id)

      if (updateError) throw new Error(updateError.message)
    },
    [slot]
  )

  // Accept a fresh room snapshot to avoid stale-closure issues
  const triggerDeckBuild = useCallback(async (roomSnapshot: Room) => {
    if (!roomSnapshot.genres_a || !roomSnapshot.genres_b) return

    const res = await fetch('/api/deck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: roomSnapshot.id,
        genresA: roomSnapshot.genres_a,
        genresB: roomSnapshot.genres_b,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Deck build failed')
    }
  }, [])

  const setPhaseLocally = useCallback((phase: RoomPhase) => {
    setRoom((prev) => (prev ? { ...prev, phase } : prev))
  }, [])

  return { room, loading, error, deviceId, slot, submitGenres, triggerDeckBuild, setPhaseLocally }
}
