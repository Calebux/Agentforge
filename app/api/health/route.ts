import { NextResponse } from 'next/server'
import { getGatewayHealth } from '@/lib/openclaw'
import fs from 'fs'
import path from 'path'

function readPm2Logs() {
  const home = process.env.HOME ?? '/root'
  const dir = path.join(home, '.pm2', 'logs')
  const read = (f: string) => {
    if (!fs.existsSync(f)) return 'not found'
    return fs.readFileSync(f, 'utf-8').slice(-3000)
  }
  return {
    out: read(path.join(dir, 'openclaw-gateway-out.log')),
    err: read(path.join(dir, 'openclaw-gateway-error.log')),
  }
}

export async function GET() {
  try {
    const health = await getGatewayHealth()
    return NextResponse.json({ status: 'ok', gateway: health })
  } catch (err) {
    return NextResponse.json({
      status: 'ok',
      gateway: 'unavailable',
      gatewayError: String(err),
      pm2Logs: readPm2Logs(),
    })
  }
}
