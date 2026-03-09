import { NextRequest, NextResponse } from 'next/server'
import { getSpendingByDay } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const data = getSpendingByDay(params.agentId, 7)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
