import { NextResponse } from 'next/server'
import { getGatewayHealth } from '@/lib/openclaw'

export async function GET() {
  try {
    const health = await getGatewayHealth()
    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 503 }
    )
  }
}
