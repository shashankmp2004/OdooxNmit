import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

// POST /api/realtime/token
// Exchanges the logged-in NextAuth session for a short-lived Realtime access token.
// WARNING: This is a scaffold. Replace the placeholder with Vercel Realtime SDK token minting when you enable the feature.
export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Derive claims/scopes from your user/session
    const userId = (token as any).id || token.sub
    const role = (token as any).role || 'OPERATOR'

    // Example channel policy matching your current rooms
    const allowedChannels = [
      `user:${userId}`,
      `role:${role}`,
      'dashboard',
      // Work order and MO channels can be authorized on-demand per request
    ]

    // TODO: Replace with actual Vercel Realtime token minting
    // const signed = await vercelRealtime.sign({ channels: allowedChannels, userId })
    // return NextResponse.json({ token: signed })

    // Placeholder response for now (client should ignore until SDK is wired)
    return NextResponse.json({
      token: null,
      message: 'Vercel Realtime not yet enabled. Replace this route with SDK token minting.',
      allowedChannels,
    })
  } catch (err) {
    console.error('Realtime token error:', err)
    return NextResponse.json({ error: 'Failed to mint realtime token' }, { status: 500 })
  }
}
