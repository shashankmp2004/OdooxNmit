"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { getRealtimeClient, RealtimeClient } from '@/lib/realtime'
import { useSession } from 'next-auth/react'

interface State { connected: boolean; connecting: boolean; error: string | null }

export function useRealtime(autoConnect = true) {
  const { data: session } = useSession()
  const [state, setState] = useState<State>({ connected: false, connecting: false, error: null })
  const clientRef = useRef<RealtimeClient | null>(null)

  const client = useMemo(() => getRealtimeClient(), [])

  useEffect(() => {
    clientRef.current = client
    return () => { clientRef.current?.disconnect(); clientRef.current = null }
  }, [client])

  useEffect(() => {
    if (!session?.user || !autoConnect || !clientRef.current) return
    if (state.connected || state.connecting) return

    setState(s => ({ ...s, connecting: true, error: null }))
    try {
      clientRef.current.connect()
      // The Socket.IO adapter will fire connected via its own callbacks; simulate optimistic connect
      setState({ connected: true, connecting: false, error: null })
    } catch (e: any) {
      setState({ connected: false, connecting: false, error: e?.message || 'Failed to connect' })
    }

    return () => { clientRef.current?.disconnect() }
  }, [session?.user, autoConnect])

  return {
    client: clientRef.current,
    ...state,
  }
}
