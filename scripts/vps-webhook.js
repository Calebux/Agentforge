#!/usr/bin/env node
/**
 * AgentForge VPS Webhook Server
 *
 * Runs on the same machine as OpenClaw gateway.
 * Railway (Next.js) calls this to register/update agents.
 *
 * Usage:
 *   WEBHOOK_TOKEN=<secret> OPENCLAW_BIN=openclaw node scripts/vps-webhook.js
 *
 * Env vars:
 *   WEBHOOK_TOKEN          — bearer token Railway sends (set OPENCLAW_GATEWAY_TOKEN to same value)
 *   OPENCLAW_STATE_DIR     — path to clawdbot state dir (default: ~/.clawdbot)
 *   OPENCLAW_BIN           — openclaw binary/command (default: openclaw)
 *   WEBHOOK_PORT           — port to listen on (default: 3001)
 *   HOME                   — used to resolve ~ in STATE_DIR
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = parseInt(process.env.WEBHOOK_PORT ?? '3001', 10)
const TOKEN = process.env.WEBHOOK_TOKEN ?? process.env.OPENCLAW_GATEWAY_TOKEN ?? ''
const OPENCLAW_BIN = process.env.OPENCLAW_BIN ?? 'openclaw'
const STATE_DIR = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace(
  '~',
  process.env.HOME ?? ''
)
const CLAWD_CONFIG = path.join(STATE_DIR, 'clawdbot.json')

// ── helpers ──────────────────────────────────────────────────────────────────

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function writeJSON(file, data) {
  const bak = `${file}.agentforge.bak`
  if (fs.existsSync(file)) fs.copyFileSync(file, bak)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function restartGateway() {
  // Parse "node /path/to/index.js" into bin + args
  let bin = OPENCLAW_BIN
  let args = ['gateway', 'restart']
  if (OPENCLAW_BIN.startsWith('node ')) {
    bin = process.execPath
    args = [OPENCLAW_BIN.slice(5).trim(), 'gateway', 'restart']
  }
  const child = spawn(bin, args, {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, PATH: process.env.PATH },
  })
  child.unref()
  console.log('[webhook] gateway restart triggered (pid', child.pid + ')')
}

function send(res, status, body) {
  const json = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) })
  res.end(json)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())) }
      catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

function authorized(req) {
  if (!TOKEN) return true
  const auth = req.headers['authorization'] ?? ''
  return auth === `Bearer ${TOKEN}`
}

// ── route handlers ────────────────────────────────────────────────────────────

function handleHealth(res) {
  const configExists = fs.existsSync(CLAWD_CONFIG)
  send(res, 200, { status: 'ok', configExists, stateDir: STATE_DIR })
}

async function handleRegister(req, res) {
  let body
  try { body = await readBody(req) } catch {
    return send(res, 400, { error: 'Invalid JSON body' })
  }

  const { agentId, name, llm_provider, llm_model, llm_api_key, system_prompt, telegram_bot_token } = body
  if (!agentId || !llm_provider || !llm_model || !llm_api_key) {
    return send(res, 400, { error: 'Missing required fields: agentId, llm_provider, llm_model, llm_api_key' })
  }

  if (!fs.existsSync(CLAWD_CONFIG)) {
    return send(res, 503, { error: 'clawdbot.json not found — OpenClaw not set up on this VPS' })
  }

  try {
    // 1. Write auth-profiles.json for this agent
    const agentDir = path.join(STATE_DIR, 'agents', agentId, 'agent')
    fs.mkdirSync(agentDir, { recursive: true })

    const provider = llm_provider.toLowerCase()
    const authProfiles = {
      version: 1,
      profiles: {
        [`${provider}:default`]: { type: 'api_key', provider, key: llm_api_key },
      },
      lastGood: {},
      usageStats: {},
    }
    fs.writeFileSync(path.join(agentDir, 'auth-profiles.json'), JSON.stringify(authProfiles, null, 2))

    // 2. Write system prompt files
    const workspaceDir = path.join(STATE_DIR, '..', 'agentforge-agents', agentId)
    fs.mkdirSync(workspaceDir, { recursive: true })

    if (system_prompt) {
      const prompt = `# Agent: ${name ?? agentId}\n\n${system_prompt}\n`
      fs.writeFileSync(path.join(workspaceDir, 'SOUL.md'), prompt)
      fs.writeFileSync(path.join(workspaceDir, 'IDENTITY.md'), prompt)

      // Also write to the main/defaults workspace so OpenClaw picks it up
      const config = readJSON(CLAWD_CONFIG)
      const mainWorkspace =
        config.agents?.defaults?.workspace ??
        config.agents?.list?.find((a) => a.id === 'main')?.workspace ??
        path.join(process.env.HOME ?? '/tmp', 'clawd')
      if (fs.existsSync(mainWorkspace)) {
        fs.writeFileSync(path.join(mainWorkspace, 'SOUL.md'), prompt)
        fs.writeFileSync(path.join(mainWorkspace, 'IDENTITY.md'), prompt)
        console.log('[webhook] wrote SOUL.md to main workspace:', mainWorkspace)
      }
    }

    // 3. Update clawdbot.json
    const config = readJSON(CLAWD_CONFIG)
    config.agents = config.agents ?? {}
    const agents = config.agents.list ?? []

    if (!agents.find((a) => a.id === agentId)) {
      agents.push({
        id: agentId,
        name: name ?? agentId,
        workspace: workspaceDir,
        agentDir,
        model: llm_model,
      })
    } else {
      const idx = agents.findIndex((a) => a.id === agentId)
      agents[idx] = { ...agents[idx], name: name ?? agentId, model: llm_model, workspace: workspaceDir, agentDir }
    }
    config.agents.list = agents

    // 4. Bind agent to Telegram default channel
    const bindings = config.bindings ?? []
    const tgIdx = bindings.findIndex((b) => b.match?.channel === 'telegram' && b.match?.accountId === 'default')
    const tgBinding = { agentId, match: { channel: 'telegram', accountId: 'default' } }
    if (tgIdx >= 0) bindings[tgIdx] = tgBinding
    else bindings.push(tgBinding)
    config.bindings = bindings

    // 5. Update Telegram bot token if provided
    if (telegram_bot_token) {
      config.channels = config.channels ?? {}
      config.channels.telegram = config.channels.telegram ?? {}
      config.channels.telegram.botToken = telegram_bot_token
      config.channels.telegram.enabled = true
      console.log('[webhook] updated Telegram bot token')
    }

    writeJSON(CLAWD_CONFIG, config)
    console.log(`[webhook] agent ${agentId} registered`)

    // 5. Restart gateway to pick up new agent
    restartGateway()

    send(res, 200, { ok: true, agentId })
  } catch (err) {
    console.error('[webhook] register error:', err)
    send(res, 500, { error: String(err) })
  }
}

async function handleDeregister(req, res) {
  let body
  try { body = await readBody(req) } catch {
    return send(res, 400, { error: 'Invalid JSON body' })
  }

  const { agentId } = body
  if (!agentId) return send(res, 400, { error: 'Missing agentId' })

  if (!fs.existsSync(CLAWD_CONFIG)) {
    return send(res, 200, { ok: true, note: 'clawdbot.json not found — nothing to remove' })
  }

  try {
    const config = readJSON(CLAWD_CONFIG)
    if (config.agents?.list) {
      config.agents.list = config.agents.list.filter((a) => a.id !== agentId)
    }
    if (config.bindings) {
      config.bindings = config.bindings.filter((b) => b.agentId !== agentId)
    }
    writeJSON(CLAWD_CONFIG, config)
    console.log(`[webhook] agent ${agentId} removed`)
    restartGateway()
    send(res, 200, { ok: true, agentId })
  } catch (err) {
    console.error('[webhook] deregister error:', err)
    send(res, 500, { error: String(err) })
  }
}

// ── server ────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = req.url?.split('?')[0]

  // Health check — no auth required
  if (req.method === 'GET' && url === '/') {
    return handleHealth(res)
  }

  // All other routes require auth
  if (!authorized(req)) {
    return send(res, 401, { error: 'Unauthorized' })
  }

  if (req.method === 'POST' && url === '/agentforge/register') {
    return handleRegister(req, res)
  }

  if (req.method === 'POST' && url === '/agentforge/deregister') {
    return handleDeregister(req, res)
  }

  send(res, 404, { error: 'Not found' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[webhook] AgentForge webhook server listening on :${PORT}`)
  console.log(`[webhook] STATE_DIR: ${STATE_DIR}`)
  console.log(`[webhook] CLAWD_CONFIG: ${CLAWD_CONFIG}`)
  console.log(`[webhook] OPENCLAW_BIN: ${OPENCLAW_BIN}`)
  console.log(`[webhook] Auth: ${TOKEN ? 'token set' : 'NO TOKEN — open access!'}`)
})
