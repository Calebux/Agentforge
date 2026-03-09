import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = process.env.OPENCLAW_STATE_DIR
  ? path.resolve(process.env.OPENCLAW_STATE_DIR.replace('~', process.env.HOME ?? ''))
  : path.join(process.cwd(), '.data')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const DB_PATH = path.join(DB_DIR, 'agents.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    migrate(_db)
  }
  return _db
}

function migrate(db: Database.Database) {
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
  if (ownerAddress) {
    return db
      .prepare('SELECT * FROM agents WHERE owner_address = ? ORDER BY created_at DESC')
      .all(ownerAddress)
  }
  return db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all()
}

export function getAgent(id: string) {
  const db = getDb()
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
  const sets = Object.keys(fields).map((k) => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE agents SET ${sets}, updated_at = datetime('now') WHERE id = @id`)
    .run({ ...fields, id })
}

export function deleteAgent(id: string) {
  const db = getDb()
  db.prepare('DELETE FROM agent_events WHERE agent_id = ?').run(id)
  db.prepare('DELETE FROM agents WHERE id = ?').run(id)
}

export function addEvent(event: {
  agent_id: string
  event_type: string
  payload?: string
}) {
  const db = getDb()
  db.prepare(`
    INSERT INTO agent_events (agent_id, event_type, payload)
    VALUES (@agent_id, @event_type, @payload)
  `).run(event)
}

export function getEvents(agentId: string, limit = 50) {
  const db = getDb()
  return db
    .prepare('SELECT * FROM agent_events WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(agentId, limit)
}

export function getSpendingByDay(agentId: string, days = 7): { day: string; spend: number }[] {
  const db = getDb()
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

  // Fill in every day in the window (including zeros)
  const result: { day: string; spend: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    const found = rows.find((r) => r.day === iso)
    result.push({ day: label, spend: found?.spend ?? 0 })
  }
  return result
}
