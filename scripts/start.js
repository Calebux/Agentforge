#!/usr/bin/env node
// Railway startup script: launches OpenClaw gateway via pm2, then starts Next.js.
// Runs AFTER `next build` completes.

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
  if (fs.existsSync(CLAWD_CONFIG)) return // already initialized

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

  fs.mkdirSync(STATE_DIR, { recursive: true })
  fs.mkdirSync(path.join(STATE_DIR, 'agents', 'main', 'agent'), { recursive: true })
  fs.mkdirSync('/data/clawd', { recursive: true })
  fs.writeFileSync(CLAWD_CONFIG, config)
  console.log('[start] Bootstrapped clawdbot.json from template')
}

async function startGateway() {
  bootstrapConfig()

  if (!OPENCLAW_BIN || !fs.existsSync(CLAWD_CONFIG)) {
    console.log('[start] Skipping OpenClaw gateway (OPENCLAW_BIN not set or clawdbot.json not found)')
    return
  }

  let pm2
  try {
    pm2 = require('pm2')
  } catch {
    console.warn('[start] pm2 not available — OpenClaw gateway will not be managed')
    return
  }

  return new Promise((resolve) => {
    pm2.connect((connectErr) => {
      if (connectErr) {
        console.warn('[start] pm2 connect error:', connectErr.message)
        resolve()
        return
      }

      let script = OPENCLAW_BIN
      const opts = {
        name: 'openclaw-gateway',
        args: 'gateway',
        cwd: STATE_DIR,
        autorestart: true,
        restart_delay: 3000,
        env: { NODE_ENV: 'production', ...process.env },
      }
      if (OPENCLAW_BIN.startsWith('node ')) {
        opts.interpreter = 'node'
        script = OPENCLAW_BIN.slice(5).trim()
      }
      opts.script = script

      pm2.start(opts, (startErr) => {
        if (startErr) {
          // Already running? Try restart.
          pm2.restart('openclaw-gateway', (restartErr) => {
            if (restartErr) console.warn('[start] pm2 start/restart failed:', restartErr.message)
            else console.log('[start] openclaw-gateway restarted via pm2')
            pm2.disconnect()
            resolve()
          })
        } else {
          console.log('[start] openclaw-gateway started via pm2')
          pm2.disconnect()
          resolve()
        }
      })
    })
  })
}

async function main() {
  await startGateway()

  // Start Next.js production server
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
