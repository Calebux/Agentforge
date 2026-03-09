import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const OPENCLAW_BIN = process.env.OPENCLAW_BIN ?? 'openclaw'
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_OPENCLAW === 'true'

const STATE_DIR = (process.env.OPENCLAW_STATE_DIR ?? '~/.openclaw').replace(
  '~',
  process.env.HOME ?? ''
)

export async function startAgent(agentId: string, configPath: string) {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return { stdout: `Agent ${agentId} started (mock)`, stderr: '' }
  }
  const { stdout, stderr } = await execAsync(
    `${OPENCLAW_BIN} agent --agent ${agentId} --config ${configPath}`
  )
  return { stdout, stderr }
}

export async function stopAgent(agentId: string) {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return
  }
  await execAsync(`${OPENCLAW_BIN} agents stop ${agentId}`)
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
  const { stdout } = await execAsync(
    `${OPENCLAW_BIN} logs --agent ${agentId} --lines ${lines}`
  )
  return stdout
}

export async function getGatewayHealth() {
  if (MOCK_MODE) {
    return { status: 'ok', version: 'mock', uptime: 9999 }
  }
  const { stdout } = await execAsync(`${OPENCLAW_BIN} health`)
  // OpenClaw returns plain text, not JSON — parse it into a structured object
  try {
    return JSON.parse(stdout)
  } catch {
    const lines = stdout.trim().split('\n')
    const result: Record<string, string> = { status: 'ok', raw: stdout }
    for (const line of lines) {
      const [key, ...rest] = line.split(':')
      if (key && rest.length) result[key.trim().toLowerCase()] = rest.join(':').trim()
    }
    return result
  }
}

export function writeAgentConfig(
  agentId: string,
  config: {
    name: string
    llm_provider: string
    llm_model: string
    system_prompt: string
    spending_limit_monthly: number | null
    spending_limit_per_tx: number | null
  }
) {
  const agentsDir = path.join(STATE_DIR, 'agents')
  if (!fs.existsSync(agentsDir)) {
    fs.mkdirSync(agentsDir, { recursive: true })
  }
  const configPath = path.join(agentsDir, `${agentId}.json`)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  return configPath
}
