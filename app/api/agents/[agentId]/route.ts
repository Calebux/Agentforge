import { NextRequest, NextResponse } from 'next/server'
import { getAgent, updateAgent, deleteAgent } from '@/lib/db'
import { stopAgent } from '@/lib/openclaw'

export async function GET(
  _request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agent = getAgent(params.agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  return NextResponse.json(agent)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agent = getAgent(params.agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const body = await request.json() as Record<string, unknown>
  const allowed = ['status', 'onchain_address', 'name']
  const fields: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) fields[key] = body[key]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAgent(params.agentId, fields as any)

  if (body.status === 'stopped') {
    try {
      await stopAgent(params.agentId)
    } catch {
      // Best effort
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agent = getAgent(params.agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  try {
    await stopAgent(params.agentId)
  } catch {
    // Best effort
  }

  deleteAgent(params.agentId)
  return NextResponse.json({ success: true })
}
