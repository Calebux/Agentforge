import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAgent } from '@/lib/db'
import { getApprovals, createApproval, updateApproval } from '@/lib/db'
import { sendApprovalNotification } from '@/lib/telegram'

export async function GET(
  _req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agent = getAgent(params.agentId)
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const status = _req.nextUrl.searchParams.get('status') ?? undefined
  const approvals = getApprovals(params.agentId, status)
  return NextResponse.json(approvals)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agent = getAgent(params.agentId) as Record<string, unknown> | null
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const body = await req.json()
  const { action_type, description, amount, from_chain, to_chain, from_token, to_token, lifi_quote } = body

  if (!action_type || !description) {
    return NextResponse.json({ error: 'action_type and description required' }, { status: 400 })
  }

  const id = uuidv4()
  createApproval({
    id,
    agent_id: params.agentId,
    action_type,
    description,
    amount: amount ?? undefined,
    from_chain: from_chain ?? undefined,
    to_chain: to_chain ?? undefined,
    from_token: from_token ?? undefined,
    to_token: to_token ?? undefined,
    lifi_quote: lifi_quote ? JSON.stringify(lifi_quote) : undefined,
  })

  // Send Telegram notification (non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  sendApprovalNotification({
    agentName: String(agent.name),
    description,
    amount,
    fromChain: from_chain,
    toChain: to_chain,
    approvalUrl: `${appUrl}/agent/${params.agentId}`,
  })

  return NextResponse.json({ id })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { id, status, tx_hash } = await req.json()

  if (!id || !status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'id and status (approved|rejected) required' }, { status: 400 })
  }

  updateApproval(id, { status, tx_hash })
  return NextResponse.json({ success: true })
}
