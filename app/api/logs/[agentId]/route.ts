import { NextRequest, NextResponse } from 'next/server'
import { getEvents } from '@/lib/db'
import { getAgentLogs } from '@/lib/openclaw'

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { searchParams } = new URL(request.url)
  const lines = parseInt(searchParams.get('lines') ?? '50', 10)

  try {
    const [rawLogs, events] = await Promise.all([
      getAgentLogs(params.agentId, lines),
      getEvents(params.agentId, lines),
    ])
    return NextResponse.json({ logs: rawLogs, events })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: String(error) },
      { status: 500 }
    )
  }
}
