export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const fs = require('fs') as any
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const path = require('path') as any
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { spawn } = require('child_process') as any
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const crypto = require('crypto') as any

  const OPENCLAW_BIN = process.env.OPENCLAW_BIN
  const STATE_DIR = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace(
    '~', process.env.HOME ?? ''
  )
  const CLAWD_CONFIG = path.join(STATE_DIR, 'clawdbot.json')

  try {
    fs.writeFileSync('/tmp/instrumentation-ran.txt', new Date().toISOString())

    // Bootstrap clawdbot.json if missing
    if (!fs.existsSync(CLAWD_CONFIG)) {
      const templatePath = path.join(process.cwd(), 'scripts', 'clawdbot.template.json')
      if (fs.existsSync(templatePath)) {
        const token = process.env.TELEGRAM_BOT_TOKEN ?? ''
        const gwToken = process.env.OPENCLAW_GATEWAY_TOKEN ?? crypto.randomBytes(24).toString('hex')
        let config = fs.readFileSync(templatePath, 'utf-8')
        config = config.replace('__TELEGRAM_BOT_TOKEN__', token)
        config = config.replace('__OPENCLAW_GATEWAY_TOKEN__', gwToken)
        for (const dir of [
          STATE_DIR,
          path.join(STATE_DIR, 'agents', 'main', 'agent'),
          path.join(STATE_DIR, 'logs'),
          path.join(STATE_DIR, 'credentials'),
          path.join(STATE_DIR, 'memory'),
          path.join(STATE_DIR, 'canvas'),
        ]) fs.mkdirSync(dir, { recursive: true })
        try { fs.mkdirSync('/data/clawd', { recursive: true }) } catch {}
        fs.writeFileSync(CLAWD_CONFIG, config)
        console.log('[instrumentation] Bootstrapped clawdbot.json')
      }
    }

    // Spawn OpenClaw gateway
    if (OPENCLAW_BIN && fs.existsSync(CLAWD_CONFIG)) {
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
      console.log(`[instrumentation] OpenClaw gateway spawned (pid ${child.pid})`)
    }
  } catch (err) {
    console.error('[instrumentation] Error:', err)
  }
}
