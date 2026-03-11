// Gateway bootstrap — called from instrumentation.ts on server startup
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'

const OPENCLAW_BIN = process.env.OPENCLAW_BIN
const STATE_DIR = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace(
  '~',
  process.env.HOME ?? ''
)
const CLAWD_CONFIG = path.join(STATE_DIR, 'clawdbot.json')

function bootstrapConfig() {
  if (fs.existsSync(CLAWD_CONFIG)) {
    console.log('[gateway-init] clawdbot.json exists — skipping bootstrap')
    return
  }

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const gatewayToken =
    process.env.OPENCLAW_GATEWAY_TOKEN ?? crypto.randomBytes(24).toString('hex')

  const templatePath = path.join(process.cwd(), 'scripts', 'clawdbot.template.json')
  if (!fs.existsSync(templatePath)) {
    console.warn('[gateway-init] template not found — skipping bootstrap')
    return
  }

  let config = fs.readFileSync(templatePath, 'utf-8')
  config = config.replace('__TELEGRAM_BOT_TOKEN__', telegramToken ?? '')
  config = config.replace('__OPENCLAW_GATEWAY_TOKEN__', gatewayToken)

  for (const dir of [
    STATE_DIR,
    path.join(STATE_DIR, 'agents', 'main', 'agent'),
    path.join(STATE_DIR, 'logs'),
    path.join(STATE_DIR, 'credentials'),
    path.join(STATE_DIR, 'memory'),
    path.join(STATE_DIR, 'canvas'),
  ]) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Create workspace dir — handle /data not existing gracefully
  try { fs.mkdirSync('/data/clawd', { recursive: true }) } catch {}

  fs.writeFileSync(CLAWD_CONFIG, config)
  console.log('[gateway-init] Bootstrapped clawdbot.json from template')
}

function spawnGateway() {
  if (!OPENCLAW_BIN || !fs.existsSync(CLAWD_CONFIG)) {
    console.log('[gateway-init] Skipping gateway spawn (OPENCLAW_BIN not set or config missing)')
    return
  }

  const logDir = path.join(STATE_DIR, 'logs')
  fs.mkdirSync(logDir, { recursive: true })

  const outFd = fs.openSync(path.join(logDir, 'gateway.log'), 'a')
  const errFd = fs.openSync(path.join(logDir, 'gateway-error.log'), 'a')

  let bin = OPENCLAW_BIN
  let args = ['gateway']
  if (OPENCLAW_BIN.startsWith('node ')) {
    bin = process.execPath
    args = [OPENCLAW_BIN.slice(5).trim(), 'gateway']
  }

  const child = spawn(bin, args, {
    cwd: STATE_DIR,
    detached: true,
    stdio: ['ignore', outFd, errFd],
    env: { ...process.env },
  })
  child.unref()
  console.log(`[gateway-init] OpenClaw gateway spawned (pid ${child.pid})`)
}

export async function bootstrapAndStartGateway() {
  try {
    fs.writeFileSync('/tmp/instrumentation-ran.txt', new Date().toISOString())
    bootstrapConfig()
    spawnGateway()
  } catch (err) {
    console.error('[gateway-init] Error:', err)
  }
}
