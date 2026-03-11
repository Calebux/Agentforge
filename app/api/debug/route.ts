import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export async function GET() {
  const home = process.env.HOME ?? '/root'
  const stateDir = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace('~', home)

  const readTail = (filePath: string, bytes = 3000) => {
    if (!fs.existsSync(filePath)) return `NOT FOUND: ${filePath}`
    return fs.readFileSync(filePath, 'utf-8').slice(-bytes)
  }

  const listDir = (dir: string) => {
    if (!fs.existsSync(dir)) return `NOT FOUND: ${dir}`
    try { return fs.readdirSync(dir) } catch (e) { return String(e) }
  }

  const run = (cmd: string) => {
    try { return execSync(cmd, { encoding: 'utf-8', timeout: 3000 }).trim() } catch (e) { return String(e) }
  }

  return NextResponse.json({
    env: {
      OPENCLAW_BIN: process.env.OPENCLAW_BIN ?? 'NOT SET',
      OPENCLAW_STATE_DIR: process.env.OPENCLAW_STATE_DIR ?? 'NOT SET',
      DATABASE_PATH: process.env.DATABASE_PATH ?? 'NOT SET',
      HOME: home,
    },
    paths: {
      stateDir,
      clawdConfig: fs.existsSync(path.join(stateDir, 'clawdbot.json')) ? 'EXISTS' : 'MISSING',
      templateFile: fs.existsSync(path.join(process.cwd(), 'scripts', 'clawdbot.template.json')) ? 'EXISTS' : 'MISSING',
      dataDir: listDir('/data'),
      pm2Dir: listDir(path.join(home, '.pm2')),
      pm2Logs: listDir(path.join(home, '.pm2', 'logs')),
    },
    processes: run('ps aux | grep -E "openclaw|pm2" | grep -v grep'),
    gatewayOut: readTail(path.join(home, '.pm2', 'logs', 'openclaw-gateway-out.log')),
    gatewayErr: readTail(path.join(home, '.pm2', 'logs', 'openclaw-gateway-error.log')),
  })
}
