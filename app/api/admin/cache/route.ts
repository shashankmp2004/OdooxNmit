import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock cache clearing - in a real app, this would clear Redis cache or similar
    console.log('System cache cleared at:', new Date().toISOString())

    // Simulate cache clearing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({ 
      message: 'System cache cleared successfully',
      clearedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
  }
}