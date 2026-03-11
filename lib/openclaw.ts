import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const OPENCLAW_BIN = process.env.OPENCLAW_BIN ?? 'openclaw'
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_OPENCLAW === 'true'

// Remote VPS gateway (preferred) — set OPENCLAW_GATEWAY_URL to use
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL?.replace(/\/$/, '')
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN ?? ''

// Local state dir (fallback when running OpenClaw on the same machine)
const STATE_DIR = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace(
  '~',
  process.env.HOME ?? ''
)
const CLAWD_CONFIG = path.join(STATE_DIR, 'clawdbot.json')

// ── Remote gateway helpers ──────────────────────────────────────────────────

function gatewayHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {}),
  }
}

async function gatewayFetch(endpoint: string, init?: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
      ...init,
      headers: { ...gatewayHeaders(), ...(init?.headers ?? {}) },
      signal: controller.signal,
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

// ── Local config helpers (same-machine mode) ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readClawdConfig(): any {
  return JSON.parse(fs.readFileSync(CLAWD_CONFIG, 'utf-8'))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeClawdConfig(config: any) {
  fs.copyFileSync(CLAWD_CONFIG, `${CLAWD_CONFIG}.agentforge.bak`)
  fs.writeFileSync(CLAWD_CONFIG, JSON.stringify(config, null, 2))
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function startAgent(
  agentId: string,
  config: {
    name: string
    llm_provider: string
    llm_model: string
    llm_api_key: string
    system_prompt?: string
  }
) {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return { stdout: `Agent ${agentId} started (mock)`, stderr: '' }
  }

  // Remote VPS mode: POST agent config to the VPS webhook
  if (GATEWAY_URL) {
    const res = await gatewayFetch('/agentforge/register', {
      method: 'POST',
      body: JSON.stringify({ agentId, ...config }),
    })
    if (!res.ok) {
      console.warn('[openclaw] Remote agent register failed:', res.status)
    }
    return { stdout: `Agent ${agentId} registered on remote gateway`, stderr: '' }
  }

  // Local mode: write config files directly
  if (!fs.existsSync(CLAWD_CONFIG)) {
    console.warn('[openclaw] clawdbot.json not found — skipping OpenClaw registration')
    return { stdout: `Agent ${agentId} saved (OpenClaw unavailable)`, stderr: '' }
  }

  const agentDir = path.join(STATE_DIR, 'agents', agentId, 'agent')
  fs.mkdirSync(agentDir, { recursive: true })

  const provider = config.llm_provider.toLowerCase()
  const authProfiles = {
    version: 1,
    profiles: {
      [`${provider}:default`]: { type: 'api_key', provider, key: config.llm_api_key },
    },
    lastGood: {},
    usageStats: {},
  }
  fs.writeFileSync(path.join(agentDir, 'auth-profiles.json'), JSON.stringify(authProfiles, null, 2))

  const clawdConfig = readClawdConfig()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents: any[] = clawdConfig.agents?.list ?? []

  if (!agents.find((a) => a.id === agentId)) {
    const workspaceDir = path.join(process.env.HOME ?? '/tmp', 'agentforge-agents', agentId)
    agents.push({ id: agentId, name: config.name, workspace: workspaceDir, agentDir, model: config.llm_model })

    fs.mkdirSync(workspaceDir, { recursive: true })

    if (config.system_prompt) {
      const prompt = `# Agent: ${config.name}\n\n${config.system_prompt}\n`
      fs.writeFileSync(path.join(workspaceDir, 'SOUL.md'), prompt)
      fs.writeFileSync(path.join(workspaceDir, 'IDENTITY.md'), prompt)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mainWorkspace = clawdConfig.agents?.defaults?.workspace ?? clawdConfig.agents?.list?.find((a: any) => a.id === 'main')?.workspace ?? path.join(process.env.HOME ?? '/tmp', 'clawd')
      if (fs.existsSync(mainWorkspace)) {
        fs.writeFileSync(path.join(mainWorkspace, 'SOUL.md'), prompt)
      }
    }

    clawdConfig.agents = clawdConfig.agents ?? {}
    clawdConfig.agents.list = agents

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bindings: any[] = clawdConfig.bindings ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const telegramIdx = bindings.findIndex((b: any) => b.match?.channel === 'telegram' && b.match?.accountId === 'default')
    const telegramBinding = { agentId, match: { channel: 'telegram', accountId: 'default' } }
    if (telegramIdx >= 0) bindings[telegramIdx] = telegramBinding
    else bindings.push(telegramBinding)
    clawdConfig.bindings = bindings

    writeClawdConfig(clawdConfig)

    // Restart gateway so it picks up the new agent
    await ensureGatewayRunning()
  }

  return { stdout: `Agent ${agentId} registered in OpenClaw`, stderr: '' }
}

export async function stopAgent(agentId: string) {
  if (MOCK_MODE) { await new Promise((resolve) => setTimeout(resolve, 500)); return }

  if (GATEWAY_URL) {
    await gatewayFetch('/agentforge/deregister', {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    }).catch((err) => console.warn('[openclaw] deregister failed (non-fatal):', err))
    return
  }

  if (!fs.existsSync(CLAWD_CONFIG)) return

  const clawdConfig = readClawdConfig()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (clawdConfig.agents?.list) clawdConfig.agents.list = clawdConfig.agents.list.filter((a: any) => a.id !== agentId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (clawdConfig.bindings) clawdConfig.bindings = clawdConfig.bindings.filter((b: any) => b.agentId !== agentId)
  writeClawdConfig(clawdConfig)
}

export async function getAgentLogs(agentId: string, lines = 50) {
  if (MOCK_MODE) {
    const now = new Date()
    return Array.from({ length: 5 }, (_, i) => {
      const ts = new Date(now.getTime() - i * 30000).toISOString()
      return `[${ts}] [INFO] Agent ${agentId}: mock log line ${5 - i}`
    }).reverse().join('\n')
  }

  const logPath = path.join(STATE_DIR, 'logs', 'gateway.log')
  try {
    const { stdout } = await execAsync(`tail -n ${lines * 10} "${logPath}" 2>/dev/null`)
    const filtered = stdout.split('\n').filter((l) => l.includes(agentId)).slice(-lines).join('\n')
    return filtered || stdout.split('\n').slice(-lines).join('\n')
  } catch {
    return `No logs available for agent ${agentId}`
  }
}

export async function getGatewayHealth() {
  if (MOCK_MODE) return { status: 'ok', version: 'mock', uptime: 9999 }

  // Remote VPS mode: probe the gateway HTTP port
  if (GATEWAY_URL) {
    const res = await gatewayFetch('/')
    return { status: 'online', httpStatus: res.status, url: GATEWAY_URL }
  }

  // Local mode: direct HTTP probe on default port
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch('http://localhost:18789', { signal: controller.signal })
    clearTimeout(timer)
    return { status: 'online', httpStatus: res.status, port: 18789 }
  } catch (err: unknown) {
    clearTimeout(timer)
    throw new Error(`Gateway not responding: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export async function ensureGatewayRunning(): Promise<void> {
  if (MOCK_MODE || !fs.existsSync(CLAWD_CONFIG)) return
  try {
    await execAsync(`${OPENCLAW_BIN} gateway restart`)
    console.log('[openclaw] gateway restarted')
  } catch (err) {
    console.warn('[openclaw] gateway restart failed (continuing):', err)
  }
}
