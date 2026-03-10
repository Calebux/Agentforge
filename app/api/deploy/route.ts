import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createAgent, updateAgent, addEvent } from '@/lib/db'
import { startAgent } from '@/lib/openclaw'
import type { DeployAgentRequest } from '@/types/agent'

export async function POST(request: NextRequest) {
  let body: DeployAgentRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    owner_address,
    template_id,
    name,
    llm_provider,
    llm_model,
    llm_api_key,
    system_prompt,
    spending_limit_monthly,
    spending_limit_per_tx,
  } = body

  if (!owner_address || !template_id || !name || !llm_provider || !llm_model) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const agentId = uuidv4()

  try {
    // 1. Save to DB
    createAgent({
      id: agentId,
      owner_address,
      name,
      template_id,
      llm_provider,
      llm_model,
      system_prompt,
      spending_limit_monthly: spending_limit_monthly ?? null,
      spending_limit_per_tx: spending_limit_per_tx ?? null,
    })

    // 2. Register agent in OpenClaw (writes clawdbot.json + auth-profiles.json)
    await startAgent(agentId, {
      name,
      llm_provider,
      llm_model,
      llm_api_key: llm_api_key ?? '',
      system_prompt,
    })

    // 3. Mark as running
    updateAgent(agentId, { status: 'running' })
    addEvent({ agent_id: agentId, event_type: 'start', payload: JSON.stringify({ name }) })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    return NextResponse.json({
      agentId,
      status: 'running',
      dashboardUrl: `${appUrl}/agent/${agentId}`,
    })
  } catch (error) {
    console.error('[deploy] FAILED:', error)
    try { updateAgent(agentId, { status: 'error' }) } catch {}
    try {
      addEvent({
        agent_id: agentId,
        event_type: 'error',
        payload: JSON.stringify({ message: String(error) }),
      })
    } catch {}
    return NextResponse.json(
      { error: 'Deployment failed', details: String(error) },
      { status: 500 }
    )
  }
}
