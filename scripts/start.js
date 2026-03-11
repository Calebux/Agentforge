#!/usr/bin/env node
// Railway startup script: launches OpenClaw gateway, then starts Next.js.

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const OPENCLAW_BIN = process.env.OPENCLAW_BIN
const STATE_DIR = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace(
  '~',
  process.env.HOME ?? ''
)
const CLAWD_CONFIG = path.join(STATE_DIR, 'clawdbot.json')

function bootstrapConfig() {
  if (fs.existsSync(CLAWD_CONFIG)) {
    console.log('[start] clawdbot.json already exists — skipping bootstrap')
    return
  }

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN
    ?? require('crypto').randomBytes(24).toString('hex')

  if (!telegramToken) {
    console.warn('[start] TELEGRAM_BOT_TOKEN not set — Telegram channel will be disabled')
  }

  const templatePath = path.join(__dirname, 'clawdbot.template.json')
  if (!fs.existsSync(templatePath)) {
    console.warn('[start] clawdbot.template.json not found — skipping config bootstrap')
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
    '/data/clawd',
  ]) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(CLAWD_CONFIG, config)
  console.log('[start] Bootstrapped clawdbot.json from template')
}

function startGateway() {
  bootstrapConfig()

  if (!OPENCLAW_BIN || !fs.existsSync(CLAWD_CONFIG)) {
    console.log('[start] Skipping OpenClaw gateway (OPENCLAW_BIN not set or clawdbot.json not found)')
    return
  }

  // Ensure log dir exists
  const logDir = path.join(STATE_DIR, 'logs')
  fs.mkdirSync(logDir, { recursive: true })

  const outLog = path.join(logDir, 'gateway.log')
  const errLog = path.join(logDir, 'gateway-error.log')
  const outFd = fs.openSync(outLog, 'a')
  const errFd = fs.openSync(errLog, 'a')

  // Parse "node /path/to/index.js" into [node, [/path/to/index.js, gateway]]
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
  console.log(`[start] OpenClaw gateway spawned (pid ${child.pid}), logs → ${outLog}`)
}

async function main() {
  startGateway()

  // Give OpenClaw a moment to start before Next.js begins serving
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const nextBin = path.join(__dirname, '..', 'node_modules', '.bin', 'next')
  console.log('[start] Starting Next.js...')
  const child = spawn(process.execPath, [nextBin, 'start'], {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code) => process.exit(code ?? 0))
}

main().catch((err) => {
  console.error('[start] Fatal error:', err)
  process.exit(1)
})
