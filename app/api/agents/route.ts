import { NextRequest, NextResponse } from 'next/server'
import { getAllAgents } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ownerAddress = searchParams.get('owner') ?? undefined

  try {
    const agents = getAllAgents(ownerAddress)
    return NextResponse.json(agents)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}
