import { NextResponse } from 'next/server'
import { getGatewayHealth } from '@/lib/openclaw'

export async function GET() {
  try {
    const health = await getGatewayHealth()
    return NextResponse.json({ status: 'ok', gateway: health })
  } catch (err) {
    // Gateway unavailable is non-fatal — app itself is healthy
    return NextResponse.json({ status: 'ok', gateway: 'unavailable', gatewayError: String(err) })
  }
}
