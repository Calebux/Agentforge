import path from 'path'
import fs from 'fs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any

// In-memory fallback store used when better-sqlite3 is unavailable (e.g. Vercel serverless)
const memStore: {
  agents: Record<string, Record<string, unknown>>
  events: Array<Record<string, unknown>>
} = { agents: {}, events: [] }

let _db: AnyDB | null = null
let _useMem = false

function getDb(): AnyDB {
  if (_useMem) return null
  if (_db) return _db

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3')

    const DB_DIR = process.env.OPENCLAW_STATE_DIR
      ? path.resolve(process.env.OPENCLAW_STATE_DIR.replace('~', process.env.HOME ?? ''))
      : path.join(process.cwd(), '.data')

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }

    const DB_PATH = path.join(DB_DIR, 'agents.db')
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
    INSERT INTO agents (id, owner_address, name, template_id, llm_provider, llm_model, system_prompt, spending_limit_monthly, spending_limit_per_tx)
    VALUES (@id, @owner_address, @name, @template_id, @llm_provider, @llm_model, @system_prompt, @spending_limit_monthly, @spending_limit_per_tx)
  `).run(agent)
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
