import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const home = process.env.HOME ?? '/root'
  const pm2LogDir = path.join(home, '.pm2', 'logs')
  const stateDir = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace('~', home)

  const readTail = (filePath: string, bytes = 4000) => {
    if (!fs.existsSync(filePath)) return `NOT FOUND: ${filePath}`
    const content = fs.readFileSync(filePath, 'utf-8')
    return content.slice(-bytes)
  }

  return NextResponse.json({
    home,
    stateDir,
    clawdConfig: fs.existsSync(path.join(stateDir, 'clawdbot.json')) ? 'exists' : 'MISSING',
    pm2LogDir,
    gatewayOut: readTail(path.join(pm2LogDir, 'openclaw-gateway-out.log')),
    gatewayErr: readTail(path.join(pm2LogDir, 'openclaw-gateway-error.log')),
    pm2Out: readTail(path.join(pm2LogDir, 'pm2.log')),
    clawdLog: readTail(path.join(stateDir, 'logs', 'gateway.log')),
  })
}
