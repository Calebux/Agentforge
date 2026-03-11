import { NextResponse } from 'next/server'
import { getGatewayHealth } from '@/lib/openclaw'
import fs from 'fs'
import path from 'path'

function readGatewayLogs() {
  const stateDir = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace(
    '~', process.env.HOME ?? ''
  )
  const read = (f: string) => {
    if (!fs.existsSync(f)) return 'not found'
    return fs.readFileSync(f, 'utf-8').slice(-3000)
  }
  return {
    out: read(path.join(stateDir, 'logs', 'gateway.log')),
    err: read(path.join(stateDir, 'logs', 'gateway-error.log')),
  }
}

export async function GET() {
  try {
    const health = await getGatewayHealth()
    return NextResponse.json({ status: 'ok', gateway: health })
  } catch (err) {
    const sentinel = fs.existsSync('/tmp/start-js-ran.txt')
      ? fs.readFileSync('/tmp/start-js-ran.txt', 'utf-8')
      : 'NOT FOUND — start.js did not run'
    return NextResponse.json({
      status: 'ok',
      gateway: 'unavailable',
      gatewayError: String(err),
      startJsSentinel: sentinel,
      gatewayLogs: readGatewayLogs(),
    })
  }
}
