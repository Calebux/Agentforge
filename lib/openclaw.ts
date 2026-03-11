import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const OPENCLAW_BIN = process.env.OPENCLAW_BIN ?? 'openclaw'
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_OPENCLAW === 'true'

// OpenClaw state dir is ~/.clawdbot (not ~/.openclaw)
const STATE_DIR = (process.env.OPENCLAW_STATE_DIR ?? '~/.clawdbot').replace(
  '~',
  process.env.HOME ?? ''
)

const CLAWD_CONFIG = path.join(STATE_DIR, 'clawdbot.json')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readClawdConfig(): any {
  return JSON.parse(fs.readFileSync(CLAWD_CONFIG, 'utf-8'))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeClawdConfig(config: any) {
  // Write atomically: backup then overwrite
  fs.copyFileSync(CLAWD_CONFIG, `${CLAWD_CONFIG}.agentforge.bak`)
  fs.writeFileSync(CLAWD_CONFIG, JSON.stringify(config, null, 2))
}

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

  // If clawdbot.json doesn't exist, OpenClaw is not installed on this host — skip silently
  if (!fs.existsSync(CLAWD_CONFIG)) {
    console.warn('[openclaw] clawdbot.json not found — skipping OpenClaw registration')
    return { stdout: `Agent ${agentId} saved (OpenClaw unavailable)`, stderr: '' }
  }

  // 1. Create agent directory
  const agentDir = path.join(STATE_DIR, 'agents', agentId, 'agent')
  fs.mkdirSync(agentDir, { recursive: true })

  // 2. Write auth-profiles.json with the user's LLM API key
  // OpenClaw provider names: 'openai', 'anthropic', 'google'
  const provider = config.llm_provider.toLowerCase()
  const authProfiles = {
    version: 1,
    profiles: {
      [`${provider}:default`]: {
        type: 'api_key',
        provider,
        key: config.llm_api_key,
      },
    },
    lastGood: {},
    usageStats: {},
  }
  fs.writeFileSync(
    path.join(agentDir, 'auth-profiles.json'),
    JSON.stringify(authProfiles, null, 2)
  )

  // 3. Add agent to clawdbot.json agents.list
  const clawdConfig = readClawdConfig()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents: any[] = clawdConfig.agents?.list ?? []

  if (!agents.find((a) => a.id === agentId)) {
    // Use a separate directory outside the main clawd workspace to avoid inheriting its identity
    const workspaceDir = path.join(process.env.HOME ?? '/tmp', 'agentforge-agents', agentId)
    agents.push({
      id: agentId,
      name: config.name,
      workspace: workspaceDir,
      agentDir,
      model: config.llm_model,
    })

    // 4. Create workspace and write system prompt
    fs.mkdirSync(workspaceDir, { recursive: true })

    if (config.system_prompt) {
      const prompt = `# Agent: ${config.name}\n\n${config.system_prompt}\n`
      fs.writeFileSync(path.join(workspaceDir, 'SOUL.md'), prompt)
      fs.writeFileSync(path.join(workspaceDir, 'IDENTITY.md'), prompt)

      // Also overwrite the main workspace SOUL.md so OpenClaw picks it up on restart
      // (OpenClaw loads identity from the default agent workspace regardless of routing)
      const mainWorkspace = clawdConfig.agents?.defaults?.workspace
        ?? clawdConfig.agents?.list?.find((a: any) => a.id === 'main')?.workspace
        ?? path.join(process.env.HOME ?? '/tmp', 'clawd')
      if (fs.existsSync(mainWorkspace)) {
        fs.writeFileSync(path.join(mainWorkspace, 'SOUL.md'), prompt)
      }
    }

    clawdConfig.agents = clawdConfig.agents ?? {}
    clawdConfig.agents.list = agents

    // Bind the new agent to Telegram default, replacing any existing Telegram binding
    const bindings: any[] = clawdConfig.bindings ?? []
    const telegramIdx = bindings.findIndex(
      (b: any) => b.match?.channel === 'telegram' && b.match?.accountId === 'default'
    )
    const telegramBinding = { agentId, match: { channel: 'telegram', accountId: 'default' } }
    if (telegramIdx >= 0) {
      bindings[telegramIdx] = telegramBinding
    } else {
      bindings.push(telegramBinding)
    }
    clawdConfig.bindings = bindings

    writeClawdConfig(clawdConfig)
  }

  // After writing config, restart the gateway so it picks up the new agent
  await ensureGatewayRunning()

  return { stdout: `Agent ${agentId} registered in OpenClaw`, stderr: '' }
}

// Restart the OpenClaw gateway so it picks up new agent configs
export async function ensureGatewayRunning(): Promise<void> {
  if (MOCK_MODE || !fs.existsSync(CLAWD_CONFIG)) return
  try {
    const { stdout, stderr } = await execAsync(`${OPENCLAW_BIN} gateway restart`)
    console.log('[openclaw] gateway restart:', stdout || stderr)
  } catch (err) {
    console.warn('[openclaw] gateway restart failed (continuing):', err)
  }
}

export async function stopAgent(agentId: string) {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return
  }

  if (!fs.existsSync(CLAWD_CONFIG)) return

  const clawdConfig = readClawdConfig()

  // Remove from agents list
  if (clawdConfig.agents?.list) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clawdConfig.agents.list = clawdConfig.agents.list.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.id !== agentId
    )
  }

  // Remove any bindings for this agent
  if (clawdConfig.bindings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clawdConfig.bindings = clawdConfig.bindings.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.agentId !== agentId
    )
  }

  writeClawdConfig(clawdConfig)
}

export async function getAgentLogs(agentId: string, lines = 50) {
  if (MOCK_MODE) {
    const now = new Date()
    return Array.from({ length: 5 }, (_, i) => {
      const ts = new Date(now.getTime() - i * 30000).toISOString()
      return `[${ts}] [INFO] Agent ${agentId}: mock log line ${5 - i}`
    })
      .reverse()
      .join('\n')
  }

  // Read from the shared gateway log, filtering for this agent's ID
  const logPath = path.join(STATE_DIR, 'logs', 'gateway.log')
  try {
    const { stdout } = await execAsync(
      `tail -n ${lines * 10} "${logPath}" 2>/dev/null`
    )
    const filtered = stdout
      .split('\n')
      .filter((l) => l.includes(agentId))
      .slice(-lines)
      .join('\n')
    // Fall back to last N lines of gateway log if no agent-specific lines
    return filtered || stdout.split('\n').slice(-lines).join('\n')
  } catch {
    return `No logs available for agent ${agentId}`
  }
}

const GATEWAY_PORT = 18789

export async function getGatewayHealth() {
  if (MOCK_MODE) {
    return { status: 'ok', version: 'mock', uptime: 9999 }
  }

  // Direct HTTP probe — any response (even 401/404) means gateway is up
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch(`http://localhost:${GATEWAY_PORT}`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
    return { status: 'online', httpStatus: res.status, port: GATEWAY_PORT }
  } catch (err: unknown) {
    clearTimeout(timer)
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Gateway not responding on port ${GATEWAY_PORT}: ${msg}`)
  }
}
