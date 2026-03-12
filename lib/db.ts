import path from 'path'
import fs from 'fs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any

// In-memory fallback store used when better-sqlite3 is unavailable (e.g. Vercel serverless)
const memStore: {
  agents: Record<string, Record<string, unknown>>
  events: Array<Record<string, unknown>>
  approvals: Record<string, Record<string, unknown>>
} = { agents: {}, events: [], approvals: {} }

let _db: AnyDB | null = null
let _useMem = false

function getDb(): AnyDB {
  if (_useMem) return null
  if (_db) return _db

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3')

    const DB_PATH = process.env.DATABASE_PATH
      ? path.resolve(process.env.DATABASE_PATH)
      : process.env.OPENCLAW_STATE_DIR
        ? path.join(path.resolve(process.env.OPENCLAW_STATE_DIR.replace('~', process.env.HOME ?? '')), 'agents.db')
        : path.join(process.cwd(), '.data', 'agents.db')

    const DB_DIR = path.dirname(DB_PATH)
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    migrate(_db)
    return _db
  } catch {
    console.warn('[db] better-sqlite3 unavailable, using in-memory store')
    _useMem = true
    return null
  }
}

function migrate(db: AnyDB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      owner_address TEXT NOT NULL,
      name TEXT NOT NULL,
      template_id TEXT NOT NULL,
      llm_provider TEXT NOT NULL,
      llm_model TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      spending_limit_monthly REAL,
      spending_limit_per_tx REAL,
      onchain_address TEXT,
      telegram_bot_token TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS pending_approvals (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL,
      from_chain TEXT,
      to_chain TEXT,
      from_token TEXT,
      to_token TEXT,
      lifi_quote TEXT,
      status TEXT DEFAULT 'pending',
      tx_hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `)
}

export function getAllAgents(ownerAddress?: string) {
  const db = getDb()
  if (!db) {
    const all = Object.values(memStore.agents)
    return ownerAddress ? all.filter((a) => a.owner_address === ownerAddress) : all
  }
  if (ownerAddress) {
    return db.prepare('SELECT * FROM agents WHERE owner_address = ? ORDER BY created_at DESC').all(ownerAddress)
  }
  return db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all()
}

export function getAgent(id: string) {
  const db = getDb()
  if (!db) return memStore.agents[id] ?? null
  return db.prepare('SELECT * FROM agents WHERE id = ?').get(id)
}

export function createAgent(agent: {
  id: string
  owner_address: string
  name: string
  template_id: string
  llm_provider: string
  llm_model: string
  system_prompt: string
  spending_limit_monthly: number | null
  spending_limit_per_tx: number | null
  telegram_bot_token?: string | null
}) {
  const db = getDb()
  if (!db) {
    memStore.agents[agent.id] = {
      ...agent,
      onchain_address: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return
  }
  db.prepare(`
    INSERT INTO agents (id, owner_address, name, template_id, llm_provider, llm_model, system_prompt, spending_limit_monthly, spending_limit_per_tx, telegram_bot_token)
    VALUES (@id, @owner_address, @name, @template_id, @llm_provider, @llm_model, @system_prompt, @spending_limit_monthly, @spending_limit_per_tx, @telegram_bot_token)
  `).run({ ...agent, telegram_bot_token: agent.telegram_bot_token ?? null })
}

export function updateAgent(id: string, fields: Partial<{
  status: string
  onchain_address: string
  name: string
}>) {
  const db = getDb()
  if (!db) {
    if (memStore.agents[id]) {
      Object.assign(memStore.agents[id], fields, { updated_at: new Date().toISOString() })
    }
    return
  }
  const sets = Object.keys(fields).map((k) => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE agents SET ${sets}, updated_at = datetime('now') WHERE id = @id`).run({ ...fields, id })
}

export function deleteAgent(id: string) {
  const db = getDb()
  if (!db) {
    delete memStore.agents[id]
    memStore.events.filter((e) => e.agent_id !== id)
    return
  }
  db.prepare('DELETE FROM agent_events WHERE agent_id = ?').run(id)
  db.prepare('DELETE FROM agents WHERE id = ?').run(id)
}

export function addEvent(event: {
  agent_id: string
  event_type: string
  payload?: string
}) {
  const db = getDb()
  if (!db) {
    memStore.events.push({ ...event, id: Date.now(), created_at: new Date().toISOString() })
    return
  }
  db.prepare(`
    INSERT INTO agent_events (agent_id, event_type, payload)
    VALUES (@agent_id, @event_type, @payload)
  `).run(event)
}

export function getEvents(agentId: string, limit = 50) {
  const db = getDb()
  if (!db) return memStore.events.filter((e) => e.agent_id === agentId).slice(-limit)
  return db.prepare('SELECT * FROM agent_events WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?').all(agentId, limit)
}

export function getSpendingByDay(agentId: string, days = 7): { day: string; spend: number }[] {
  const db = getDb()

  const result: { day: string; spend: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    result.push({ day: label, spend: 0 })
  }

  if (!db) return result

  const iso = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    return d.toISOString().split('T')[0]
  }

  const rows = db.prepare(`
    SELECT
      date(created_at) as day,
      SUM(COALESCE(CAST(json_extract(payload, '$.amount') AS REAL), 0)) as spend
    FROM agent_events
    WHERE agent_id = ?
      AND event_type = 'payment'
      AND created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all(agentId, days) as { day: string; spend: number }[]

  for (let i = days - 1; i >= 0; i--) {
    const dayIso = iso(i)
    const found = rows.find((r) => r.day === dayIso)
    result[days - 1 - i].spend = found?.spend ?? 0
  }

  return result
}

// ── Pending Approvals ────────────────────────────────────────────────────────

export type PendingApproval = {
  id: string
  agent_id: string
  action_type: 'payment' | 'rebalance' | 'bridge'
  description: string
  amount?: number
  from_chain?: string
  to_chain?: string
  from_token?: string
  to_token?: string
  lifi_quote?: string
  status: 'pending' | 'approved' | 'rejected'
  tx_hash?: string
  created_at: string
}

export function getApprovals(agentId: string, status?: string): PendingApproval[] {
  const db = getDb()
  if (!db) {
    const all = Object.values(memStore.approvals) as PendingApproval[]
    return all.filter((a) => a.agent_id === agentId && (!status || a.status === status))
  }
  if (status) {
    return db.prepare('SELECT * FROM pending_approvals WHERE agent_id = ? AND status = ? ORDER BY created_at DESC').all(agentId, status) as PendingApproval[]
  }
  return db.prepare('SELECT * FROM pending_approvals WHERE agent_id = ? ORDER BY created_at DESC').all(agentId) as PendingApproval[]
}

export function createApproval(approval: Omit<PendingApproval, 'status' | 'created_at'>) {
  const db = getDb()
  if (!db) {
    memStore.approvals[approval.id] = { ...approval, status: 'pending', created_at: new Date().toISOString() }
    return
  }
  db.prepare(`
    INSERT INTO pending_approvals (id, agent_id, action_type, description, amount, from_chain, to_chain, from_token, to_token, lifi_quote)
    VALUES (@id, @agent_id, @action_type, @description, @amount, @from_chain, @to_chain, @from_token, @to_token, @lifi_quote)
  `).run(approval)
}

export function updateApproval(id: string, fields: { status: 'approved' | 'rejected'; tx_hash?: string }) {
  const db = getDb()
  if (!db) {
    if (memStore.approvals[id]) Object.assign(memStore.approvals[id], fields)
    return
  }
  if (fields.tx_hash) {
    db.prepare('UPDATE pending_approvals SET status = @status, tx_hash = @tx_hash WHERE id = @id').run({ ...fields, id })
  } else {
    db.prepare('UPDATE pending_approvals SET status = @status WHERE id = @id').run({ status: fields.status, id })
  }
}
